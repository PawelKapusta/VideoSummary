import type { APIRoute } from 'astro';
import type { DetailedVideo, ApiError } from '../../../types';
import { UUIDSchema } from '../../../lib/validation/schemas';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';
import { getVideoDetails } from '../../../lib/videos.service';

/**
 * GET /api/videos/:videoId
 *
 * Retrieves detailed information about a specific video, including its channel
 * and summary status. User must be subscribed to the video's channel to access it.
 *
 * Authentication: Required (Cookie session)
 * Path Parameters:
 * - videoId (UUID) - ID of the video
 *
 * Response (200 OK):
 * {
 *   id: string,
 *   youtube_video_id: string,
 *   title: string,
 *   thumbnail_url: string | null,
 *   published_at: string | null,
 *   metadata_last_checked_at: string | null,
 *   channel: Channel,
 *   summary: SummaryBasic | null
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid video ID format
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 403 Forbidden: Video belongs to non-subscribed channel
 * - 404 Not Found: Video not found
 * - 500 Internal Server Error: Database error
 */
export const GET: APIRoute = async ({ request, locals, params }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Get user from session (cookie-based)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth('Unauthorized video details attempt - no valid session');
      securityLogger.apiAccess({
        method: 'GET',
        path: `/api/videos/${params.videoId}`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('GET', `/api/videos/${params.videoId}`, duration, 401);

      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Extract and validate video ID from path
    const videoId = params.videoId;
    if (!videoId) {
      const duration = performance.now() - startTime;

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'GET',
        path: `/api/videos/${params.videoId}`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('GET', `/api/videos/${params.videoId}`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Video ID is required',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validationResult = UUIDSchema.safeParse(videoId);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Path parameter validation failed'),
        undefined,
        undefined,
        { endpoint: `/api/videos/${params.videoId}`, method: 'GET' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'GET',
        path: `/api/videos/${params.videoId}`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('GET', `/api/videos/${params.videoId}`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid video ID format',
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get video details
    const video: DetailedVideo = await getVideoDetails(supabase, videoId);

    // Log successful video details access
    securityLogger.auth('Video details accessed successfully', {
      user_id: userId,
      video_id: videoId,
    });

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'GET',
      path: `/api/videos/${params.videoId}`,
      statusCode: 200,
    });
    performanceLogger.apiResponseTime('GET', `/api/videos/${params.videoId}`, duration, 200);

    return new Response(JSON.stringify(video), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Add security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });

  } catch (error) {
    // Handle specific error types
    const duration = performance.now() - startTime;
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';

    if (error instanceof Error) {
      if (error.message === 'VIDEO_NOT_FOUND') {
        statusCode = 404;
        errorCode = 'RESOURCE_NOT_FOUND';
        message = 'Video not found';
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: `/api/videos/${params.videoId}`,
      method: 'GET',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'GET',
      path: `/api/videos/${params.videoId}`,
      statusCode,
    });
    performanceLogger.apiResponseTime('GET', `/api/videos/${params.videoId}`, duration, statusCode);

    const errorResponse: ApiError = {
      error: {
        code: errorCode,
        message,
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
