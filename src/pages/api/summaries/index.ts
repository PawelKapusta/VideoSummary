import type { APIRoute } from 'astro';
import type { SummaryBasic, SummaryWithVideo, PaginatedResponse, ApiSuccess, ApiError } from '../../../types';
import { GenerateSummaryRequestSchema, SummaryListFiltersSchema } from '../../../lib/validation/schemas';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';
import { generateSummary, listSummaries, isBulkGenerationInProgress } from '../../../lib/summaries.service';
import type { RuntimeEnv } from '../../../lib/env';

/**
 * POST /api/summaries
 *
 * Manually initiates summary generation for a YouTube video.
 * This endpoint performs atomic rate limiting and creates a summary generation request.
 *
 * Authentication: Required (Cookie session)
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
 * - 401 Unauthorized: Missing or invalid authentication session
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
    // Get user from session (cookie-based)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth('Unauthorized summary generation attempt - no valid session');
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/summaries',
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('POST', '/api/summaries', duration, 401);

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

    // Check if bulk generation is in progress (block individual generation)
    const bulkInProgress = await isBulkGenerationInProgress(supabase, userId);
    if (bulkInProgress) {
      const duration = performance.now() - startTime;
      securityLogger.auth('Individual summary generation blocked - bulk generation in progress', {
        user_id: userId,
      });

      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/summaries',
        statusCode: 409,
      });
      performanceLogger.apiResponseTime('POST', '/api/summaries', duration, 409);

      const errorResponse: ApiError = {
        error: {
          code: 'BULK_GENERATION_IN_PROGRESS',
          message: 'Cannot generate individual summaries while bulk generation is in progress. Please wait for bulk generation to complete.',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    // Generate summary (queued for async processing - bypasses 30s waitUntil limit)
    const runtimeEnv = locals.runtime?.env as RuntimeEnv;
    
    const summaryData: SummaryBasic & { message: string } = await generateSummary(
      supabase,
      userId,
      video_url,
      runtimeEnv
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
      } else if (error.message === 'VIDEO_PRIVATE' || error.message === 'YT_CAPTION_LIST_AUTH_REQUIRED' || error.message === 'YT_CAPTION_DOWNLOAD_AUTH_REQUIRED') {
        statusCode = 404;
        errorCode = 'VIDEO_PRIVATE';
        message = 'Video is private or unavailable';
      } else if (error.message === 'NO_SUBTITLES' || error.message === 'TRANSCRIPT_NOT_AVAILABLE' || error.message === 'TRANSCRIPT_EMPTY') {
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

/**
 * GET /api/summaries
 *
 * Retrieves summaries for videos from the user's subscribed channels with pagination, filtering, and sorting.
 * By default excludes hidden summaries unless explicitly requested.
 *
 * Authentication: Required (Cookie session)
 * Query Parameters:
 * - limit (number, default: 20, max: 100)
 * - offset (number, default: 0, min: 0)
 * - channel_id (UUID, optional) - Filter by specific channel
 * - status (string, optional) - Filter by status: "pending", "in_progress", "completed", "failed"
 * - sort (string, default: "published_at_desc") - Options: "published_at_desc", "published_at_asc", "generated_at_desc"
 * - include_hidden (boolean, default: false) - Include hidden summaries
 *
 * Response (200 OK):
 * {
 *   data: SummaryWithVideo[],
 *   pagination: {
 *     total: number,
 *     limit: number,
 *     offset: number
 *   }
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 500 Internal Server Error: Database query error
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
      securityLogger.auth('Unauthorized summaries list attempt - no valid session');
      securityLogger.apiAccess({
        method: 'GET',
        path: '/api/summaries',
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('GET', '/api/summaries', duration, 401);

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

    // Parse and validate query parameters
    const urlParams = new URL(url).searchParams;
    const rawLimit = urlParams.get('limit');
    const rawOffset = urlParams.get('offset');
    const rawChannelId = urlParams.get('channel_id');
    const rawStatus = urlParams.get('status');
    const rawSort = urlParams.get('sort');
    const rawIncludeHidden = urlParams.get('include_hidden');
    const rawHiddenOnly = urlParams.get('hidden_only');
    const rawSearch = urlParams.get('search');

    const validationResult = SummaryListFiltersSchema.safeParse({
      limit: rawLimit,
      offset: rawOffset,
      channel_id: rawChannelId || undefined,
      status: rawStatus || undefined,
      sort: rawSort || undefined,
      include_hidden: rawIncludeHidden || undefined,
      hidden_only: rawHiddenOnly || undefined,
      search: rawSearch || undefined,
    });

    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Query parameter validation failed'),
        undefined,
        undefined,
        { endpoint: '/api/summaries', method: 'GET' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'GET',
        path: '/api/summaries',
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('GET', '/api/summaries', duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid query parameters',
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const filters = validationResult.data;

    // Get paginated summaries
    const result: PaginatedResponse<SummaryWithVideo> = await listSummaries(
      supabase,
      userId,
      {
        ...filters,
        sort: filters.sort === 'published_at_asc' ? 'oldest' : 'newest',
      }
    );

    // Log successful summaries access
    securityLogger.auth('Summaries list accessed successfully', {
      user_id: userId,
      total_summaries: result.pagination.total,
      filters: {
        limit: filters.limit,
        offset: filters.offset,
        channel_id: filters.channel_id,
        status: filters.status,
        sort: filters.sort,
        include_hidden: filters.include_hidden,
      },
    });

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'GET',
      path: '/api/summaries',
      statusCode: 200,
    });
    performanceLogger.apiResponseTime('GET', '/api/summaries', duration, 200);

    return new Response(JSON.stringify(result), {
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
    // Handle unexpected errors
    const duration = performance.now() - startTime;
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/summaries',
      method: 'GET',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'GET',
      path: '/api/summaries',
      statusCode: 500,
    });
    performanceLogger.apiResponseTime('GET', '/api/summaries', duration, 500);

    const errorResponse: ApiError = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
