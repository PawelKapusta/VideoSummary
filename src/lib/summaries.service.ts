import { createHash } from 'crypto';
import type { SupabaseClient } from '../db/supabase.client';
import { errorLogger } from './logger';
import type { SummaryBasic, SummaryWithVideo, DetailedSummary, PaginatedResponse, GenerationRequestInsert, SummaryInsert } from '../types';
import { extractYouTubeVideoId } from './youtube.utils';
import { fetchYouTubeVideoMetadata } from './youtube.service';

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
    status?: string;
    sort?: string;
    include_hidden?: boolean;
  }
): Promise<PaginatedResponse<SummaryWithVideo>> {
  const { limit, offset, channel_id, status, sort = 'published_at_desc', include_hidden = false } = filters;

  // Build query
  let query = supabase
    .from('summaries')
    .select(`
      id,
      tldr,
      status,
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
    `, { count: 'exact' });

  // Filter by channel if provided
  if (channel_id) {
    query = query.eq('videos.channel_id', channel_id);
  }

  // Filter by status if provided
  if (status) {
    query = query.eq('status', status as 'pending' | 'in_progress' | 'completed' | 'failed');
  }

  // Exclude hidden summaries unless include_hidden is true
  if (!include_hidden) {
    const { data: hiddenSummaries } = await supabase
      .from('hidden_summaries')
      .select('summary_id')
      .eq('user_id', userId);

    if (hiddenSummaries && hiddenSummaries.length > 0) {
      const hiddenIds = hiddenSummaries.map(h => h.summary_id).filter((id): id is string => id !== null);
      if (hiddenIds.length > 0) {
        query = query.not('id', 'in', `(${hiddenIds.map(id => `'${id}'`).join(',')})`);
      }
    }
  }

  // Apply sorting
  if (sort === 'published_at_asc') {
    query = query.order('published_at', { ascending: true, foreignTable: 'videos' });
  } else if (sort === 'published_at_desc') {
    query = query.order('published_at', { ascending: false, foreignTable: 'videos' });
  } else if (sort === 'generated_at_desc') {
    query = query.order('generated_at', { ascending: false, nullsFirst: false });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: summaries, error: summariesError, count } = await query;

  if (summariesError) {
    throw summariesError;
  }

  // Get user ratings for returned summaries
  const summaryIds = (summaries || []).map(s => s.id);
  let userRatings: Record<string, boolean> = {};

  if (summaryIds.length > 0) {
    const { data: ratings } = await supabase
      .from('summary_ratings')
      .select('summary_id, rating')
      .eq('user_id', userId)
      .in('summary_id', summaryIds);

    if (ratings) {
      userRatings = ratings.reduce((acc, r) => {
        if (r.summary_id) {
          acc[r.summary_id] = r.rating;
        }
        return acc;
      }, {} as Record<string, boolean>);
    }
  }

  // Format response
  const data: SummaryWithVideo[] = (summaries || []).map(summary => ({
    id: summary.id,
    video: {
      id: summary.videos.id,
      youtube_video_id: summary.videos.youtube_video_id,
      title: summary.videos.title,
      thumbnail_url: summary.videos.thumbnail_url,
      published_at: summary.videos.published_at,
    },
    channel: {
      id: summary.videos.channels.id,
      name: summary.videos.channels.name,
      youtube_channel_id: summary.videos.channels.youtube_channel_id,
      created_at: summary.videos.channels.created_at,
    },
    tldr: summary.tldr,
    status: summary.status,
    generated_at: summary.generated_at,
    user_rating: userRatings[summary.id] ?? null,
  }));

  return {
    data,
    pagination: {
      total: count || 0,
      limit,
      offset,
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
