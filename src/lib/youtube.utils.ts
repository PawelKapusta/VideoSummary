/**
 * YouTube utility functions for extracting IDs from URLs and validating formats
 */

/**
 * Extract YouTube channel ID from various URL formats
 * @param url - YouTube channel URL
 * @returns YouTube channel ID or throws error
 */
export function extractYouTubeChannelId(url: string): string {
  try {
    // Remove protocol and www if present
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Handle different YouTube URL formats
    if (cleanUrl.startsWith('youtube.com/channel/')) {
      // youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxx
      const match = cleanUrl.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
      if (match) return match[1];
    }

    if (cleanUrl.startsWith('youtube.com/@')) {
      // youtube.com/@channelname - this needs API resolution
      // For now, throw error as we need the actual channel ID
      throw new Error('Handle format requires channel ID extraction via API');
    }

    if (cleanUrl.startsWith('youtube.com/c/') || cleanUrl.startsWith('youtube.com/user/')) {
      // youtube.com/c/channelname or youtube.com/user/username
      // These are legacy formats that redirect to /channel/UC... or /@...
      throw new Error('Legacy YouTube URL format - please use /channel/UC... or /@... format');
    }

    if (cleanUrl.startsWith('youtu.be/')) {
      // youtu.be is for videos, not channels
      throw new Error('youtu.be URLs are for videos, not channels');
    }

    throw new Error('Invalid YouTube channel URL format');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract channel ID: ${error.message}`);
    }
    throw new Error('Failed to extract channel ID from URL');
  }
}

/**
 * Extract YouTube video ID from various URL formats
 * @param url - YouTube video URL
 * @returns YouTube video ID or throws error
 */
export function extractYouTubeVideoId(url: string): string {
  try {
    // Remove protocol and www if present
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Handle different YouTube URL formats
    if (cleanUrl.includes('youtube.com/watch?v=')) {
      // youtube.com/watch?v=VIDEO_ID
      const match = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }

    if (cleanUrl.startsWith('youtu.be/')) {
      // youtu.be/VIDEO_ID
      const match = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }

    if (cleanUrl.includes('youtube.com/embed/')) {
      // youtube.com/embed/VIDEO_ID
      const match = cleanUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }

    throw new Error('Invalid YouTube video URL format');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract video ID: ${error.message}`);
    }
    throw new Error('Failed to extract video ID from URL');
  }
}

/**
 * Validate if a string is a valid YouTube channel ID format
 * @param channelId - Potential YouTube channel ID
 * @returns true if valid format
 */
export function isValidYouTubeChannelId(channelId: string): boolean {
  // YouTube channel IDs start with UC and are 24 characters long
  return /^UC[\w-]{22}$/.test(channelId);
}

/**
 * Validate if a string is a valid YouTube video ID format
 * @param videoId - Potential YouTube video ID
 * @returns true if valid format
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  // YouTube video IDs are 11 characters long with specific allowed characters
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}
