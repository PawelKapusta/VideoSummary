import type { APIRoute } from 'astro';
import type { GenerationStatusResponse, ApiError } from '../../../types';
import { UUIDSchema } from '../../../lib/validation/schemas';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';
import { checkGenerationStatus } from '../../../lib/generation-requests.service';

/**
 * GET /api/generation-requests/status
 *
 * Checks if a summary can be generated for a specific channel today by verifying
 * the global daily limit (1 successful summary per channel per day across all users).
 *
 * Authentication: Required (Cookie session)
 * Query Parameters:
 * - channel_id (UUID, required) - ID of the channel to check
 *
 * Response (200 OK):
 * {
 *   channel_id: string,
 *   can_generate: boolean,
 *   successful_summaries_today_global: number,
 *   limit: number,
 *   last_successful_generation_at: string | null,
 *   note: string
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Missing or invalid channel_id
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 403 Forbidden: Channel not subscribed by user
 * - 500 Internal Server Error: Database error
 */
export const GET: APIRoute = async ({ request, locals, url }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Get user from session (cookie-based)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth('Unauthorized generation status check - no valid session');
      securityLogger.apiAccess({
        method: 'GET',
        path: '/api/generation-requests/status',
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('GET', '/api/generation-requests/status', duration, 401);

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

    // Extract and validate channel_id from query params
    const urlParams = new URL(url).searchParams;
    const channelId = urlParams.get('channel_id');

    if (!channelId) {
      const duration = performance.now() - startTime;

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'GET',
        path: '/api/generation-requests/status',
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('GET', '/api/generation-requests/status', duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'channel_id query parameter is required',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validationResult = UUIDSchema.safeParse(channelId);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Query parameter validation failed'),
        undefined,
        undefined,
        { endpoint: '/api/generation-requests/status', method: 'GET' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'GET',
        path: '/api/generation-requests/status',
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('GET', '/api/generation-requests/status', duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid channel_id format',
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check generation status
    const status: GenerationStatusResponse = await checkGenerationStatus(
      supabase,
      userId,
      channelId
    );

    // Log successful status check
    securityLogger.auth('Generation status checked successfully', {
      user_id: userId,
      channel_id: channelId,
      can_generate: status.can_generate,
    });

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'GET',
      path: '/api/generation-requests/status',
      statusCode: 200,
    });
    performanceLogger.apiResponseTime('GET', '/api/generation-requests/status', duration, 200);

    return new Response(JSON.stringify(status), {
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
      if (error.message === 'CHANNEL_NOT_SUBSCRIBED') {
        statusCode = 403;
        errorCode = 'CHANNEL_NOT_SUBSCRIBED';
        message = 'You must be subscribed to this channel';
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/generation-requests/status',
      method: 'GET',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'GET',
      path: '/api/generation-requests/status',
      statusCode,
    });
    performanceLogger.apiResponseTime('GET', '/api/generation-requests/status', duration, statusCode);

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
