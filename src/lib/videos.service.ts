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
    status?: 'all' | 'with' | 'without';
    search?: string;
    sort: 'published_at_desc' | 'published_at_asc';
  }
): Promise<PaginatedResponse<VideoSummary>> {
  // Use the videos_with_summaries view which includes the computed summary_id column
  // This view automatically applies RLS policies and is more efficient than separate queries
  let query = supabase
    .from('videos_with_summaries')
    .select(`
      id,
      youtube_video_id,
      title,
      thumbnail_url,
      published_at,
      summary_id,
      channels (
        id,
        youtube_channel_id,
        name,
        created_at
      )
    `, { count: 'exact' });

  // Filter by channel if specified
  if (filters.channel_id) {
    query = query.eq('channel_id', filters.channel_id);
  }

  // Filter by summary status
  if (filters.status === 'with') {
    query = query.not('summary_id', 'is', null);
  } else if (filters.status === 'without') {
    query = query.is('summary_id', null);
  }

  // Filter by search query (title)
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
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
  const data: VideoSummary[] = (videos || []).map(video => {
    // Ensure all required fields are present (though DB schema guarantees most)
    // and handle potential join nulls if relationship is optional (though here it should be present)
    
    // Safety check for channel, though the join should ensure it exists if video exists
    // (INNER JOIN behavior depends on supabase-js handling, usually it returns null if relation missing but foreign key is non-nullable)
    // Cast video.channels to handle potential array/single object ambiguity from SelectQuery normalization if needed,
    // but here typed as Single object usually.
    const channel = Array.isArray(video.channels) ? video.channels[0] : video.channels;

    if (!channel) {
       // Should not happen with valid data integrity
       throw new Error(`Video ${video.id} has no channel data`);
    }

    return {
      id: video.id!,
      youtube_video_id: video.youtube_video_id!,
      title: video.title!,
      thumbnail_url: video.thumbnail_url,
      published_at: video.published_at,
      channel: {
        id: channel.id,
        youtube_channel_id: channel.youtube_channel_id,
        name: channel.name,
        created_at: channel.created_at,
      },
      summary_id: video.summary_id,
    };
  });

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
    summary: (video as any).summaries && 
      (video as any).summaries.length > 0 && 
      (video as any).summaries[0].status === 'completed' ? {
      id: (video as any).summaries[0].id,
      status: (video as any).summaries[0].status,
      generated_at: (video as any).summaries[0].generated_at,
    } : null,
  };
}
