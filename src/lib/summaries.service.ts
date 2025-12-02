import { createHash } from 'crypto';
import type { SupabaseClient } from '../db/supabase.client';
import { errorLogger } from './logger';
import type { SummaryBasic, SummaryWithVideo, DetailedSummary, PaginatedResponse, SummaryStatus } from '../types';
import { extractYouTubeVideoId } from './youtube.utils';
import { fetchYouTubeVideoMetadata } from './youtube.service';
import type { Database } from '../db/database.types';
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
  // Extract YouTube video ID from URL
  const youtubeVideoId = extractYouTubeVideoId(videoUrl);

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
  } else {
    // Video doesn't exist, fetch from YouTube API
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
    } else {
      // Fetch channel metadata
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
      errorLogger.appError(insertVideoError, {
        service: 'summaries_service',
        operation: 'video_insert',
        youtube_video_id: youtubeVideoId,
      });
      throw insertVideoError;
    }

    videoId = newVideo.id;
  }

  // Verify user is subscribed to the channel
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
    throw new Error('CHANNEL_NOT_SUBSCRIBED');
  }

  // Check if summary already exists
  const { data: existingSummary, error: summaryError } = await supabase
    .from('summaries')
    .select('id, status')
    .eq('video_id', videoId)
    .single();

  if (summaryError && summaryError.code !== 'PGRST116') {
    throw summaryError;
  }

  if (existingSummary) {
    if (existingSummary.status === 'completed') {
      throw new Error('SUMMARY_ALREADY_EXISTS');
    }
    if (existingSummary.status === 'pending' || existingSummary.status === 'in_progress') {
      throw new Error('GENERATION_IN_PROGRESS');
    }
    // If status is 'failed', we can retry
  }

  // Atomic operation: rate limit check and summary creation
  const lockKey = hashStringToInt32(channelId);

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

    summary = result.data;
    const generateError = result.error;

    if (generateError) {
      errorLogger.appError(generateError, {
        service: 'summaries_service',
        operation: 'atomic_summary_generation',
        user_id: userId,
        video_id: videoId,
        channel_id: channelId,
      });

      if (generateError.message.includes('GENERATION_LIMIT_REACHED')) {
        throw new Error('GENERATION_LIMIT_REACHED');
      }
      throw generateError;
    }

    if (!summary) {
      throw new Error('No summary data returned from atomic function');
    }
  } catch (rpcError) {
    errorLogger.appError(rpcError instanceof Error ? rpcError : new Error(String(rpcError)), {
      service: 'summaries_service',
      operation: 'rpc_call_failed',
      user_id: userId,
      video_id: videoId,
      channel_id: channelId,
    });
    throw rpcError;
  }

  return {
    id: summary.id,
    status: summary.status,
    generated_at: null, // Will be set when generation completes
    message: 'Summary generation initiated successfully',
  };
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
    query = query.eq('channel_id', filters.channel_id);
  }

  // Filter by status
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Exclude hidden if not included
  if (!filters.include_hidden) {
    query = query.not('id', 'in', 
      supabase.from('hidden_summaries').select('summary_id').eq('user_id', userId)
    );
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
    full_summary: summary.full_summary,
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
