import type { APIRoute } from 'astro';
import type { RatingResponse, ApiSuccess, ApiError } from '../../../../types';
import { UUIDSchema, RateSummaryRequestSchema } from '../../../../lib/validation/schemas';
import { securityLogger, errorLogger, performanceLogger } from '../../../../lib/logger';
import { rateSummary, removeRating } from '../../../../lib/ratings.service';

/**
 * POST /api/summaries/:summaryId/ratings
 *
 * Creates or updates the user's rating for a summary.
 * Uses upsert operation to handle both new ratings and rating changes.
 *
 * Authentication: Required (Bearer token)
 * Path Parameters:
 * - summaryId (UUID) - ID of the summary to rate
 *
 * Request Body:
 * {
 *   rating: boolean // true = upvote, false = downvote
 * }
 *
 * Response (201 Created or 200 OK):
 * {
 *   id: string,
 *   summary_id: string,
 *   rating: boolean,
 *   created_at: string,
 *   message: string
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid summary ID or rating value
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 403 Forbidden: Cannot rate summaries from non-subscribed channels
 * - 404 Not Found: Summary not found
 * - 500 Internal Server Error: Database error
 */
export const POST: APIRoute = async ({ request, locals, params }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Extract auth token from request header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const duration = performance.now() - startTime;
      securityLogger.auth('Unauthorized rating attempt - no token');
      securityLogger.apiAccess({
        method: 'POST',
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('POST', `/api/summaries/${params.summaryId}/ratings`, duration, 401);

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

    const token = authHeader.substring(7);
    
    // Decode JWT to get user ID (basic decode without verification - Supabase RLS will verify)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      const duration = performance.now() - startTime;
      securityLogger.auth('Unauthorized rating attempt - invalid token');
      securityLogger.apiAccess({
        method: 'POST',
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('POST', `/api/summaries/${params.summaryId}/ratings`, duration, 401);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract and validate summary ID from path
    const summaryId = params.summaryId;
    if (!summaryId) {
      const duration = performance.now() - startTime;

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'POST',
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('POST', `/api/summaries/${params.summaryId}/ratings`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Summary ID is required',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validationResult = UUIDSchema.safeParse(summaryId);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Path parameter validation failed'),
        undefined,
        undefined,
        { endpoint: `/api/summaries/${params.summaryId}/ratings`, method: 'POST' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'POST',
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('POST', `/api/summaries/${params.summaryId}/ratings`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid summary ID format',
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await request.json();

    // Validate request body using Zod schema
    const bodyValidationResult = RateSummaryRequestSchema.safeParse(body);
    if (!bodyValidationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Request validation failed'),
        undefined,
        undefined,
        { endpoint: `/api/summaries/${params.summaryId}/ratings`, method: 'POST' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'POST',
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('POST', `/api/summaries/${params.summaryId}/ratings`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid rating value',
          details: bodyValidationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { rating } = bodyValidationResult.data;

    // Rate the summary
    const ratingResponse = await rateSummary(supabase, userId, summaryId, rating);
    const statusCode = ratingResponse.statusCode;

    // Remove statusCode from response (internal use only)
    const { statusCode: _, ...responseData } = ratingResponse;

    // Log successful rating
    securityLogger.auth('Summary rated successfully', {
      user_id: userId,
      summary_id: summaryId,
      rating: rating,
      is_update: statusCode === 200,
    });

    // Format successful response
    const successResponse: ApiSuccess<RatingResponse> = {
      data: responseData,
      message: responseData.message,
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'POST',
      path: `/api/summaries/${params.summaryId}/ratings`,
      statusCode,
    });
    performanceLogger.apiResponseTime('POST', `/api/summaries/${params.summaryId}/ratings`, duration, statusCode);

    return new Response(JSON.stringify(successResponse), {
      status: statusCode,
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
      if (error.message === 'SUMMARY_NOT_FOUND') {
        statusCode = 404;
        errorCode = 'RESOURCE_NOT_FOUND';
        message = 'Summary not found';
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: `/api/summaries/${params.summaryId}/ratings`,
      method: 'POST',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'POST',
      path: `/api/summaries/${params.summaryId}/ratings`,
      statusCode,
    });
    performanceLogger.apiResponseTime('POST', `/api/summaries/${params.summaryId}/ratings`, duration, statusCode);

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

/**
 * DELETE /api/summaries/:summaryId/ratings
 *
 * Removes the user's rating from a summary.
 *
 * Authentication: Required (Bearer token)
 * Path Parameters:
 * - summaryId (UUID) - ID of the summary
 *
 * Response (200 OK):
 * {
 *   message: "Rating removed successfully"
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid summary ID format
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Rating not found
 * - 500 Internal Server Error: Database error
 */
export const DELETE: APIRoute = async ({ request, locals, params }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Extract auth token from request header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const duration = performance.now() - startTime;
      securityLogger.auth('Unauthorized rating removal attempt - no token');
      securityLogger.apiAccess({
        method: 'DELETE',
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('DELETE', `/api/summaries/${params.summaryId}/ratings`, duration, 401);

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

    const token = authHeader.substring(7);
    
    // Decode JWT to get user ID (basic decode without verification - Supabase RLS will verify)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      const duration = performance.now() - startTime;
      securityLogger.auth('Unauthorized rating removal attempt - invalid token');
      securityLogger.apiAccess({
        method: 'DELETE',
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('DELETE', `/api/summaries/${params.summaryId}/ratings`, duration, 401);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract and validate summary ID from path
    const summaryId = params.summaryId;
    if (!summaryId) {
      const duration = performance.now() - startTime;

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'DELETE',
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('DELETE', `/api/summaries/${params.summaryId}/ratings`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Summary ID is required',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validationResult = UUIDSchema.safeParse(summaryId);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Path parameter validation failed'),
        undefined,
        undefined,
        { endpoint: `/api/summaries/${params.summaryId}/ratings`, method: 'DELETE' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'DELETE',
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('DELETE', `/api/summaries/${params.summaryId}/ratings`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid summary ID format',
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Remove the rating
    const result = await removeRating(supabase, userId, summaryId);

    // Log successful rating removal
    securityLogger.auth('Rating removed successfully', {
      user_id: userId,
      summary_id: summaryId,
    });

    // Format successful response
    const successResponse: ApiSuccess<void> = {
      message: result.message,
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'DELETE',
      path: `/api/summaries/${params.summaryId}/ratings`,
      statusCode: 200,
    });
    performanceLogger.apiResponseTime('DELETE', `/api/summaries/${params.summaryId}/ratings`, duration, 200);

    return new Response(JSON.stringify(successResponse), {
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
      if (error.message === 'RATING_NOT_FOUND') {
        statusCode = 404;
        errorCode = 'RESOURCE_NOT_FOUND';
        message = 'Rating not found';
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: `/api/summaries/${params.summaryId}/ratings`,
      method: 'DELETE',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'DELETE',
      path: `/api/summaries/${params.summaryId}/ratings`,
      statusCode,
    });
    performanceLogger.apiResponseTime('DELETE', `/api/summaries/${params.summaryId}/ratings`, duration, statusCode);

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

