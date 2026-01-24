import type { APIRoute } from "astro";
import type { PaginatedResponse, VideoSummary, ApiError } from "../../../types";
import { VideoListFiltersSchema, UUIDSchema } from "../../../lib/validation/schemas";
import { securityLogger, errorLogger, performanceLogger } from "../../../lib/logger";
import { listVideos } from "../../../lib/videos.service";

/**
 * GET /api/videos
 *
 * Retrieves videos from the user's subscribed channels with pagination, filtering, and sorting options.
 * Only returns videos from channels the user is subscribed to (enforced by RLS).
 *
 * Authentication: Required (Cookie session)
 * Query Parameters:
 * - limit (number, default: 20, max: 100)
 * - offset (number, default: 0, min: 0)
 * - channel_id (UUID, optional) - Filter by specific channel
 * - sort (string, default: "published_at_desc") - Options: "published_at_desc", "published_at_asc"
 *
 * Response (200 OK):
 * {
 *   data: VideoSummary[],
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
export const GET: APIRoute = async ({ locals, url }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Get user from session (cookie-based)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth("Unauthorized videos list attempt - no valid session");
      securityLogger.apiAccess({
        method: "GET",
        path: "/api/videos",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("GET", "/api/videos", duration, 401);

      const errorResponse: ApiError = {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Parse and validate query parameters
    const urlParams = new URL(url).searchParams;
    const rawLimit = urlParams.get("limit");
    const rawOffset = urlParams.get("offset");
    const rawChannelId = urlParams.get("channel_id");
    const rawStatus = urlParams.get("status");
    const rawSearch = urlParams.get("search");
    const rawSort = urlParams.get("sort");
    const rawPublishedAtFrom = urlParams.get("published_at_from");
    const rawPublishedAtTo = urlParams.get("published_at_to");

    const validationResult = VideoListFiltersSchema.safeParse({
      limit: rawLimit,
      offset: rawOffset,
      channel_id: rawChannelId || undefined,
      status: rawStatus || undefined,
      search: rawSearch || undefined,
      sort: rawSort || undefined,
      published_at_from: rawPublishedAtFrom || undefined,
      published_at_to: rawPublishedAtTo || undefined,
    });

    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Query parameter validation failed"), undefined, undefined, {
        endpoint: "/api/videos",
        method: "GET",
      });

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "GET",
        path: "/api/videos",
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("GET", "/api/videos", duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid query parameters",
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const filters = validationResult.data;

    // Validate channel_id if provided
    if (filters.channel_id) {
      const channelValidation = UUIDSchema.safeParse(filters.channel_id);
      if (!channelValidation.success) {
        const duration = performance.now() - startTime;

        // Log API access and performance for validation error
        securityLogger.apiAccess({
          method: "GET",
          path: "/api/videos",
          statusCode: 400,
        });
        performanceLogger.apiResponseTime("GET", "/api/videos", duration, 400);

        const errorResponse: ApiError = {
          error: {
            code: "INVALID_INPUT",
            message: "Invalid channel_id format",
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Get paginated videos
    const result: PaginatedResponse<VideoSummary> = await listVideos(supabase, userId, filters);

    // Log successful videos access
    securityLogger.auth("Videos list accessed successfully", {
      user_id: userId,
      total_videos: result.pagination.total,
      filters: {
        limit: filters.limit,
        offset: filters.offset,
        channel_id: filters.channel_id,
        status: filters.status,
        search: filters.search,
        sort: filters.sort,
      },
    });

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "GET",
      path: "/api/videos",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("GET", "/api/videos", duration, 200);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Add security headers
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    });
  } catch (error) {
    // Handle unexpected errors
    const duration = performance.now() - startTime;
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: "/api/videos",
      method: "GET",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "GET",
      path: "/api/videos",
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("GET", "/api/videos", duration, 500);

    const errorResponse: ApiError = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
