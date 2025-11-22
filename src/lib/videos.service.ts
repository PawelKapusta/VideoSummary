import type { SupabaseClient } from '../db/supabase.client';
import type { Database } from '../db/database.types';
import type { PaginatedResponse, VideoSummary } from '../types';

/**
 * List videos from user's subscribed channels with pagination, filtering, and sorting
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param filters - Filter options (limit, offset, channel_id, sort)
 * @returns Paginated response with video summary data
 */
export async function listVideos(
  supabase: SupabaseClient,
  userId: string,
  filters: {
    limit: number;
    offset: number;
    channel_id?: string;
    sort: 'published_at_desc' | 'published_at_asc';
  }
): Promise<PaginatedResponse<VideoSummary>> {
  let query = supabase
    .from('videos')
    .select(`
      id,
      youtube_video_id,
      title,
      thumbnail_url,
      published_at,
      channels (
        id,
        youtube_channel_id,
        name,
        created_at
      ),
      summaries (
        id
      )
    `, { count: 'exact' });

  // Filter by channel if specified
  if (filters.channel_id) {
    query = query.eq('channel_id', filters.channel_id);
  }

  // Apply sorting
  const orderColumn = 'published_at';
  const ascending = filters.sort === 'published_at_asc';
  query = query.order(orderColumn, { ascending });

  // Apply pagination
  query = query.range(filters.offset, filters.offset + filters.limit - 1);

  const { data: videos, error: videosError, count } = await query;

  if (videosError) {
    throw videosError;
  }

  // Format videos according to VideoSummary type
  const data: VideoSummary[] = (videos || []).map(video => ({
    id: video.id,
    youtube_video_id: video.youtube_video_id,
    title: video.title,
    thumbnail_url: video.thumbnail_url,
    published_at: video.published_at,
    channel: {
      id: video.channels.id,
      youtube_channel_id: video.channels.youtube_channel_id,
      name: video.channels.name,
      created_at: video.channels.created_at,
    },
    has_summary: !!(video.summaries && video.summaries.length > 0),
  }));

  // Return paginated response
  return {
    data,
    pagination: {
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset,
    },
  };
}

/**
 * Get detailed video information
 * @param supabase - Supabase client instance
 * @param videoId - Video ID
 * @returns DetailedVideo data
 */
export async function getVideoDetails(
  supabase: SupabaseClient,
  videoId: string
) {
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select(`
      *,
      channels (
        id,
        youtube_channel_id,
        name,
        created_at
      ),
      summaries (
        id,
        status,
        generated_at
      )
    `)
    .eq('id', videoId)
    .single();

  if (videoError) {
    if (videoError.code === 'PGRST116') {
      throw new Error('VIDEO_NOT_FOUND');
    }
    throw videoError;
  }

  // Check if user is subscribed to the channel (RLS will handle this)
  // If not subscribed, the query would return no results due to RLS policy

  return {
    id: video.id,
    youtube_video_id: video.youtube_video_id,
    title: video.title,
    thumbnail_url: video.thumbnail_url,
    published_at: video.published_at,
    metadata_last_checked_at: video.metadata_last_checked_at,
    channel: {
      id: video.channels.id,
      youtube_channel_id: video.channels.youtube_channel_id,
      name: video.channels.name,
      created_at: video.channels.created_at,
    },
    summary: video.summaries && video.summaries.length > 0 ? {
      id: video.summaries[0].id,
      status: video.summaries[0].status,
      generated_at: video.summaries[0].generated_at,
    } : null,
  };
}
