import { createHash } from 'crypto';
import type { SupabaseClient } from '../db/supabase.client';
import { errorLogger, appLogger } from './logger';
import type {
  Channel,
  DetailedSummary,
  FilterOptions,
  GenerationRequest,
  GenerationRequestInsert,
  PaginatedResponse,
  PaginationMeta,
  Profile,
  RatingStats,
  SummaryBasic,
  SummaryData,
  SummaryInsert,
  SummaryStatus,
  SummaryUpdate,
  SummaryWithVideo,
  VideoBasic,
  VideoInsert,
  VideoUpdate,
  VideoWithUrl
} from '../types';
import { extractYouTubeVideoId, YOUTUBE_VIDEO_URL_PREFIX } from './youtube.utils';
import { fetchYouTubeVideoMetadata } from './youtube.service';
import type { Database } from '../db/database.types';
import { OpenRouterService } from './openrouter.service';
import { fetchTranscript, transcriptToString } from './transcript.service';

/**
 * Generate a summary for a YouTube video (manual generation)
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param videoUrl - YouTube video URL
 * @returns SummaryBasic with ID, status, and message
 */
export async function generateSummary(
  supabase: SupabaseClient,
  userId: string,
  videoUrl: string
): Promise<SummaryBasic & { message: string }> {
  appLogger.debug('Starting generateSummary', { userId, videoUrl });

  // Extract YouTube video ID from URL
  const youtubeVideoId = extractYouTubeVideoId(videoUrl);
  appLogger.debug('Extracted YouTube Video ID', { youtubeVideoId });

  // Check if video exists in database
  let videoId: string;
  let channelId: string;
  const { data: existingVideo, error: videoError } = await supabase
    .from('videos')
    .select('id, channel_id, title, published_at, metadata_last_checked_at')
    .eq('youtube_video_id', youtubeVideoId)
    .single();

  if (videoError && videoError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw videoError;
  }

  if (existingVideo) {
    videoId = existingVideo.id;
    channelId = existingVideo.channel_id;
    appLogger.debug('Found existing video in DB', { videoId, channelId });
  } else {
    // Video doesn't exist, fetch from YouTube API
    appLogger.debug('Video not in DB, fetching from YouTube API', { youtubeVideoId });
    let videoMetadata;
    try {
      videoMetadata = await fetchYouTubeVideoMetadata(youtubeVideoId);
    } catch (youtubeError) {
      errorLogger.appError(youtubeError instanceof Error ? youtubeError : new Error(String(youtubeError)), {
        service: 'summaries_service',
        operation: 'youtube_video_api_call',
        youtube_video_id: youtubeVideoId,
      });
      throw youtubeError;
    }

    // Validate video constraints
    if (videoMetadata.duration > 2700) { // 45 minutes = 2700 seconds
      appLogger.debug('Video too long', { duration: videoMetadata.duration });
      throw new Error('VIDEO_TOO_LONG');
    }

    // Check if subtitles are available (this would need to be checked via YouTube API)
    // For now, we'll assume subtitles are available and handle the error during processing

    // Get or create channel
    const { data: existingChannel, error: channelError } = await supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', videoMetadata.channelId)
      .single();

    if (channelError && channelError.code !== 'PGRST116') {
      throw channelError;
    }

    if (existingChannel) {
      channelId = existingChannel.id;
      appLogger.debug('Found existing channel in DB', { channelId });
    } else {
      // Fetch channel metadata
      appLogger.debug('Channel not in DB, fetching metadata', { channelId: videoMetadata.channelId });
      let channelMetadata;
      try {
        // This would need a separate YouTube API call for channel info
        // For now, create minimal channel record - this should be improved
        channelMetadata = {
          id: videoMetadata.channelId,
          title: videoMetadata.channelTitle,
        };
      } catch (channelError) {
        errorLogger.appError(channelError instanceof Error ? channelError : new Error(String(channelError)), {
          service: 'summaries_service',
          operation: 'youtube_channel_api_call',
          youtube_channel_id: videoMetadata.channelId,
        });
        throw channelError;
      }

      // Create channel record
      const { data: newChannel, error: insertChannelError } = await supabase
        .from('channels')
        .insert({
          youtube_channel_id: channelMetadata.id,
          name: channelMetadata.title,
        })
        .select('id')
        .single();

      if (insertChannelError) {
        errorLogger.appError(insertChannelError, {
          service: 'summaries_service',
          operation: 'channel_insert',
          youtube_channel_id: channelMetadata.id,
        });
        throw insertChannelError;
      }

      channelId = newChannel.id;
    }

    // Create video record
    appLogger.debug('Creating video record', { 
      youtubeVideoId, 
      channelId,
      title: videoMetadata.title,
      publishedAt: videoMetadata.publishedAt,
      thumbnailUrl: videoMetadata.thumbnailUrl
    });
    
    const { data: newVideo, error: insertVideoError } = await supabase
      .from('videos')
      .insert({
        youtube_video_id: youtubeVideoId,
        channel_id: channelId,
        title: videoMetadata.title,
        published_at: videoMetadata.publishedAt,
        thumbnail_url: videoMetadata.thumbnailUrl,
      })
      .select('id')
      .single();

    if (insertVideoError) {
      // Handle duplicate key error (race condition where video was created by another request)
      if (insertVideoError.code === '23505') { // PostgreSQL unique violation
        appLogger.debug('Video already exists (race condition), fetching existing video', { youtubeVideoId });
        const { data: existingVideoRetry, error: retryError } = await supabase
          .from('videos')
          .select('id, channel_id')
          .eq('youtube_video_id', youtubeVideoId)
          .single();
        
        if (retryError || !existingVideoRetry) {
          errorLogger.appError(retryError || new Error('Video not found after duplicate key error'), {
            service: 'summaries_service',
            operation: 'video_insert_retry',
            youtube_video_id: youtubeVideoId,
          });
          throw retryError || new Error('Video not found after duplicate key error');
        }
        
        videoId = existingVideoRetry.id;
        channelId = existingVideoRetry.channel_id;
        appLogger.debug('Using existing video from race condition', { videoId, channelId });
      } else {
        errorLogger.appError(insertVideoError, {
          service: 'summaries_service',
          operation: 'video_insert',
          youtube_video_id: youtubeVideoId,
          error_code: insertVideoError.code,
          error_message: insertVideoError.message,
          error_details: insertVideoError.details,
          error_hint: insertVideoError.hint,
        });
        throw insertVideoError;
      }
    } else {
      videoId = newVideo.id;
      appLogger.debug('Video record created successfully', { videoId: newVideo.id });
    }
  }

  // Verify user is subscribed to the channel
  appLogger.debug('Verifying subscription', { userId, channelId });
  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('channel_id', channelId)
    .single();

  if (subscriptionError && subscriptionError.code !== 'PGRST116') {
    throw subscriptionError;
  }

  if (!subscription) {
    appLogger.debug('User not subscribed to channel', { userId, channelId });
    throw new Error('CHANNEL_NOT_SUBSCRIBED');
  }

  // Check if summary already exists
  appLogger.debug('Checking for existing summary', { videoId });
  const { data: existingSummary, error: summaryError } = await supabase
    .from('summaries')
    .select('id, status')
    .eq('video_id', videoId)
    .single();

  if (summaryError && summaryError.code !== 'PGRST116') {
    throw summaryError;
  }

  if (existingSummary) {
    appLogger.debug('Found existing summary', { existingSummary });
    if (existingSummary.status === 'completed') {
      throw new Error('SUMMARY_ALREADY_EXISTS');
    }
    if (existingSummary.status === 'pending' || existingSummary.status === 'in_progress') {
      throw new Error('GENERATION_IN_PROGRESS');
    }
    // If status is 'failed', we can retry
    appLogger.debug('Retrying failed summary', { id: existingSummary.id });
  }

  // Atomic operation: rate limit check and summary creation
  const lockKey = hashStringToInt32(channelId);
  appLogger.debug('Attempting atomic summary generation', { channelId, lockKey });

  let summary: any;
  try {
    const result = await supabase
      // @ts-expect-error - RPC function not in generated types yet
      .rpc('generate_summary_atomic', {
        p_user_id: userId,
        p_video_id: videoId,
        p_channel_id: channelId,
        p_lock_key: lockKey,
      });

    // The RPC function returns an array (TABLE), so we take the first element
    summary = result.data?.[0];
    const generateError = result.error;

    if (generateError) {
      errorLogger.appError(generateError, {
        service: 'summaries_service',
        operation: 'atomic_summary_generation',
        user_id: userId,
        video_id: videoId,
        channel_id: channelId,
        error_code: generateError.code,
        error_message: generateError.message,
        error_details: generateError.details,
        error_hint: generateError.hint,
      });

      if (generateError.message.includes('GENERATION_LIMIT_REACHED')) {
        throw new Error('GENERATION_LIMIT_REACHED');
      }
      throw generateError;
    }

    if (!summary) {
      throw new Error('No summary data returned from atomic function');
    }
    appLogger.debug('Atomic summary generation successful', { summaryId: summary.id });
  } catch (rpcError) {
    const error = rpcError instanceof Error ? rpcError : new Error(String(rpcError));
    errorLogger.appError(error, {
      service: 'summaries_service',
      operation: 'rpc_call_failed',
      user_id: userId,
      video_id: videoId,
      channel_id: channelId,
      error_message: error.message,
      error_stack: error.stack,
    });
    throw rpcError;
  }

  // Start asynchronous processing (but await it here for now as we don't have a job queue)
  // In a production environment with a proper job queue, this would be offloaded.
  // For now, we'll perform it synchronously and return the completed summary.
  await processSummaryGeneration(supabase, summary.id, youtubeVideoId);

  // Fetch the updated summary to get the final status and generated_at
  const { data: completedSummary, error: fetchError } = await supabase
    .from('summaries')
    .select('status, generated_at')
    .eq('id', summary.id)
    .single();

  if (fetchError) {
    errorLogger.appError(fetchError, {
      service: 'summaries_service',
      operation: 'fetch_completed_summary',
      summary_id: summary.id,
    });
    // Return with the original status if fetch fails
    return {
      id: summary.id,
      status: 'completed', // Assume completed since processSummaryGeneration didn't throw
      generated_at: new Date().toISOString(),
      message: 'Summary generated successfully',
    };
  }

  return {
    id: summary.id,
    status: completedSummary.status,
    generated_at: completedSummary.generated_at,
    message: completedSummary.status === 'completed' 
      ? 'Summary generated successfully' 
      : 'Summary generation initiated successfully',
  };
}

async function processSummaryGeneration(
    supabase: SupabaseClient,
    summaryId: string,
    youtubeVideoId: string
): Promise<void> {
    appLogger.debug('Starting processSummaryGeneration', { summaryId, youtubeVideoId });
    
    // Create service role client for backend operations (bypasses RLS)
    // This is needed because the user-authenticated client loses auth context in async processing
    const { createSupabaseServiceClient } = await import('../db/supabase.client');
    const serviceClient = createSupabaseServiceClient();

    try {
        // 1. Fetch Transcript
        appLogger.debug('Fetching transcript', { youtubeVideoId });
        const transcript = await fetchTranscript(youtubeVideoId);
        const transcriptText = transcriptToString(transcript);
        appLogger.debug('Transcript fetched', { length: transcriptText.length });

        // 2. Update status to in_progress (after successful transcript fetch)
        appLogger.debug('Updating status to in_progress', { summaryId });
        const { error: statusUpdateError } = await serviceClient
            .from('summaries')
            .update({ status: 'in_progress' })
            .eq('id', summaryId);
        
        if (statusUpdateError) {
            errorLogger.appError(statusUpdateError, {
                service: 'summaries_service',
                operation: 'update_status_to_in_progress',
                summary_id: summaryId,
                error_code: statusUpdateError.code,
                error_message: statusUpdateError.message,
                error_details: statusUpdateError.details,
            });
            throw statusUpdateError;
        }
        appLogger.debug('Status updated to in_progress', { summaryId });

        // 3. Initialize OpenRouter Service
        const apiKey = import.meta.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY is not configured');
        }
        
        appLogger.debug('Initializing OpenRouter service', { 
            hasApiKey: !!apiKey,
            model: 'google/gemini-2.0-flash-001'
        });
        
        const openRouter = new OpenRouterService({
            apiKey,
            defaultModel: 'google/gemini-2.0-flash-001',
        });

        // 3. Define Schema
        const summarySchema = {
          name: "youtube_video_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tldr: {
                type: "string",
                description: "Ultra-concise 2–4 sentence TL;DR in English. After reading this alone, someone must fully understand the video’s core message and value."
              },
              full_summary: {
                type: "object",
                properties: {
                  genre: {
                    type: "string",
                    enum: [
                      "Geopolitics", "Finance & Investing", "Personal Finance", "Economics",
                      "Technology", "AI & Machine Learning", "Science", "History", "Philosophy",
                      "Self-Improvement", "Productivity", "Health & Fitness", "Psychology",
                      "Business & Entrepreneurship", "Startups", "Crypto & Blockchain",
                      "Programming & Coding", "Book Summary", "Documentary", "News & Current Events",
                      "Comedy", "Lifestyle", "Travel", "Gaming", "Movie Review", "Reaction",
                      "Education", "Tutorial / How-to", "Vlog", "Interview", "Podcast Clip",
                      "Conspiracy / Alternative", "Spirituality", "Other"
                    ],
                    description: "Primary genre/topic of the video. Pick the single most accurate one from the list."
                  },
                  key_points: {
                    type: "array",
                    items: { type: "string" },
                    description: "8–15 most important takeaways. Each item is one complete, standalone sentence (no bullets/dashes inside the string)."
                  },
                  detailed_summary: {
                    type: "string",
                    description: "Full chronological summary in valid HTML using <h3> for major sections and <p> for paragraphs. So detailed that reading this completely replaces watching the video."
                  },
                  conclusions: {
                    type: "array",
                    items: { type: "string" },
                    description: "5–10 strongest conclusions, lessons, or actionable takeaways the creator wants you to remember."
                  },
                  memorable_quotes: {
                    type: "array",
                    items: { type: "string" },
                    description: "3–8 of the most powerful, funny, or insightful direct/near-direct quotes."
                  },
                  duration: { type: "string", description: "Video length as mm:ss or hh:mm:ss (e.g. '21:34' or '1:12:08')" },
                  language: { type: "string", description: "Main spoken language (e.g. 'English', 'Polish')" },
                  worth_watching: {
                    type: "string",
                    enum: ["Must watch", "Worth watching", "Watch only if you have time", "Skip – not worth it"],
                    description: "Your honest recommendation using one of the exact four phrases."
                  }
                },
                required: [
                  "genre",
                  "key_points",
                  "detailed_summary",
                  "conclusions",
                  "memorable_quotes",
                  "duration",
                  "language",
                  "worth_watching"
                ],
                additionalProperties: false
              }
            },
            required: ["tldr", "full_summary"],
            additionalProperties: false
          }
        };

        interface GeneratedSummary {
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
            };
        }

        // 4. Generate Summary
        const prompt = `
            You are the world’s best YouTube video summarizer. Create a summary so perfect that anyone reading it feels they’ve watched the entire video and captured 100% of its value.

            Full transcript:
            === TRANSCRIPT START ===
            ${transcriptText}
            === TRANSCRIPT END ===

            YouTube video id: ${youtubeVideoId}

            Return ONLY valid JSON that exactly matches the schema.
            No explanations, no markdown, no extra text.

            Use clear, native English throughout.
            First determine the single most accurate genre from the list, then fill every field with maximum detail and precision.
                 `;

        appLogger.debug('Sending request to OpenRouter', { model: 'google/gemini-2.0-flash-001', summaryId });
        const result = await openRouter.completeJson<GeneratedSummary>(
            [{ role: 'user', content: prompt }],
            summarySchema
        );
        appLogger.debug('Received response from OpenRouter', { summaryId, tldr_length: result.tldr.length });

        // 5. Update Database with completed summary
        appLogger.debug('Updating summary in database', {
            summaryId,
            tldr_length: result.tldr.length,
            has_full_summary: !!result.full_summary
        });
        
        const { error: updateError } = await serviceClient
            .from('summaries')
            .update({
                tldr: result.tldr,
                full_summary: result.full_summary,
                status: 'completed',
                generated_at: new Date().toISOString(),
            })
            .eq('id', summaryId);

        if (updateError) {
            errorLogger.appError(updateError, {
                service: 'summaries_service',
                operation: 'update_summary',
                summary_id: summaryId,
                error_code: updateError.code,
                error_message: updateError.message,
                error_details: updateError.details,
                error_hint: updateError.hint,
            });
            throw updateError;
        }
        
        appLogger.debug('Summary updated successfully', { summaryId });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        
        // Additional debug log to surface the real failure reason in dev logs
        appLogger.error('processSummaryGeneration failed', {
            summaryId,
            youtubeVideoId,
            errorName,
            errorMessage,
            errorStack,
        });

        errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
            service: 'summaries_service',
            operation: 'process_summary_generation',
            summary_id: summaryId,
            youtube_video_id: youtubeVideoId,
            error_message: errorMessage,
            error_stack: errorStack,
        });

        // Determine error code based on error type
        let errorCode: 'NO_SUBTITLES' | 'VIDEO_PRIVATE' | 'VIDEO_TOO_LONG' | null = null;
        
        if (errorMessage === 'TRANSCRIPT_NOT_AVAILABLE' || 
            errorMessage.includes('transcript') || 
            errorMessage.includes('subtitle') ||
            errorMessage.includes('Transcript is disabled') ||
            errorMessage.includes('No transcripts available')) {
            errorCode = 'NO_SUBTITLES';
        } else if (errorMessage === 'VIDEO_NOT_FOUND' ||
                   errorMessage.includes('private') || 
                   errorMessage.includes('unavailable') ||
                   errorMessage.includes('Video unavailable')) {
            errorCode = 'VIDEO_PRIVATE';
        } else if (errorMessage === 'VIDEO_TOO_LONG' ||
                   errorMessage.includes('too long') || 
                   errorMessage.includes('duration')) {
            errorCode = 'VIDEO_TOO_LONG';
        }
        // If no specific error code matches, leave it as null (generic failure)

        // Update status to failed using service client
        const { error: updateError } = await serviceClient.from('summaries').update({ 
            status: 'failed',
            error_code: errorCode
        }).eq('id', summaryId);
        
        if (updateError) {
            errorLogger.appError(updateError, {
                service: 'summaries_service',
                operation: 'update_failed_summary',
                summary_id: summaryId,
                error_code: updateError.code,
                error_message: updateError.message,
                error_details: updateError.details,
            });
        }
    }
}

/**
 * List summaries for user's subscribed channels with pagination and filtering
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param filters - Filter options
 * @returns Paginated response with summary data
 */
export async function listSummaries(
  supabase: SupabaseClient,
  userId: string,
  filters: {
    limit: number;
    offset: number;
    channel_id?: string;
    status?: SummaryStatus;
    sort?: string;
    include_hidden?: boolean;
    search?: string;
  }
): Promise<PaginatedResponse<SummaryWithVideo>> {
  // Filter by subscriptions (implicit filter for "my summaries")
  // We need to join with subscriptions to only show summaries from channels the user is subscribed to
  // BUT Supabase PostgREST doesn't support filtering on a non-embedded table easily without !inner join on a path
  // We have channels!inner already? No, channels is left joined above. 
  
  // Let's restructure the query to filter by channels the user is subscribed to.
  // Option 1: Get user's subscribed channel IDs first (two queries, but cleaner)
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('channel_id')
    .eq('user_id', userId);
    
  const subscribedChannelIds = subscriptions?.map(s => s.channel_id) || [];

  if (subscribedChannelIds.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        limit: filters.limit,
        offset: filters.offset,
      },
    };
  }

  // Get hidden summary IDs if we need to exclude them
  let hiddenSummaryIds: string[] = [];
  if (!filters.include_hidden) {
    const { data: hiddenSummaries } = await supabase
      .from('hidden_summaries')
      .select('summary_id')
      .eq('user_id', userId);
    
    hiddenSummaryIds = hiddenSummaries?.map(h => h.summary_id) || [];
  }

  let query = supabase
    .from('summaries')
    .select(`
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
      channels (
        id,
        name,
        youtube_channel_id,
        created_at
        )
      ),
      summary_ratings (
        rating
    )
    `, { count: 'exact' })
    .in('videos.channel_id', subscribedChannelIds) // Filter by subscribed channels using video's channel_id
    .order('published_at', { ascending: filters.sort === 'published_at_asc', foreignTable: 'videos' }); // Ordering by video published_at

  // Filter by channel
  if (filters.channel_id) {
    query = query.eq('videos.channel_id', filters.channel_id);
  }

  // Filter by status
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Exclude hidden summaries
  if (!filters.include_hidden && hiddenSummaryIds.length > 0) {
    query = query.not('id', 'in', `(${hiddenSummaryIds.join(',')})`);
  }

  // Search: full-text on video title and channel name
  if (filters.search) {
    // Note: Cross-table OR filters in PostgREST can be complex. 
    // For now, we'll strictly search on video title to avoid "failed to find relationship" errors with deep nesting in OR clauses
    // If needed later, we can implement a more complex search strategy or use a database function.
    query = query.ilike('videos.title', `%${filters.search}%`);
  }

  // Apply pagination
  const { data, count, error } = await query
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  const summaries: SummaryWithVideo[] = data?.map((row: any) => ({
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
      youtube_channel_id: row.videos.channels.youtube_channel_id,
      name: row.videos.channels.name,
      created_at: row.videos.channels.created_at,
    },
    tldr: row.tldr,
    status: row.status,
    generated_at: row.generated_at,
    user_rating: row.summary_ratings?.length > 0 ? row.summary_ratings[0].rating : null, // Assume one per user
    error_code: row.error_code, // Add if failed
  })) || [];

  return {
    data: summaries,
    pagination: {
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset,
    },
  };
}

/**
 * Get detailed summary information
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param summaryId - Summary ID
 * @returns Detailed summary data
 */
export async function getSummaryDetails(
  supabase: SupabaseClient,
  userId: string,
  summaryId: string
): Promise<DetailedSummary> {
  // Get summary with video and channel information
  const { data: summary, error: summaryError } = await supabase
    .from('summaries')
    .select(`
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
        channel_id,
      channels!inner (
        id,
        name,
        youtube_channel_id,
        created_at
        )
      )
    `)
    .eq('id', summaryId)
    .single();

  if (summaryError) {
    throw summaryError;
  }

  if (!summary) {
    throw new Error('SUMMARY_NOT_FOUND');
  }

  // Get rating statistics
  const { data: ratings } = await supabase
    .from('summary_ratings')
    .select('rating')
    .eq('summary_id', summaryId);

  const upvotes = (ratings || []).filter(r => r.rating === true).length;
  const downvotes = (ratings || []).filter(r => r.rating === false).length;

  // Get user's rating
  const { data: userRating } = await supabase
    .from('summary_ratings')
    .select('rating')
    .eq('summary_id', summaryId)
    .eq('user_id', userId)
    .maybeSingle();

  // Construct YouTube URL
  const youtubeUrl = `https://www.youtube.com/watch?v=${summary.videos.youtube_video_id}`;

  return {
    id: summary.id,
    video: {
      id: summary.videos.id,
      youtube_video_id: summary.videos.youtube_video_id,
      title: summary.videos.title,
      thumbnail_url: summary.videos.thumbnail_url,
      published_at: summary.videos.published_at,
      youtube_url: youtubeUrl,
    },
    channel: {
      id: summary.videos.channels.id,
      name: summary.videos.channels.name,
      youtube_channel_id: summary.videos.channels.youtube_channel_id,
      created_at: summary.videos.channels.created_at,
    },
    tldr: summary.tldr,
    full_summary: summary.full_summary as unknown as FullSummaryContent | null,
    status: summary.status,
    error_code: summary.error_code,
    generated_at: summary.generated_at,
    rating_stats: {
      upvotes,
      downvotes,
    },
    user_rating: userRating?.rating ?? null,
  };
}

/**
 * Generate 32-bit integer hash for advisory lock keys using crypto
 * @param str - String to hash
 * @returns 32-bit integer hash
 */
function hashStringToInt32(str: string): number {
  // Create SHA-256 hash of the string
  const hash = createHash('sha256').update(str).digest('hex');

  // Convert first 8 characters of hex to 32-bit integer
  // Take first 8 hex chars (32 bits) and convert to number
  const int32Hash = parseInt(hash.substring(0, 8), 16);

  // Ensure positive number (advisory locks work with positive integers)
  return Math.abs(int32Hash);
}
