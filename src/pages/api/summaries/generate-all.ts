import type { APIRoute } from 'astro';
import type { BulkGenerationResponse, ApiError, ApiSuccess } from '../../../types';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';
import { startBulkSummaryGeneration } from '../../../lib/summaries.service';
import type { RuntimeEnv } from '../../../lib/env';

/**
 * POST /api/summaries/generate-all
 *
 * Starts system bulk summary generation for all channels in the database.
 * This process runs asynchronously and generates summaries for the latest videos
 * from all channels (system operation, not user-specific).
 *
 * Authentication: Not required (system endpoint)
 * Request Body: Empty (no parameters needed)
 *
 * Response (202 Accepted):
 * {
 *   id: string,                    // Bulk generation ID
 *   status: "pending",            // Initial status
 *   message: string,              // Success message
 *   estimated_completion_time: string // Estimated time in minutes
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid request
 * - 409 Conflict: Bulk generation already in progress
 * - 422 Unprocessable Entity: No channels found
 * - 500 Internal Server Error: Database error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();

  try {

    // Validate request body (should be empty, but check if valid JSON)
    try {
      const body = await request.text();
      if (body && body.trim()) {
        // If body exists, it should be empty or valid JSON
        JSON.parse(body);
      }
    } catch (parseError) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Request body validation failed'),
        undefined,
        undefined,
        { endpoint: '/api/summaries/generate-all', method: 'POST' }
      );

      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/summaries/generate-all',
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('POST', '/api/summaries/generate-all', duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Request body must be empty or valid JSON',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Start bulk summary generation
    const runtimeEnv = locals.runtime?.env as RuntimeEnv;
    const result: BulkGenerationResponse = await startBulkSummaryGeneration(
      locals.supabase,
      runtimeEnv,
      locals.runtime?.ctx?.waitUntil
    );

    // Log successful bulk generation initiation
    securityLogger.auth('System bulk summary generation initiated successfully', {
      bulk_generation_id: result.id,
    });

    // Format successful response
    const successResponse: ApiSuccess<BulkGenerationResponse> = {
      data: result,
      message: result.message,
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/summaries/generate-all',
      statusCode: 202,
    });
    performanceLogger.apiResponseTime('POST', '/api/summaries/generate-all', duration, 202);

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
      if (error.message === 'BULK_GENERATION_IN_PROGRESS') {
        statusCode = 409;
        errorCode = 'BULK_GENERATION_IN_PROGRESS';
        message = 'Bulk summary generation is already in progress';
      } else if (error.message === 'NO_CHANNELS_FOUND') {
        statusCode = 422;
        errorCode = 'NO_CHANNELS_FOUND';
        message = 'No channels found in database';
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/summaries/generate-all',
      method: 'POST',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/summaries/generate-all',
      statusCode,
    });
    performanceLogger.apiResponseTime('POST', '/api/summaries/generate-all', duration, statusCode);

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