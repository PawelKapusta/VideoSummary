import { errorLogger, appLogger } from './logger';
import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptTooManyRequestError,
} from 'youtube-transcript';

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

/**
 * Fetch transcript from YouTube video using youtube-transcript package
 * @param videoId - YouTube video ID
 * @returns Array of transcript segments
 * @throws Error if transcript is not available or fetch fails
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  appLogger.debug('Fetching transcript from YouTube using youtube-transcript', { videoId });

  try {
    appLogger.debug('Calling YoutubeTranscript.fetchTranscript', { videoId });
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(videoId);

    appLogger.debug('YoutubeTranscript response received', {
      videoId,
      responseType: typeof transcriptResponse,
      isArray: Array.isArray(transcriptResponse),
      length: transcriptResponse?.length ?? 'null',
      firstItem: transcriptResponse?.[0] ?? 'empty',
    });

    if (!transcriptResponse || transcriptResponse.length === 0) {
      appLogger.warn('No transcript segments found', { videoId });
      throw new Error('TRANSCRIPT_NOT_AVAILABLE');
    }

    // Convert to our segment format (offset and duration are already in ms)
    const segments: TranscriptSegment[] = transcriptResponse.map((item) => ({
      text: item.text,
      offset: Math.round(item.offset),
      duration: Math.round(item.duration),
    }));

    appLogger.debug('Transcript fetched successfully', {
      videoId,
      segments: segments.length,
      totalLength: segments.reduce((sum, s) => sum + s.text.length, 0),
    });

    const preview = transcriptToString(segments).slice(0, 500);
    appLogger.debug('Transcript preview', {
      videoId,
      previewLength: preview.length,
      preview,
    });

    return segments;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      service: 'transcript_service',
      operation: 'fetch_transcript',
      video_id: videoId,
      error_message: errorMessage,
      error_stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle specific youtube-transcript errors
    if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new Error('VIDEO_NOT_FOUND');
    }

    if (
      error instanceof YoutubeTranscriptDisabledError ||
      error instanceof YoutubeTranscriptNotAvailableError
    ) {
      throw new Error('TRANSCRIPT_NOT_AVAILABLE');
    }

    if (error instanceof YoutubeTranscriptTooManyRequestError) {
      appLogger.error('YouTube rate limit hit', { videoId });
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // Re-throw known errors
    if (errorMessage === 'TRANSCRIPT_NOT_AVAILABLE' || errorMessage === 'VIDEO_NOT_FOUND') {
      throw error;
    }

    throw error;
  }
}

export function transcriptToString(transcript: TranscriptSegment[]): string {
  return transcript.map((segment) => segment.text).join(' ');
}
