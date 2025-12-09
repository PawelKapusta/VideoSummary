import { errorLogger, appLogger } from './logger';

/**
 * YouTube API service interfaces and types
 */

export interface YouTubeChannelMetadata {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  subscriberCount?: number;
  videoCount?: number;
  thumbnailUrl: string;
}

export interface YouTubeVideoMetadata {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  duration: number; // in seconds
  viewCount?: number;
  thumbnailUrl: string;
  hasSubtitles: boolean;
  isPrivate: boolean;
  isUnlisted: boolean;
}

/**
 * Fetch YouTube channel metadata using YouTube Data API
 * @param channelIdOrHandle - YouTube channel ID (UC...) or handle (@username)
 * @returns Channel metadata or throws error
 */
export async function fetchYouTubeChannelMetadata(channelIdOrHandle: string): Promise<YouTubeChannelMetadata> {
  const apiKey = import.meta.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }

  try {
    // Determine if this is a handle (@username) or channel ID (UC...)
    const isHandle = channelIdOrHandle.startsWith('@');
    const paramName = isHandle ? 'forHandle' : 'id';
    const paramValue = isHandle ? channelIdOrHandle : channelIdOrHandle;

    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&${paramName}=${paramValue}&key=${apiKey}`;

    appLogger.debug('Fetching YouTube channel metadata', { url: url.replace(apiKey, 'REDACTED') });

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('YouTube API quota exceeded or access denied');
      }
      if (response.status === 404) {
        throw new Error('YouTube channel not found');
      }
      throw new Error(`YouTube API error: ${data.error?.message || 'Unknown error'}`);
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('YouTube channel not found');
    }

    const channel = data.items[0];
    const snippet = channel.snippet;
    const statistics = channel.statistics;

    return {
      id: channel.id,
      title: snippet.title,
      description: snippet.description || '',
      publishedAt: snippet.publishedAt,
      subscriberCount: statistics ? parseInt(statistics.subscriberCount) : undefined,
      videoCount: statistics ? parseInt(statistics.videoCount) : undefined,
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
    };
  } catch (error) {
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      service: 'youtube_api',
      operation: 'fetch_channel_metadata',
      channel_id_or_handle: channelIdOrHandle,
    });

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch YouTube channel metadata');
  }
}

/**
 * Fetch YouTube video metadata using YouTube Data API
 * @param videoId - YouTube video ID
 * @returns Video metadata or throws error
 */
export async function fetchYouTubeVideoMetadata(videoId: string): Promise<YouTubeVideoMetadata> {
  // Try both import.meta.env and process.env for server compatibility
  const apiKey = import.meta.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }

  try {
    // Fetch video details and captions in parallel
    appLogger.debug('Fetching YouTube video metadata', { videoId });
    const [videoResponse, captionsResponse] = await Promise.all([
      fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=${videoId}&key=${apiKey}`),
      fetch(`https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`)
    ]);

    const [videoData, captionsData] = await Promise.all([
      videoResponse.json(),
      captionsResponse.json()
    ]);

    // Check video API response
    if (!videoResponse.ok) {
      if (videoResponse.status === 403) {
        throw new Error('YouTube API quota exceeded or access denied');
      }
      if (videoResponse.status === 404) {
        throw new Error('YouTube video not found');
      }
      throw new Error(`YouTube API error: ${videoData.error?.message || 'Unknown error'}`);
    }

    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('YouTube video not found');
    }

    const video = videoData.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const status = video.status;
    const statistics = video.statistics;

    // Parse duration (ISO 8601 format like PT4M13S)
    const durationMatch = contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(durationMatch?.[1] || '0');
    const minutes = parseInt(durationMatch?.[2] || '0');
    const seconds = parseInt(durationMatch?.[3] || '0');
    const duration = hours * 3600 + minutes * 60 + seconds;

    // Check if video has subtitles/captions
    const hasSubtitles = captionsResponse.ok &&
                        captionsData.items &&
                        captionsData.items.length > 0;

    // Check privacy status
    const isPrivate = status.privacyStatus === 'private';
    const isUnlisted = status.privacyStatus === 'unlisted';

    return {
      id: video.id,
      title: snippet.title,
      description: snippet.description || '',
      publishedAt: snippet.publishedAt,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      duration,
      viewCount: statistics ? parseInt(statistics.viewCount) : undefined,
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      hasSubtitles,
      isPrivate,
      isUnlisted,
    };
  } catch (error) {
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      service: 'youtube_api',
      operation: 'fetch_video_metadata',
      video_id: videoId,
    });

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch YouTube video metadata');
  }
}
