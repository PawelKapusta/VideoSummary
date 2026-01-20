import { errorLogger, appLogger } from "./logger";
import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptTooManyRequestError,
} from "youtube-transcript";
import { Client } from "@gradio/client";
import { requireEnv, getEnv, getSiteUrl, type RuntimeEnv } from "./env";

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

const preferredLanguages = ["pl", "en", "en-us", "en-gb"];

function timeToMs(value: string): number {
  const normalized = value.replace(",", ".");
  const parts = normalized.split(":").map(Number);
  while (parts.length < 3) parts.unshift(0);
  const [hours, minutes, seconds] = parts;
  return Math.round(((hours * 60 + minutes) * 60 + seconds) * 1000);
}

function parseVttToSegments(vtt: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const blocks = vtt.split(/\r?\n\r?\n/);

  for (const rawBlock of blocks) {
    const lines = rawBlock
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    let timingLine = lines[0];
    if (!timingLine.includes("-->") && lines[1]?.includes("-->")) {
      timingLine = lines[1];
      lines.splice(0, 2);
    } else {
      lines.shift();
    }

    if (!timingLine.includes("-->")) continue;
    const [start, end] = timingLine.split("-->").map((s) => s.trim());
    const offset = timeToMs(start);
    const duration = Math.max(0, timeToMs(end) - offset);
    const text = lines.join(" ").trim();

    if (text) {
      segments.push({ text, offset, duration });
    }
  }

  return segments;
}

async function fetchWithYouTubeApiCaptions(videoId: string, runtimeEnv?: RuntimeEnv): Promise<TranscriptSegment[]> {
  appLogger.debug("Attempting to fetch captions via YouTube Data API", { videoId });
  const apiKey = requireEnv("YOUTUBE_API_KEY", runtimeEnv);

  const listUrl = new URL("https://www.googleapis.com/youtube/v3/captions");
  listUrl.searchParams.set("videoId", videoId);
  listUrl.searchParams.set("part", "snippet");
  listUrl.searchParams.set("key", apiKey);

  // Add Referer header for API key restrictions
  const listRes = await fetch(listUrl.toString(), {
    headers: {
      Referer: getSiteUrl(runtimeEnv),
    },
  });
  if (!listRes.ok) {
    if (listRes.status === 401 || listRes.status === 403) {
      throw new Error("YT_CAPTION_LIST_AUTH_REQUIRED");
    }
    throw new Error(`YT_CAPTION_LIST_FAILED:${listRes.status}`);
  }
  const listJson = await listRes.json();
  const items: { id?: string; snippet?: { language?: string; trackKind?: string } }[] = listJson?.items ?? [];
  if (!items.length) throw new Error("TRANSCRIPT_NOT_AVAILABLE");

  const scored = items
    .filter((i) => i?.id)
    .map((i) => {
      const lang = (i.snippet?.language ?? "").toLowerCase();
      const langScore = preferredLanguages.findIndex((l) => lang.startsWith(l));
      return {
        id: i.id!,
        langScore: langScore === -1 ? preferredLanguages.length : langScore,
        trackKind: i.snippet?.trackKind,
      };
    })
    .sort((a, b) => a.langScore - b.langScore);

  const chosen = scored[0];
  if (!chosen) throw new Error("TRANSCRIPT_NOT_AVAILABLE");

  // Download VTT if possible
  const downloadUrl = new URL(`https://www.googleapis.com/youtube/v3/captions/${chosen.id}`);
  downloadUrl.searchParams.set("tfmt", "vtt");
  downloadUrl.searchParams.set("key", apiKey);
  const capRes = await fetch(downloadUrl.toString(), {
    headers: {
      Accept: "text/vtt",
      Referer: getSiteUrl(runtimeEnv),
    },
  });
  if (!capRes.ok) {
    if (capRes.status === 401 || capRes.status === 403) {
      throw new Error("YT_CAPTION_DOWNLOAD_AUTH_REQUIRED");
    }
    throw new Error(`YT_CAPTION_DOWNLOAD_FAILED:${capRes.status}`);
  }
  const body = await capRes.text();

  const segments = parseVttToSegments(body);
  if (!segments.length) throw new Error("TRANSCRIPT_NOT_AVAILABLE");
  appLogger.debug("YouTube Data API captions fetched successfully", { videoId, segments: segments.length });
  return segments;
}

async function fetchWithGradioClient(videoId: string, runtimeEnv?: RuntimeEnv): Promise<TranscriptSegment[]> {
  appLogger.debug("Starting Gradio client transcript fetch", { videoId });

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    appLogger.debug("Connecting to HuggingFace Space for transcription");

    const gradioModel = getEnv("GRADIO_TRANSCRIPT_MODEL", runtimeEnv);
    if (!gradioModel) throw new Error("GRADIO_TRANSCRIPT_MODEL not configured");
    const client = await Client.connect(gradioModel);
    appLogger.debug("Connected to Gradio client, starting transcription", { url });

    const result = await client.predict("/get_transcript", {
      param_0: url,
      param_1: "auto",
    });

    // Transcription received - logged above with details
    appLogger.debug("Gradio transcription received", {
      resultType: typeof result,
      resultPreview: JSON.stringify(result).substring(0, 500),
    });

    let fullText = "";
    if (result && result.data) {
      if (typeof result.data === "string") {
        fullText = result.data;
      } else if (Array.isArray(result.data) && result.data.length > 0) {
        fullText = result.data[0];
      }
    }

    appLogger.debug("Transcription text extracted", {
      textType: typeof fullText,
      textLength: fullText.length,
      textPreview: fullText.substring(0, 200),
    });

    // Check for known garbage response patterns (hallucinations)
    const normalizedText = fullText.toLowerCase().trim();

    // Known bad patterns that indicate model hallucinations
    const garbagePatterns = [
      /^you are smash\. yeah\. heat\. yeah\. heat\. heat\. heat\. heat up here\./i,
      /^heat\. heat\. heat\. heat/i,
      /^yeah\. heat\. yeah\. heat/i,
      /^smash\. yeah\. heat/i,
      // Add more patterns as they are discovered
    ];

    const isGarbage = garbagePatterns.some((pattern) => pattern.test(normalizedText));

    if (isGarbage) {
      appLogger.warn("Gradio Client: Known garbage transcription pattern detected", {
        videoId,
        pattern: "repetitive nonsense",
        preview: fullText.substring(0, 100),
      });
      throw new Error("TRANSCRIPT_NOT_AVAILABLE");
    }

    // Fallback: check for excessive repetition of short words (simple heuristic)
    const words = normalizedText.split(/\s+/).filter((word) => word.length > 0);
    if (words.length > 5) {
      const shortWords = words.filter((word) => word.length <= 4);
      if (shortWords.length / words.length > 0.8) {
        // >80% short words
        appLogger.warn("Gradio Client: Excessive short word repetition detected", {
          videoId,
          shortWordRatio: shortWords.length / words.length,
          preview: fullText.substring(0, 100),
        });
        throw new Error("TRANSCRIPT_NOT_AVAILABLE");
      }
    }

    if (!fullText || fullText.trim().length === 0) {
      appLogger.warn("Gradio Client: Empty transcription received", { videoId });
      throw new Error("TRANSCRIPT_NOT_AVAILABLE");
    }

    // Convert plain text to segments (since Gradio returns full text without timestamps)
    // We'll create artificial segments by splitting on sentences or paragraphs
    const sentences = fullText.split(/[.!?]\s+/).filter((s) => s.trim().length > 0);
    const segments: TranscriptSegment[] = sentences.map((text, index) => ({
      text: text.trim() + (text.match(/[.!?]$/) ? "" : "."),
      offset: index * 5000, // Artificial 5-second intervals
      duration: 5000,
    }));

    appLogger.debug("Gradio Client transcript fetched successfully", {
      videoId,
      segments: segments.length,
      totalLength: fullText.length,
    });

    const preview = fullText.substring(0, 500);
    appLogger.debug("Gradio Client transcript preview", {
      videoId,
      previewLength: preview.length,
      preview,
    });

    return segments;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log error details for debugging (will be logged at WARN level in caller)
    appLogger.debug("Gradio Client fetch failed", {
      videoId,
      error: errorMessage,
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack?.split("\n")[0] : undefined,
    });

    if (errorMessage === "TRANSCRIPT_NOT_AVAILABLE") {
      throw error;
    }

    throw new Error("TRANSCRIPT_NOT_AVAILABLE");
  }
}

/**
 * Fetch transcript from YouTube video using youtube-transcript package
 * @param videoId - YouTube video ID
 * @returns Array of transcript segments
 * @throws Error if transcript is not available or fetch fails
 */
export async function fetchTranscript(videoId: string, runtimeEnv?: RuntimeEnv): Promise<TranscriptSegment[]> {
  appLogger.info(`Starting transcript fetch for video ${videoId}`);

  // Check if we're running in Cloudflare Workers (nodejs_compat environment)
  const isCloudflare = typeof globalThis !== "undefined" && "CF_PAGES" in globalThis;
  if (isCloudflare) {
    appLogger.debug(
      "Running in Cloudflare Workers environment - some transcript libraries may have compatibility issues"
    );
  }

  // Minimal ścieżka: YoutubeTranscript z preferencją PL -> EN, z auto-captions.
  const preferredLangs = ["pl", "en"];
  for (const lang of preferredLangs) {
    try {
      appLogger.debug(`Attempting YoutubeTranscript fetch for ${videoId} (lang: ${lang})`);
      const res = await YoutubeTranscript.fetchTranscript(videoId, {
        lang,
      });
      if (res?.length) {
        const segments: TranscriptSegment[] = res.map((item) => ({
          text: item.text,
          offset: Math.round(item.offset),
          duration: Math.round(item.duration),
        }));
        appLogger.info(`YoutubeTranscript successful for ${videoId} (${lang}): ${segments.length} segments`);
        return segments;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      appLogger.debug(`YoutubeTranscript failed for ${videoId} (${lang}): ${errorMsg}`);

      // Log additional context for Cloudflare compatibility issues
      if (isCloudflare && (errorMsg.includes("fetch") || errorMsg.includes("network"))) {
        appLogger.debug("Possible Cloudflare compatibility issue with YoutubeTranscript library", {
          videoId,
          lang,
          error: errorMsg,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        });
      }
    }
  }
  appLogger.warn(`YoutubeTranscript failed for all languages (${videoId}), trying fallbacks...`);

  try {
    appLogger.info(`Attempting YouTube Data API captions for video ${videoId}`);
    const ytApiCaptions = await fetchWithYouTubeApiCaptions(videoId, runtimeEnv);
    appLogger.info(`YouTube Data API captions successful for video ${videoId}`);
    return ytApiCaptions;
  } catch (ytApiErr) {
    const errorMsg = ytApiErr instanceof Error ? ytApiErr.message : String(ytApiErr);
    appLogger.warn(`YouTube Data API captions failed for video ${videoId}: ${errorMsg}`);

    // YouTube API might be blocked or rate limited in cloud environments
    if (isCloudflare && (errorMsg.includes("403") || errorMsg.includes("quota") || errorMsg.includes("auth"))) {
      appLogger.debug("YouTube API access issue in Cloudflare environment - this is expected due to IP restrictions", {
        videoId,
        error: errorMsg,
      });
    }
  }

  try {
    appLogger.info(`Attempting youtube-transcript-api fallback for video ${videoId}`);
    const result = await fetchWithYoutubeTranscriptApi(videoId);
    appLogger.info(`youtube-transcript-api successful for video ${videoId}: ${result.length} segments`);
    return result;
  } catch (fallbackError) {
    const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
    appLogger.warn(`youtube-transcript-api failed for video ${videoId}: ${fallbackMsg}`);

    // This library may have issues in Cloudflare due to Node.js API differences
    if (
      isCloudflare &&
      (fallbackMsg.includes("import") || fallbackMsg.includes("module") || fallbackMsg.includes("axios"))
    ) {
      appLogger.debug("youtube-transcript-api library compatibility issue in Cloudflare - Node.js API differences", {
        videoId,
        error: fallbackMsg,
      });
    }
  }

  try {
    appLogger.info(`Attempting Gradio Client fallback for video ${videoId}`);
    const gradioResult = await fetchWithGradioClient(videoId, runtimeEnv);
    appLogger.info(`Gradio Client fallback successful for video ${videoId}: ${gradioResult.length} segments`);
    return gradioResult;
  } catch (gradioError) {
    const gradioMsg = gradioError instanceof Error ? gradioError.message : String(gradioError);
    appLogger.warn(`Gradio Client fallback failed for video ${videoId}: ${gradioMsg}`);

    // Gradio API might be rate limited or unavailable in cloud environments
    if (
      isCloudflare &&
      (gradioMsg.includes("fetch") || gradioMsg.includes("network") || gradioMsg.includes("connect"))
    ) {
      appLogger.debug("Gradio Client network issue in Cloudflare environment - API may be rate limited or blocked", {
        videoId,
        error: gradioMsg,
      });
    }
  }

  // Final summary when all methods fail
  appLogger.error("All transcript fetching methods failed", {
    videoId,
    environment: isCloudflare ? "cloudflare" : "local",
    methodsAttempted: ["YoutubeTranscript", "YouTubeDataAPI", "youtube-transcript-api", "GradioClient"],
    commonIssues: isCloudflare
      ? ["IP blocking by YouTube", "Cloudflare Node.js API limitations", "Rate limiting"]
      : ["Video has no captions", "Network issues", "Library bugs"],
  });

  throw new Error("TRANSCRIPT_NOT_AVAILABLE");
}

async function fetchWithYoutubeTranscript(videoId: string): Promise<TranscriptSegment[]> {
  appLogger.debug("Starting YoutubeTranscript fetch", { videoId });

  try {
    appLogger.debug("Calling YoutubeTranscript.fetchTranscript", { videoId });
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(videoId);

    appLogger.debug("YoutubeTranscript response received", {
      videoId,
      responseType: typeof transcriptResponse,
      isArray: Array.isArray(transcriptResponse),
      length: transcriptResponse?.length ?? "null",
      firstItem: transcriptResponse?.[0] ?? "empty",
    });

    if (!transcriptResponse || transcriptResponse.length === 0) {
      appLogger.warn("No transcript segments found", { videoId });
      throw new Error("TRANSCRIPT_NOT_AVAILABLE");
    }

    // Segments count logged below

    // Convert to our segment format (offset and duration are already in ms)
    const segments: TranscriptSegment[] = transcriptResponse.map((item) => ({
      text: item.text,
      offset: Math.round(item.offset),
      duration: Math.round(item.duration),
    }));

    appLogger.debug("Transcript fetched successfully", {
      videoId,
      segments: segments.length,
      totalLength: segments.reduce((sum, s) => sum + s.text.length, 0),
    });

    const preview = transcriptToString(segments).slice(0, 500);
    appLogger.debug("Transcript preview", {
      videoId,
      previewLength: preview.length,
      preview,
    });

    return segments;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    appLogger.debug("YoutubeTranscript fetch failed", {
      videoId,
      error: errorMessage,
      errorConstructor: error?.constructor?.name,
      stack: error instanceof Error ? error.stack?.split("\n")[0] : undefined,
    });

    // Handle specific youtube-transcript errors
    if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      appLogger.debug("Video not found error", { videoId });
      throw new Error("VIDEO_NOT_FOUND");
    }

    if (error instanceof YoutubeTranscriptDisabledError || error instanceof YoutubeTranscriptNotAvailableError) {
      appLogger.debug("Transcript not available (disabled/not available)", { videoId });
      throw new Error("TRANSCRIPT_NOT_AVAILABLE");
    }

    if (error instanceof YoutubeTranscriptTooManyRequestError) {
      appLogger.error("YouTube rate limit hit", { videoId });
      throw new Error("RATE_LIMIT_EXCEEDED");
    }

    // Re-throw known errors
    if (errorMessage === "TRANSCRIPT_NOT_AVAILABLE" || errorMessage === "VIDEO_NOT_FOUND") {
      appLogger.debug("Rethrowing known transcript error", { videoId, error: errorMessage });
      throw error;
    }

    appLogger.debug("Rethrowing unknown transcript error", { videoId, error: errorMessage });
    throw error;
  }
}

async function fetchWithYoutubeTranscriptApi(videoId: string): Promise<TranscriptSegment[]> {
  appLogger.debug("Starting youtube-transcript-api fallback", { videoId });

  appLogger.debug("Importing youtube-transcript-api module");
  const module = await import("youtube-transcript-api");
  appLogger.debug("youtube-transcript-api module imported successfully");

  type TranscriptApiFn = (
    videoId: string,
    langCode?: string
  ) => Promise<
    {
      text?: string;
      start?: number;
      duration?: number;
    }[]
  >;

  interface TranscriptApiClient {
    getTranscript?: TranscriptApiFn;
  }

  interface TranscriptApiModule {
    TranscriptClient?: new () => TranscriptApiClient;
    default?: unknown;
    getTranscript?: TranscriptApiFn;
  }

  const transcriptModule = module as TranscriptApiModule;
  const defaultExport = transcriptModule.default;
  const defaultFunction = typeof defaultExport === "function" ? (defaultExport as TranscriptApiFn) : undefined;

  const CandidateClient =
    transcriptModule.TranscriptClient ??
    (typeof defaultExport === "function" ? (defaultExport as TranscriptApiModule["TranscriptClient"]) : undefined);

  let client: TranscriptApiClient | null = null;

  if (CandidateClient) {
    try {
      client = new CandidateClient();
    } catch (err) {
      appLogger.debug("Failed to instantiate TranscriptClient, falling back to static method", {
        videoId,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const getTranscript: TranscriptApiFn | undefined =
    client?.getTranscript?.bind(client) ?? transcriptModule.getTranscript ?? defaultFunction;

  appLogger.debug("getTranscript function type", { videoId, type: typeof getTranscript });

  if (typeof getTranscript !== "function") {
    appLogger.error("FALLBACK_TRANSCRIPT_PROVIDER_UNAVAILABLE", {
      defaultType: typeof getTranscript,
    });
    throw new Error("FALLBACK_TRANSCRIPT_PROVIDER_UNAVAILABLE");
  }

  appLogger.debug("youtube-transcript-api function ready, trying languages", {
    videoId,
    languages: ["pl", "en", undefined],
  });

  try {
    const languageCandidates: (string | undefined)[] = ["pl", "en", undefined];

    for (const lang of languageCandidates) {
      try {
        appLogger.debug("youtube-transcript-api attempt", { videoId, lang });
        const response = await getTranscript(videoId, lang);

        appLogger.debug("youtube-transcript-api response received", {
          videoId,
          lang,
          isArray: Array.isArray(response),
          length: response?.length ?? "null",
          firstItem: response?.[0] ?? "empty",
        });

        if (!response || response.length === 0) {
          throw new Error("TRANSCRIPT_NOT_AVAILABLE");
        }

        const segments: TranscriptSegment[] = (response as Record<string, unknown>[]).map((item) => ({
          text: String(item.text ?? ""),
          offset: Math.round(Number(item.start ?? 0) * 1000),
          duration: Math.round(Number(item.duration ?? 0) * 1000),
        }));

        const preview = transcriptToString(segments).slice(0, 500);
        appLogger.debug("youtube-transcript-api transcript preview", {
          videoId,
          lang,
          previewLength: preview.length,
          preview,
        });

        return segments;
      } catch (innerError) {
        const innerMessage = innerError instanceof Error ? innerError.message : String(innerError);
        const status = (innerError as { response?: { status?: number } })?.response?.status;

        appLogger.warn("youtube-transcript-api language attempt failed", {
          videoId,
          lang,
          innerMessage,
          status,
          name: (innerError as { name?: string })?.name,
        });

        // Try next language on "not available" or auth/country issues
        if (innerMessage === "TRANSCRIPT_NOT_AVAILABLE" || status === 404 || status === 403) {
          continue;
        }

        if (status === 429) {
          throw new Error("RATE_LIMIT_EXCEEDED");
        }

        // Unknown error: propagate to outer catch
        throw innerError;
      }
    }

    // If all language attempts failed with "not available"
    appLogger.debug("All language attempts failed - no transcript available", { videoId });
    throw new Error("TRANSCRIPT_NOT_AVAILABLE");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    appLogger.debug("Outer catch in youtube-transcript-api", { videoId, error: errorMessage });

    // Extract axios-like status if present (youtube-transcript-api uses axios)
    const status = (error as { response?: { status?: number; data?: unknown } })?.response?.status;

    appLogger.error("youtube-transcript-api fallback failed", {
      videoId,
      errorMessage,
      status,
      name: (error as { name?: string })?.name,
      stack: error instanceof Error ? error.stack?.split("\n")[0] : undefined,
    });

    if (errorMessage === "TRANSCRIPT_NOT_AVAILABLE" || status === 404 || status === 403) {
      appLogger.debug("Rethrowing transcript error as-is", { videoId, status, error: errorMessage });
      throw error;
    }

    if (status === 429) {
      appLogger.warn("Rate limit hit in youtube-transcript-api", { videoId });
      throw new Error("RATE_LIMIT_EXCEEDED");
    }

    appLogger.debug("Unknown transcript error, throwing TRANSCRIPT_NOT_AVAILABLE", { videoId, error: errorMessage });
    throw new Error("TRANSCRIPT_NOT_AVAILABLE");
  }
}

export function transcriptToString(transcript: TranscriptSegment[]): string {
  return transcript.map((segment) => segment.text).join(" ");
}
