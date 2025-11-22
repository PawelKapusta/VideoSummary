import type { APIRoute } from 'astro';
import type { SummaryBasic, ApiSuccess, ApiError } from '../../../types';
import { GenerateSummaryRequestSchema } from '../../../lib/validation/schemas';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';
import { generateSummary } from '../../../lib/summaries.service';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';

/**
 * POST /api/summaries
 *
 * Manually initiates summary generation for a YouTube video.
 * This endpoint performs atomic rate limiting and creates a summary generation request.
 *
 * Authentication: Required (Bearer token)
 * Request Body:
 * {
 *   video_url: string // YouTube video URL (watch?v= or youtu.be/)
 * }
 *
 * Response (202 Accepted):
 * {
 *   id: string,           // Summary ID
 *   status: "pending",    // Initial status
 *   generated_at: null,   // Will be set when completed
 *   message: "Summary generation initiated successfully"
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid YouTube video URL
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: Video belongs to non-subscribed channel
 * - 404 Not Found: YouTube video not found or unavailable
 * - 409 Conflict: Summary already exists or generation in progress
 * - 422 Unprocessable Entity: Video too long (>45 min) or no subtitles
 * - 429 Too Many Requests: Daily generation limit reached for this channel
 * - 500 Internal Server Error: YouTube API error or database error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Use default user ID for testing (temporary)
    const userId = DEFAULT_USER_ID;

    // Parse request body
    const body = await request.json();

    // Validate request body using Zod schema
    const validationResult = GenerateSummaryRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Request validation failed'),
        undefined,
        undefined,
        { endpoint: '/api/summaries', method: 'POST' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/summaries',
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('POST', '/api/summaries', duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_URL',
          message: 'Invalid YouTube video URL format',
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { video_url }: { video_url: string } = validationResult.data;

    // Generate summary
    const summaryData: SummaryBasic & { message: string } = await generateSummary(
      supabase,
      userId,
      video_url
    );

    // Log successful summary generation initiation
    securityLogger.auth('Summary generation initiated successfully', {
      user_id: userId,
      summary_id: summaryData.id,
      video_url: video_url,
    });

    // Format successful response
    const successResponse: ApiSuccess<SummaryBasic & { message: string }> = {
      data: summaryData,
      message: summaryData.message,
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/summaries',
      statusCode: 202,
    });
    performanceLogger.apiResponseTime('POST', '/api/summaries', duration, 202);

    return new Response(JSON.stringify(successResponse), {
      status: 202,
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
      if (error.message === 'VIDEO_TOO_LONG') {
        statusCode = 422;
        errorCode = 'VIDEO_TOO_LONG';
        message = 'Video exceeds 45-minute limit';
      } else if (error.message === 'VIDEO_PRIVATE') {
        statusCode = 404;
        errorCode = 'VIDEO_PRIVATE';
        message = 'Video is private or unavailable';
      } else if (error.message === 'NO_SUBTITLES') {
        statusCode = 422;
        errorCode = 'NO_SUBTITLES';
        message = 'Video has no available subtitles';
      } else if (error.message === 'CHANNEL_NOT_SUBSCRIBED') {
        statusCode = 403;
        errorCode = 'CHANNEL_NOT_SUBSCRIBED';
        message = 'You must be subscribed to the video\'s channel';
      } else if (error.message === 'SUMMARY_ALREADY_EXISTS') {
        statusCode = 409;
        errorCode = 'SUMMARY_ALREADY_EXISTS';
        message = 'Summary already exists for this video';
      } else if (error.message === 'GENERATION_IN_PROGRESS') {
        statusCode = 409;
        errorCode = 'GENERATION_IN_PROGRESS';
        message = 'Summary generation is already in progress for this video';
      } else if (error.message === 'GENERATION_LIMIT_REACHED') {
        statusCode = 429;
        errorCode = 'GENERATION_LIMIT_REACHED';
        message = 'Daily summary generation limit reached for this channel';
      } else if (error.message.includes('YouTube video not found')) {
        statusCode = 404;
        errorCode = 'VIDEO_NOT_FOUND';
        message = 'YouTube video not found';
      } else if (error.message.includes('YouTube API')) {
        statusCode = 500;
        errorCode = 'YOUTUBE_API_ERROR';
        message = 'YouTube API service error';
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/summaries',
      method: 'POST',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/summaries',
      statusCode,
    });
    performanceLogger.apiResponseTime('POST', '/api/summaries', duration, statusCode);

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
