import type { SupabaseClient } from "../db/supabase.client";
import { errorLogger, appLogger } from "./logger";
import type {
  DetailedSummary,
  PaginatedResponse,
  SummaryBasic,
  SummaryData,
  SummaryStatus,
  SummaryWithVideo,
  BulkGenerationStatus,
  BulkGenerationResponse,
} from "../types";
import { extractYouTubeVideoId } from "./youtube.utils";
import { fetchYouTubeVideoMetadata, fetchLatestVideoFromChannel } from "./youtube.service";
import { OpenRouterService } from "./openrouter.service";
import { fetchTranscript, transcriptToString } from "./transcript.service";
import { requireEnv, getEnv, type RuntimeEnv } from "./env";
import { createVideoSummaryPrompt } from "./prompts/video-summary.prompt";

// ---------------------------------------------------------------------------
// Szybki i równomierny 32-bitowy hash (FNV-1a) – idealny do advisory locków
// ---------------------------------------------------------------------------
function hashStringToInt32(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0; // unsigned 32-bit
}

// ---------------------------------------------------------------------------
// Format duration in seconds to Polish text
// ---------------------------------------------------------------------------
function formatDurationInPolish(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    if (hours === 1) {
      parts.push("1 hour");
    } else {
      parts.push(`${hours} godzin`);
    }
  }

  if (minutes > 0) {
    if (minutes === 1) {
      parts.push("1 minute");
    } else {
      parts.push(`${minutes} minutes`);
    }
  }

  if (secs > 0 && hours === 0) {
    if (secs === 1) {
      parts.push("1 second");
    } else {
      parts.push(`${secs} seconds`);
    }
  }

  return parts.length > 0 ? parts.join(" ") : "0 seconds";
}

// ---------------------------------------------------------------------------
// Główna funkcja – generowanie podsumowania (queue-based)
// ---------------------------------------------------------------------------
export async function generateSummary(
  supabase: SupabaseClient,
  userId: string,
  videoUrl: string,
  runtimeEnv?: RuntimeEnv
): Promise<SummaryBasic & { message: string }> {
  appLogger.debug("Starting generateSummary", { userId, videoUrl });

  const youtubeVideoId = extractYouTubeVideoId(videoUrl);
  if (!youtubeVideoId) throw new Error("INVALID_YOUTUBE_URL");

  // -------------------------------------------------
  // 1. Znajdź lub utwórz video + channel
  // -------------------------------------------------
  let videoId: string;
  let channelId: string;

  const { data: existingVideo } = await supabase
    .from("videos")
    .select("id, channel_id")
    .eq("youtube_video_id", youtubeVideoId)
    .maybeSingle();

  if (existingVideo) {
    videoId = existingVideo.id;
    channelId = existingVideo.channel_id;
  } else {
    const meta = await fetchYouTubeVideoMetadata(youtubeVideoId, runtimeEnv);

    if (meta.duration > 2700) throw new Error("VIDEO_TOO_LONG");

    // channel
    const { data: channel } = await supabase
      .from("channels")
      .select("id")
      .eq("youtube_channel_id", meta.channelId)
      .maybeSingle();

    if (channel) {
      channelId = channel.id;
    } else {
      const { data: newChannel, error } = await supabase
        .from("channels")
        .insert({
          youtube_channel_id: meta.channelId,
          name: meta.channelTitle,
        })
        .select("id")
        .single();

      if (error) throw error;
      channelId = newChannel.id;
    }

    // video (z obsługą race-condition)
    const { data: newVideo, error: videoErr } = await supabase
      .from("videos")
      .insert({
        youtube_video_id: youtubeVideoId,
        channel_id: channelId,
        title: meta.title,
        published_at: meta.publishedAt,
        thumbnail_url: meta.thumbnailUrl,
      })
      .select("id")
      .single();

    if (videoErr && videoErr.code !== "23505") throw videoErr;
    if (videoErr?.code === "23505") {
      const { data: retry } = await supabase
        .from("videos")
        .select("id, channel_id")
        .eq("youtube_video_id", youtubeVideoId)
        .single();
      videoId = retry?.id || "";
      channelId = retry?.channel_id || "";
    } else {
      videoId = newVideo?.id || "";
    }
  }

  // -------------------------------------------------
  // 2. Sprawdź subskrypcję
  // -------------------------------------------------
  const { count: subCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("channel_id", channelId);

  if (!subCount) throw new Error("CHANNEL_NOT_SUBSCRIBED");

  // -------------------------------------------------
  // 3. Sprawdź istniejące podsumowanie
  // -------------------------------------------------
  const { data: existingSummary } = await supabase
    .from("summaries")
    .select("id, status")
    .eq("video_id", videoId)
    .maybeSingle();

  if (existingSummary) {
    if (existingSummary.status === "completed") throw new Error("SUMMARY_ALREADY_EXISTS");
    if (["pending", "in_progress"].includes(existingSummary.status)) throw new Error("GENERATION_IN_PROGRESS");

    // For failed summaries, update status back to pending for retry
    if (existingSummary.status === "failed") {
      await supabase.from("summaries").update({ status: "pending", error_code: null }).eq("id", existingSummary.id);
    }
  }

  // -------------------------------------------------
  // 4. Atomowe utworzenie podsumowania (rate-limit + lock)
  // -------------------------------------------------
  const lockKey = hashStringToInt32(channelId);
  const { data: rpcData, error: rpcErr } = await supabase.rpc("generate_summary_atomic", {
    p_user_id: userId,
    p_video_id: videoId,
    p_channel_id: channelId,
    p_lock_key: lockKey,
  });

  if (rpcErr) {
    if (rpcErr.message.includes("GENERATION_LIMIT_REACHED")) throw new Error("GENERATION_LIMIT_REACHED");
    throw rpcErr;
  }

  const summary = (rpcData as unknown[])[0];
  if (!summary?.id) throw new Error("SUMMARY_CREATION_FAILED");

  // -------------------------------------------------
  // 5. Add to queue for async processing (bypasses 30s waitUntil limit)
  // -------------------------------------------------
  // Queue-based processing allows Gradio (5-10 min) to complete without timeout
  const { error: queueError } = await supabase.from("summary_queue").insert({
    video_id: videoId,
    priority: 10, // High priority for individual user requests
    status: "pending",
    max_retries: 3,
  });

  if (queueError) {
    // If queue insert fails (e.g., duplicate), log but continue
    // The summary was already created with pending status
    appLogger.warn("Failed to add to summary_queue (may already exist)", {
      summaryId: summary.id,
      videoId,
      error: queueError.message,
    });
  } else {
    appLogger.info("Summary added to processing queue", {
      summaryId: summary.id,
      videoId,
      priority: 10,
    });
  }

  return {
    id: summary.id,
    status: "pending" as SummaryStatus,
    generated_at: null,
    message: "Summary queued for generation. This may take 5-10 minutes. Refresh the page to check status.",
  };
}

// ---------------------------------------------------------------------------
// Proces generacji (backend – service role)
// ---------------------------------------------------------------------------
async function processSummaryGeneration(
  summaryId: string,
  youtubeVideoId: string,
  runtimeEnv?: RuntimeEnv
): Promise<void> {
  appLogger.debug("Starting summary generation process", { summaryId, youtubeVideoId });

  const { createSupabaseServiceClient } = await import("../db/supabase.client");
  const service = createSupabaseServiceClient(undefined, runtimeEnv);
  appLogger.debug("Supabase service client created for summary generation");

  try {
    // 1. Fetch video metadata for accurate duration
    appLogger.debug("Fetching video metadata for summary generation");
    const videoMeta = await fetchYouTubeVideoMetadata(youtubeVideoId, runtimeEnv);
    const actualDuration = formatDurationInPolish(videoMeta.duration);
    appLogger.debug("Video metadata fetched", { duration: actualDuration, durationSeconds: videoMeta.duration });

    // 2. Transkrypt
    appLogger.debug("Fetching transcript for summary generation");
    const transcript = await fetchTranscript(youtubeVideoId, runtimeEnv);
    appLogger.debug("Transcript fetched", { segments: transcript.length });

    const text = transcriptToString(transcript);
    appLogger.debug("Transcript converted to text", { textLength: text.length });

    if (!text.trim()) {
      appLogger.warning("Empty transcript detected", { summaryId, youtubeVideoId });
      throw new Error("TRANSCRIPT_EMPTY");
    }

    // 3. Status → in_progress
    appLogger.debug("Updating summary status to in_progress");
    const { error: updateError } = await service
      .from("summaries")
      .update({ status: "in_progress" })
      .eq("id", summaryId);
    if (updateError) {
      errorLogger.dbError(updateError, "update_summary_status", { summaryId });
    } else {
      appLogger.debug("Summary status updated to in_progress", { summaryId });
    }

    // 3. OpenRouter
    appLogger.debug("Calling OpenRouter for summary generation");
    const apiKey = requireEnv("OPENROUTER_API_KEY", runtimeEnv);
    appLogger.debug("OpenRouter API key validated");

    const openRouter = new OpenRouterService({
      apiKey,
      defaultModel: getEnv("OPENROUTER_MODEL", runtimeEnv) || "x-ai/grok-4.1-fast",
    });

    const schema = {
      name: "youtube_video_summary",
      strict: true,
      schema: {
        type: "object",
        properties: {
          tldr: { type: "string" },
          full_summary: {
            type: "object",
            properties: {
              genre: {
                type: "string",
                enum: [
                  "Geopolitics",
                  "Finance & Investing",
                  "Personal Finance",
                  "Economics",
                  "Technology",
                  "AI & Machine Learning",
                  "Science",
                  "History",
                  "Philosophy",
                  "Self-Improvement",
                  "Productivity",
                  "Health & Fitness",
                  "Psychology",
                  "Business & Entrepreneurship",
                  "Startups",
                  "Crypto & Blockchain",
                  "Programming & Coding",
                  "Book Summary",
                  "Documentary",
                  "News & Current Events",
                  "Comedy",
                  "Lifestyle",
                  "Travel",
                  "Gaming",
                  "Movie Review",
                  "Reaction",
                  "Education",
                  "Tutorial / How-to",
                  "Vlog",
                  "Interview",
                  "Podcast Clip",
                  "Conspiracy / Alternative",
                  "Spirituality",
                  "Other",
                ],
              },
              key_points: { type: "array", items: { type: "string" } },
              detailed_summary: { type: "string" },
              conclusions: { type: "array", items: { type: "string" } },
              memorable_quotes: { type: "array", items: { type: "string" } },
              duration: { type: "string" },
              language: { type: "string" },
              worth_watching: {
                type: "string",
                enum: ["highly_recommended", "recommended", "neutral", "not_recommended"],
              },
              content_density_rating: {
                type: "string",
                enum: ["low", "medium", "high", "very_high"],
              },
            },
            required: [
              "genre",
              "key_points",
              "detailed_summary",
              "conclusions",
              "memorable_quotes",
              "duration",
              "language",
              "worth_watching",
              "content_density_rating",
            ],
            additionalProperties: false,
          },
        },
        required: ["tldr", "full_summary"],
        additionalProperties: false,
      },
    } as const;

    const messages = createVideoSummaryPrompt({
      youtubeVideoId,
      actualDuration,
      text,
    });

    appLogger.debug("Calling OpenRouter completeJson API");
    const result = await openRouter.completeJson<{
      tldr: string;
      full_summary: {
        genre: string;
        key_points: string[];
        detailed_summary: string;
        conclusions: string[];
        memorable_quotes: string[];
        duration: string;
        language: string;
        worth_watching: string;
        content_density_rating: string;
      };
    }>(messages, schema);
    appLogger.debug("OpenRouter response received", {
      tldrLength: result.tldr?.length,
      fullSummaryKeys: Object.keys(result.full_summary || {}),
    });

    // 4. Zapisz wynik
    appLogger.debug("Saving summary result to database");
    const { error: saveError } = await service
      .from("summaries")
      .update({
        tldr: result.tldr,
        full_summary: result.full_summary,
        status: "completed",
        generated_at: new Date().toISOString(),
      })
      .eq("id", summaryId);

    if (saveError) {
      errorLogger.dbError(saveError, "save_summary_result", { summaryId });
      throw saveError;
    }
    appLogger.info("Summary successfully saved to database", { summaryId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // Don't log transcript errors as application errors - they're expected business cases
    const isTranscriptError =
      msg.includes("transcript") ||
      msg.includes("subtitle") ||
      msg.includes("TRANSCRIPT") ||
      msg === "NO_SUBTITLES" ||
      msg === "TRANSCRIPT_NOT_AVAILABLE" ||
      msg === "TRANSCRIPT_EMPTY";

    if (!isTranscriptError) {
      errorLogger.appError(err, {
        component: "processSummaryGeneration",
        operation: "summary_generation",
        summaryId,
        youtubeVideoId,
      });
    } else {
      appLogger.warn("Summary generation failed due to transcript issues", {
        summaryId,
        youtubeVideoId,
        error: msg,
      });
    }
    let code: "NO_SUBTITLES" | "VIDEO_PRIVATE" | "VIDEO_TOO_LONG" | null = null;
    if (msg.includes("transcript") || msg.includes("subtitle") || msg.includes("TRANSCRIPT")) code = "NO_SUBTITLES";
    else if (msg.includes("private = true") || msg.includes("unavailable")) code = "VIDEO_PRIVATE";
    else if (msg.includes("too long")) code = "VIDEO_TOO_LONG";

    appLogger.debug("Determined error code for summary failure", { summaryId, errorCode: code });

    const { error: failError } = await service
      .from("summaries")
      .update({ status: "failed", error_code: code })
      .eq("id", summaryId);

    if (failError) {
      errorLogger.dbError(failError, "update_failed_status", { summaryId, errorCode: code });
    } else {
      appLogger.debug("Summary status updated to failed", { summaryId, errorCode: code });
    }

    errorLogger.appError(err, {
      service: "summaries_service",
      operation: "process_summary_generation",
      summary_id: summaryId,
      youtube_video_id: youtubeVideoId,
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Lista podsumowań użytkownika
// ---------------------------------------------------------------------------
export async function listSummaries(
  supabase: SupabaseClient,
  userId: string,
  filters: {
    limit: number;
    offset: number;
    channel_id?: string;
    status?: SummaryStatus;
    sort?: "newest" | "oldest";
    include_hidden?: boolean;
    hidden_only?: boolean;
    search?: string;
    generated_at_from?: string;
    generated_at_to?: string;
  }
): Promise<PaginatedResponse<SummaryWithVideo>> {
  const { data: subs } = await supabase.from("subscriptions").select("channel_id").eq("user_id", userId);

  const channelIds = subs?.map((s) => s.channel_id) ?? [];
  if (channelIds.length === 0) {
    return { data: [], pagination: { total: 0, limit: filters.limit, offset: filters.offset } };
  }

  const selectQuery = `
    id,
    tldr,
    status,
    generated_at,
    error_code,
    videos!inner (
      id,
      youtube_video_id,
      title,
      thumbnail_url,
      published_at,
      channel_id,
      channels!inner (
        id,
        name,
        youtube_channel_id,
        created_at
      )
    )
  `;

  let q = supabase.from("summaries").select(selectQuery, { count: "exact" }).in("videos.channel_id", channelIds);

  appLogger.debug("Query before filters applied", { userId, channelCount: channelIds.length });

  // Handle hidden summaries filtering with subqueries
  if (filters.hidden_only) {
    // Show only hidden summaries - check if summary exists in hidden_summaries for this user
    const { data: hiddenSummaryIds } = await supabase
      .from("hidden_summaries")
      .select("summary_id")
      .eq("user_id", userId);

    if (hiddenSummaryIds && hiddenSummaryIds.length > 0) {
      q = q.in(
        "id",
        hiddenSummaryIds.map((h) => h.summary_id)
      );
    } else {
      // No hidden summaries, return empty result
      q = q.eq("id", "00000000-0000-0000-0000-000000000000"); // Impossible ID
    }
  } else if (!filters.include_hidden) {
    // Exclude hidden summaries (default behavior) - ensure summary is NOT in hidden_summaries for this user
    const { data: hiddenSummaryIds } = await supabase
      .from("hidden_summaries")
      .select("summary_id")
      .eq("user_id", userId);

    if (hiddenSummaryIds && hiddenSummaryIds.length > 0) {
      const hiddenIds = hiddenSummaryIds.map((h) => h.summary_id);
      // Use multiple .neq() calls for each hidden ID - more reliable than .not('in')
      for (const hiddenId of hiddenIds) {
        q = q.neq("id", hiddenId);
      }
    }
    // If no hidden summaries, no filtering needed (default behavior)
  }

  if (filters.channel_id) q = q.eq("videos.channel_id", filters.channel_id);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.search) q = q.ilike("videos.title", `%${filters.search}%`);

  if (filters.generated_at_from) q = q.gte("generated_at", filters.generated_at_from);
  if (filters.generated_at_to) q = q.lte("generated_at", filters.generated_at_to);

  appLogger.debug("Query before sorting and range applied", { userId, offset: filters.offset, limit: filters.limit });

  // Apply pagination first (required for complex joins)
  const { data, count, error } = await q.range(filters.offset, filters.offset + filters.limit - 1);
  appLogger.debug("Query executed", { userId, count, dataLength: data?.length, hasError: !!error });
  if (error) throw error;

  // Sort data in memory using generated_at instead of video published_at
  if (data && data.length > 0) {
    const ascending = filters.sort === "oldest";
    data.sort((a, b) => {
      const dateA = new Date(a.generated_at || 0).getTime();
      const dateB = new Date(b.generated_at || 0).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    appLogger.debug("Data sorted in memory by generated_at", {
      userId,
      firstItemDate: data[0]?.generated_at,
      lastItemDate: data[data.length - 1]?.generated_at,
    });
  }

  // Get user ratings for all summaries in this batch
  const summaryIds = (data ?? []).map((row) => row.id).filter((id): id is string => id !== null);
  const { data: userRatings } = await supabase
    .from("summary_ratings")
    .select("summary_id, rating")
    .eq("user_id", userId)
    .in("summary_id", summaryIds);

  // Create a map for quick lookup
  const userRatingMap = new Map<string, boolean>();
  userRatings?.forEach((rating) => {
    if (rating.summary_id) {
      userRatingMap.set(rating.summary_id, rating.rating);
    }
  });

  const result: SummaryWithVideo[] = (data ?? []).map((row: unknown) => ({
    id: row.id,
    video: {
      id: row.videos.id,
      youtube_video_id: row.videos.youtube_video_id,
      title: row.videos.title,
      thumbnail_url: row.videos.thumbnail_url,
      published_at: row.videos.published_at,
    },
    channel: {
      id: row.videos.channels.id,
      name: row.videos.channels.name,
      youtube_channel_id: row.videos.channels.youtube_channel_id,
      created_at: row.videos.channels.created_at,
    },
    tldr: row.tldr,
    status: row.status,
    generated_at: row.generated_at,
    user_rating: userRatingMap.get(row.id) ?? null,
    error_code: row.error_code,
  }));

  return {
    data: result,
    pagination: { total: count ?? 0, limit: filters.limit, offset: filters.offset },
  };
}

// ---------------------------------------------------------------------------
// Szczegóły podsumowania
// ---------------------------------------------------------------------------
export async function getSummaryDetails(
  supabase: SupabaseClient,
  userId: string,
  summaryId: string
): Promise<DetailedSummary> {
  const { data: summary, error } = await supabase
    .from("summaries")
    .select(
      `
      id,
      tldr,
      full_summary,
      status,
      error_code,
      generated_at,
      videos!inner (
        id,
        youtube_video_id,
        title,
        thumbnail_url,
        published_at,
        channels!inner (
          id,
          name,
          youtube_channel_id,
          created_at
        )
      )
    `
    )
    .eq("id", summaryId)
    .single();

  if (error || !summary) throw new Error("SUMMARY_NOT_FOUND");

  const { data: ratings } = await supabase.from("summary_ratings").select("rating").eq("summary_id", summaryId);

  const upvotes = ratings?.filter((r) => r.rating === true).length ?? 0;
  const downvotes = ratings?.filter((r) => r.rating === false).length ?? 0;

  const { data: userRating } = await supabase
    .from("summary_ratings")
    .select("rating")
    .eq("summary_id", summaryId)
    .eq("user_id", userId)
    .maybeSingle();

  // Check if summary is hidden for the user
  const { data: hiddenData } = await supabase
    .from("hidden_summaries")
    .select("id")
    .eq("summary_id", summaryId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    id: summary.id,
    video: {
      id: summary.videos.id,
      youtube_video_id: summary.videos.youtube_video_id,
      title: summary.videos.title,
      thumbnail_url: summary.videos.thumbnail_url,
      published_at: summary.videos.published_at,
      youtube_url: `https://www.youtube.com/watch?v=${summary.videos.youtube_video_id}`,
    },
    channel: {
      id: summary.videos.channels.id,
      name: summary.videos.channels.name,
      youtube_channel_id: summary.videos.channels.youtube_channel_id,
      created_at: summary.videos.channels.created_at,
    },
    tldr: summary.tldr,
    full_summary: summary.full_summary as unknown as SummaryData | null,
    status: summary.status,
    error_code: summary.error_code,
    generated_at: summary.generated_at,
    rating_stats: { upvotes, downvotes },
    user_rating: userRating?.rating ?? null,
    is_hidden: !!hiddenData,
  };
}

// ---------------------------------------------------------------------------
// Constants for bulk generation
// ---------------------------------------------------------------------------
const STALE_GENERATION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const MAX_VIDEO_DURATION_SECONDS = 2700; // 45 minutes

// ---------------------------------------------------------------------------
// Helper: Get UTC date boundaries for "today"
// ---------------------------------------------------------------------------
function getUTCDayBoundaries(): { todayStart: string; tomorrowStart: string } {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  return {
    todayStart: todayStart.toISOString(),
    tomorrowStart: tomorrowStart.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Cleanup stale generations (stuck in pending/in_progress for > 1 hour)
// ---------------------------------------------------------------------------
async function cleanupStaleGenerations(supabase: SupabaseClient): Promise<number> {
  const staleThreshold = new Date(Date.now() - STALE_GENERATION_TIMEOUT_MS).toISOString();

  let staleGenerationsCount = 0;
  let staleQueueItemsCount = 0;

  // Mark stale bulk generations as failed
  try {
    const { data: staleGenerations, error: genError } = await supabase
      .from("bulk_generation_status")
      .update({
        status: "failed",
        error_message: "Generation timed out (stale cleanup)",
        completed_at: new Date().toISOString(),
      })
      .in("status", ["pending", "in_progress"])
      .lt("started_at", staleThreshold)
      .select("id");

    if (genError) {
      appLogger.warn(`Failed to cleanup stale bulk generations: ${genError.message} (code: ${genError.code})`);
    } else {
      staleGenerationsCount = staleGenerations?.length || 0;
    }
  } catch (err: unknown) {
    appLogger.warn(`Exception cleaning up stale bulk generations: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Mark stale queue items as failed (table may not have any items yet)
  try {
    const { data: staleQueueItems, error: queueError } = await supabase
      .from("summary_queue")
      .update({
        status: "failed",
        error_message: "Queue item timed out (stale cleanup)",
        completed_at: new Date().toISOString(),
      })
      .in("status", ["pending", "in_progress"])
      .lt("queued_at", staleThreshold)
      .select("id");

    if (queueError) {
      appLogger.warn(`Failed to cleanup stale queue items: ${queueError.message} (code: ${queueError.code})`);
    } else {
      staleQueueItemsCount = staleQueueItems?.length || 0;
    }
  } catch (err: unknown) {
    appLogger.warn(`Exception cleaning up stale queue items: ${err instanceof Error ? err.message : String(err)}`);
  }

  const cleanedCount = staleGenerationsCount + staleQueueItemsCount;

  if (cleanedCount > 0) {
    appLogger.info("Cleaned up stale generations", {
      staleGenerations: staleGenerationsCount,
      staleQueueItems: staleQueueItemsCount,
    });
  }

  return cleanedCount;
}

// ---------------------------------------------------------------------------
// Queue videos for summary generation
// ---------------------------------------------------------------------------
async function queueVideosForGeneration(
  supabase: SupabaseClient,
  channels: { id: string; youtube_channel_id: string; name: string }[],
  bulkGenerationId: string,
  runtimeEnv?: RuntimeEnv
): Promise<{ queued: number; skipped: number; errors: string[] }> {
  const { todayStart, tomorrowStart } = getUTCDayBoundaries();
  const errors: string[] = [];
  let queued = 0;
  let skipped = 0;

  for (const channel of channels) {
    try {
      // 1. Fetch latest video from YouTube API (always check for new content)
      let latestVideo: { id: string; youtube_video_id: string; title: string } | null = null;

      try {
        const ytVideo = await fetchLatestVideoFromChannel(channel.youtube_channel_id, runtimeEnv);

        if (!ytVideo) {
          appLogger.info(`Channel "${channel.name}" skipped: no videos found on YouTube`);
          skipped++;
          continue;
        }

        // 2. Check if this video already exists in database
        const { data: existingVideo } = await supabase
          .from("videos")
          .select("id, youtube_video_id, title")
          .eq("youtube_video_id", ytVideo.videoId)
          .maybeSingle();

        if (existingVideo) {
          // Video already in DB - use it
          latestVideo = existingVideo;
          appLogger.debug(`Channel "${channel.name}": latest video "${existingVideo.title}" already in DB`);
        } else {
          // New video from YouTube - fetch metadata and create in DB
          appLogger.info(`Channel "${channel.name}": new video found on YouTube, creating in DB...`);

          const videoMeta = await fetchYouTubeVideoMetadata(ytVideo.videoId, runtimeEnv);

          // Check video duration before creating
          if (videoMeta.duration > MAX_VIDEO_DURATION_SECONDS) {
            appLogger.info(
              `Channel "${channel.name}" skipped: latest video too long (${Math.floor(videoMeta.duration / 60)} min)`
            );
            skipped++;
            continue;
          }

          // Create video record in database
          const { data: newVideo, error: insertError } = await supabase
            .from("videos")
            .insert({
              youtube_video_id: ytVideo.videoId,
              channel_id: channel.id,
              title: videoMeta.title,
              published_at: videoMeta.publishedAt,
              thumbnail_url: videoMeta.thumbnailUrl,
            })
            .select("id, youtube_video_id, title")
            .single();

          if (insertError) {
            // Handle race condition - video might have been created by another process
            if (insertError.code === "23505") {
              const { data: raceVideo } = await supabase
                .from("videos")
                .select("id, youtube_video_id, title")
                .eq("youtube_video_id", ytVideo.videoId)
                .single();

              if (raceVideo) {
                latestVideo = raceVideo;
              } else {
                throw insertError;
              }
            } else {
              throw insertError;
            }
          } else {
            latestVideo = newVideo;
            appLogger.info(`Channel "${channel.name}": created video "${videoMeta.title}" in database`);
          }
        }
      } catch (ytError: unknown) {
        appLogger.error(`Channel "${channel.name}": YouTube API error - ${ytError.message}`);
        errors.push(`${channel.name}: ${ytError.message}`);
        continue;
      }

      if (!latestVideo) {
        appLogger.info(`Channel "${channel.name}" skipped: could not get video`);
        skipped++;
        continue;
      }

      // 2. Check if this channel already has a summary generated today (UTC)
      const { data: existingSummaryToday } = await supabase
        .from("summaries")
        .select("id, status")
        .eq("video_id", latestVideo.id)
        .gte("generated_at", todayStart)
        .lt("generated_at", tomorrowStart)
        .maybeSingle();

      if (existingSummaryToday && existingSummaryToday.status === "completed") {
        appLogger.info(`Channel "${channel.name}" skipped: summary already generated today`);
        skipped++;
        continue;
      }

      // 3. Check if video is already in queue (pending or processing)
      const { data: existingQueueItem } = await supabase
        .from("summary_queue")
        .select("id")
        .eq("video_id", latestVideo.id)
        .in("status", ["pending", "in_progress"])
        .maybeSingle();

      if (existingQueueItem) {
        appLogger.info(`Channel "${channel.name}" skipped: video already in queue`);
        skipped++;
        continue;
      }

      // 4. Check if completed summary already exists for this video (any day)
      const { data: existingSummary } = await supabase
        .from("summaries")
        .select("id, status")
        .eq("video_id", latestVideo.id)
        .eq("status", "completed")
        .maybeSingle();

      if (existingSummary) {
        appLogger.info(`Channel "${channel.name}" skipped: summary already exists for latest video`);
        skipped++;
        continue;
      }

      // 5. Add to queue
      const { error: queueError } = await supabase.from("summary_queue").insert({
        video_id: latestVideo.id,
        priority: 1, // Normal priority for daily generation
        status: "pending",
      });

      if (queueError) {
        // Handle unique constraint violation (video already in queue)
        if (queueError.code === "23505") {
          appLogger.debug("Video already in queue (race condition)", { videoId: latestVideo.id });
          skipped++;
          continue;
        }
        // For other database errors, log and skip this channel
        appLogger.error(`Channel "${channel.name}" failed to queue video: ${queueError.message}`, {
          videoId: latestVideo.id,
          errorCode: queueError.code,
        });
        errors.push(`${channel.name}: Failed to queue video - ${queueError.message}`);
        continue;
      }

      queued++;
      appLogger.info(`Channel "${channel.name}" queued: video "${latestVideo.title}"`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorMsg = `Channel ${channel.name}: ${errorMessage}`;
      errors.push(errorMsg);
      appLogger.error("Error queueing video for channel", {
        channelId: channel.id,
        error: errorMessage,
      });
    }
  }

  return { queued, skipped, errors };
}

// ---------------------------------------------------------------------------
// Process a single queue item
// ---------------------------------------------------------------------------
async function processQueueItem(
  supabase: SupabaseClient,
  queueItem: {
    id: string;
    video_id: string;
    retry_count: number;
    max_retries: number;
  },
  workerId: string,
  runtimeEnv?: RuntimeEnv
): Promise<{ success: boolean; error?: string }> {
  let summaryId: string | null = null; // Track summaryId for error handling

  try {
    // Mark as in_progress
    await supabase
      .from("summary_queue")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
        worker_id: workerId,
      })
      .eq("id", queueItem.id);

    // Get video details
    const { data: video } = await supabase
      .from("videos")
      .select("id, youtube_video_id, title, channel_id")
      .eq("id", queueItem.video_id)
      .single();

    if (!video) {
      throw new Error("VIDEO_NOT_FOUND");
    }

    // Check video duration
    const videoMeta = await fetchYouTubeVideoMetadata(video.youtube_video_id, runtimeEnv);
    if (videoMeta.duration > MAX_VIDEO_DURATION_SECONDS) {
      throw new Error("VIDEO_TOO_LONG");
    }

    // Check/create summary record
    const { data: existingSummary } = await supabase
      .from("summaries")
      .select("id, status")
      .eq("video_id", video.id)
      .maybeSingle();

    if (existingSummary) {
      if (existingSummary.status === "completed") {
        // Already completed, mark queue item as completed
        await supabase
          .from("summary_queue")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", queueItem.id);
        return { success: true };
      }
      summaryId = existingSummary.id;
    } else {
      // Create new summary record
      const { data: newSummary, error: createError } = await supabase
        .from("summaries")
        .insert({
          video_id: video.id,
          status: "pending",
        })
        .select("id")
        .single();

      if (createError) {
        // Handle race condition
        if (createError.code === "23505") {
          const { data: retry } = await supabase.from("summaries").select("id").eq("video_id", video.id).single();
          if (retry) {
            summaryId = retry.id;
          }
        } else {
          throw createError;
        }
      } else if (newSummary) {
        summaryId = newSummary.id;
      }
    }

    if (!summaryId) {
      throw new Error("SUMMARY_CREATION_FAILED");
    }

    // Generate summary using existing processSummaryGeneration
    await processSummaryGeneration(summaryId, video.youtube_video_id, runtimeEnv);

    // Mark queue item as completed
    await supabase
      .from("summary_queue")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", queueItem.id);

    appLogger.info("Queue item processed successfully", {
      queueItemId: queueItem.id,
      videoId: video.id,
      summaryId,
    });

    return { success: true };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Determine error code for summary
    let errorCode: "NO_SUBTITLES" | "VIDEO_PRIVATE" | "VIDEO_TOO_LONG" | null = null;
    if (errorMsg.includes("transcript") || errorMsg.includes("subtitle") || errorMsg.includes("TRANSCRIPT")) {
      errorCode = "NO_SUBTITLES";
    } else if (errorMsg.includes("private") || errorMsg.includes("unavailable")) {
      errorCode = "VIDEO_PRIVATE";
    } else if (errorMsg.includes("TOO_LONG")) {
      errorCode = "VIDEO_TOO_LONG";
    }

    // Check if should retry
    const newRetryCount = queueItem.retry_count + 1;
    if (newRetryCount < queueItem.max_retries) {
      // Reset to pending for retry
      await supabase
        .from("summary_queue")
        .update({
          status: "pending",
          retry_count: newRetryCount,
          error_message: errorMsg,
          worker_id: null,
          started_at: null,
        })
        .eq("id", queueItem.id);

      appLogger.warn(`Queue item failed, will retry (attempt ${newRetryCount}/${queueItem.max_retries}): ${errorMsg}`);
    } else {
      // Mark queue item as failed
      await supabase
        .from("summary_queue")
        .update({
          status: "failed",
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", queueItem.id);

      // Also mark the summary as failed if we have a summaryId
      if (summaryId) {
        await supabase
          .from("summaries")
          .update({
            status: "failed",
            error_code: errorCode,
          })
          .eq("id", summaryId);

        appLogger.error(`Summary ${summaryId} failed permanently: ${errorMsg}`);
      } else {
        appLogger.error(`Queue item failed permanently (no summaryId): ${errorMsg}`);
      }
    }

    return { success: false, error: errorMsg };
  }
}

// ---------------------------------------------------------------------------
// Process next pending queue item (for cron - no 30s limit)
// ---------------------------------------------------------------------------
export interface ProcessNextQueueResult {
  processed: boolean;
  queueItemId?: string;
  videoId?: string;
  summaryId?: string;
  success?: boolean;
  error?: string;
  message: string;
}

export async function processNextQueueItem(
  supabase: SupabaseClient,
  runtimeEnv?: RuntimeEnv
): Promise<ProcessNextQueueResult> {
  const workerId = `single-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  appLogger.info("Processing next queue item", { workerId });

  // Fetch the next pending queue item (highest priority first, oldest first)
  const { data: queueItem, error: fetchError } = await supabase
    .from("summary_queue")
    .select("id, video_id, retry_count, max_retries")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("queued_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    appLogger.error("Error fetching queue item", { error: fetchError.message });
    return {
      processed: false,
      message: `Error fetching queue: ${fetchError.message}`,
    };
  }

  if (!queueItem) {
    appLogger.info("No pending queue items to process");
    return {
      processed: false,
      message: "No pending queue items",
    };
  }

  appLogger.info("Found queue item to process", {
    queueItemId: queueItem.id,
    videoId: queueItem.video_id,
    retryCount: queueItem.retry_count,
  });

  // Get summary ID for this video
  const { data: summary } = await supabase
    .from("summaries")
    .select("id")
    .eq("video_id", queueItem.video_id)
    .maybeSingle();

  // Process the queue item (this can take several minutes for Gradio)
  const result = await processQueueItem(supabase, queueItem, workerId, runtimeEnv);

  return {
    processed: true,
    queueItemId: queueItem.id,
    videoId: queueItem.video_id,
    summaryId: summary?.id,
    success: result.success,
    error: result.error,
    message: result.success ? `Queue item processed successfully` : `Queue item failed: ${result.error}`,
  };
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Masowa generacja podsumowań dla wszystkich kanałów (system cron job)
// ---------------------------------------------------------------------------
export async function startBulkSummaryGeneration(
  supabase: SupabaseClient,
  runtimeEnv?: RuntimeEnv
): Promise<BulkGenerationResponse> {
  appLogger.info("Starting system bulk summary generation");

  // 1. Cleanup stale generations first (non-blocking)
  try {
    await cleanupStaleGenerations(supabase);
    appLogger.debug("Stale cleanup completed");
  } catch (cleanupErr: unknown) {
    appLogger.warn("Stale cleanup failed (continuing anyway)", { error: cleanupErr.message });
  }

  // 2. Check if bulk generation is already in progress
  appLogger.debug("Checking for active generation...");
  const { data: activeGeneration, error: activeError } = await supabase
    .from("bulk_generation_status")
    .select("id, status")
    .in("status", ["pending", "in_progress"])
    .maybeSingle();

  if (activeError) {
    appLogger.error(
      `Failed to check active generation: ${activeError.message} (code: ${activeError.code}, hint: ${activeError.hint || "none"})`
    );
    errorLogger.dbError(activeError, "check_active_generation");
    throw activeError;
  }

  if (activeGeneration) {
    appLogger.warn("Bulk generation already in progress", { activeGenerationId: activeGeneration.id });
    throw new Error("BULK_GENERATION_IN_PROGRESS");
  }

  // 3. Fetch channels that have at least one active subscription
  appLogger.debug("Fetching subscribed channels...");

  // First get channel IDs that have subscriptions
  const { data: subscribedChannelIds, error: subError } = await supabase
    .from("subscriptions")
    .select("channel_id");

  if (subError) {
    appLogger.error(`Failed to fetch subscriptions: ${subError.message} (code: ${subError.code})`);
    errorLogger.dbError(subError, "fetch_subscriptions");
    throw subError;
  }

  if (!subscribedChannelIds || subscribedChannelIds.length === 0) {
    throw new Error("NO_CHANNELS_FOUND");
  }

  // Extract unique channel IDs
  const uniqueChannelIds = [...new Set(subscribedChannelIds.map(s => s.channel_id))];

  // Now fetch the channels
  const { data: channels, error: channelsError } = await supabase
    .from("channels")
    .select("id, youtube_channel_id, name")
    .in("id", uniqueChannelIds)
    .order("created_at", { ascending: false });

  if (channelsError) {
    appLogger.error(`Failed to fetch channels: ${channelsError.message} (code: ${channelsError.code})`);
    errorLogger.dbError(channelsError, "fetch_subscribed_channels");
    throw channelsError;
  }

  if (!channels || channels.length === 0) {
    throw new Error("NO_CHANNELS_FOUND");
  }

  appLogger.info(`Found ${channels.length} subscribed channels to process`);

  // 4. Create bulk generation record
  appLogger.debug("Creating bulk generation record...");
  const { data: bulkGeneration, error: insertError } = await supabase
    .from("bulk_generation_status")
    .insert({
      user_id: null, // System generation (no user)
      status: "pending",
      total_channels: channels.length,
    })
    .select("id, status")
    .single();

  if (insertError) {
    appLogger.error(
      `Failed to create bulk generation: ${insertError.message} (code: ${insertError.code}, hint: ${insertError.hint || "none"})`
    );
    errorLogger.dbError(insertError, "create_bulk_generation");
    throw insertError;
  }

  // 5. Queue videos for generation
  const queueResult = await queueVideosForGeneration(supabase, channels, bulkGeneration.id, runtimeEnv);

  appLogger.info(
    `Videos queued: ${queueResult.queued} queued, ${queueResult.skipped} skipped, ${queueResult.errors.length} errors`
  );

  // 6. If nothing to process, mark as completed
  if (queueResult.queued === 0) {
    await supabase
      .from("bulk_generation_status")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processed_channels: 0,
        successful_summaries: 0,
        failed_summaries: 0,
      })
      .eq("id", bulkGeneration.id);

    return {
      id: bulkGeneration.id,
      status: "completed",
      message: `No new summaries to generate. ${queueResult.skipped} channels skipped (already have summaries).`,
      estimated_completion_time: "0",
    };
  }

  // 7. Queue processing is handled by GitHub Actions workflow calling /api/summaries/process-next
  // Don't start background processing here - it causes "stuck" items due to waitUntil limits

  // Mark bulk generation as in_progress (workflow will update to completed when done)
  await supabase.from("bulk_generation_status").update({ status: "in_progress" }).eq("id", bulkGeneration.id);

  appLogger.info("System bulk summary generation - videos queued", {
    bulkGenerationId: bulkGeneration.id,
    totalChannels: channels.length,
    queuedVideos: queueResult.queued,
  });

  return {
    id: bulkGeneration.id,
    status: "in_progress" as const,
    message: `${queueResult.queued} videos queued for processing. ${queueResult.skipped} skipped. Processing via cron.`,
    estimated_completion_time: Math.ceil(queueResult.queued * 1.5).toString(),
  };
}

// ---------------------------------------------------------------------------
// Sprawdź status masowej generacji
// ---------------------------------------------------------------------------
export async function getBulkGenerationStatus(
  supabase: SupabaseClient,
  userId: string,
  generationId?: string
): Promise<BulkGenerationStatus[]> {
  let query = supabase
    .from("bulk_generation_status")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (generationId) {
    query = query.eq("id", generationId);
  }

  const { data, error } = await query;

  if (error) {
    errorLogger.dbError(error, "get_bulk_generation_status", { userId });
    throw error;
  }

  return data || [];
}

// ---------------------------------------------------------------------------
// Sprawdź czy masowa generacja jest w trakcie
// ---------------------------------------------------------------------------
export async function isBulkGenerationInProgress(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from("bulk_generation_status")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["pending", "in_progress"]);

  return (count || 0) > 0;
}
