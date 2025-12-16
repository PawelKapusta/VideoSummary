import type { APIRoute } from 'astro';
import { extractYouTubeVideoId } from '../../../lib/youtube.utils';
import { fetchYouTubeVideoMetadata } from '../../../lib/youtube.service';
import type { VideoMetaResponse, ChannelInsert } from '../../../types';

export const GET: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = user.id;

  const url = new URL(request.url);
  const videoUrl = url.searchParams.get('url');

  if (!videoUrl) {
    return new Response(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Missing video_url query parameter' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const youtubeVideoId = extractYouTubeVideoId(videoUrl);
    const videoMetadata = await fetchYouTubeVideoMetadata(youtubeVideoId);

    // Get or create channel
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id, name')
      .eq('youtube_channel_id', videoMetadata.channelId)
      .single();

    let channelId: string;
    let channelName: string;

    if (existingChannel) {
      channelId = existingChannel.id;
      channelName = existingChannel.name;
    } else {
      const newChannel: ChannelInsert = {
        youtube_channel_id: videoMetadata.channelId,
        name: videoMetadata.channelTitle,
      };
      const { data: createdChannel, error: insertError } = await supabase.from('channels').insert(newChannel).select('id, name').single();

      if (insertError) {
        throw new Error(`Failed to create channel: ${insertError.message}`);
      }
      channelId = createdChannel.id;
      channelName = createdChannel.name;
    }

    // Check if user is subscribed
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_id', channelId)
      .single();

    // Check if video already exists and has summary status
    const { data: existingVideo } = await supabase
      .from('videos_with_summaries')
      .select('summary_status')
      .eq('youtube_video_id', videoMetadata.id)
      .single();

    const response: VideoMetaResponse = {
      youtube_video_id: videoMetadata.id,
      title: videoMetadata.title,
      thumbnail_url: videoMetadata.thumbnailUrl,
      duration_seconds: videoMetadata.duration,
      channel: {
        id: channelId,
        youtube_channel_id: videoMetadata.channelId,
        name: channelName,
      },
      is_subscribed: !!subscription,
      summary_status: existingVideo?.summary_status || null,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';

    if (errorMessage.includes('Invalid YouTube video URL format') || errorMessage.includes('Failed to extract video ID')) {
      statusCode = 400;
      errorCode = 'INVALID_VIDEO_URL';
    } else if (errorMessage.includes('YouTube video not found')) {
      statusCode = 404;
      errorCode = 'VIDEO_NOT_FOUND';
    } else if (errorMessage.includes('YouTube API quota exceeded')) {
      statusCode = 429;
      errorCode = 'YOUTUBE_QUOTA_EXCEEDED';
    }
    
    return new Response(JSON.stringify({ error: { code: errorCode, message: errorMessage } }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
