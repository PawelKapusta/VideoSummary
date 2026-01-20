import type { APIRoute } from "astro";
import type { DetailedSummary, ApiError } from "../../../types";
import { UUIDSchema } from "../../../lib/validation/schemas";
import { securityLogger, errorLogger, performanceLogger } from "../../../lib/logger";
import { getSummaryDetails } from "../../../lib/summaries.service";

/**
 * GET /api/summaries/:summaryId
 *
 * Retrieves complete details of a specific summary including full summary content,
 * video information, rating statistics, and the user's personal rating.
 *
 * Authentication: Required (Cookie session)
 * Path Parameters:
 * - summaryId (UUID) - ID of the summary
 *
 * Response (200 OK):
 * {
 *   id: string,
 *   video: VideoWithUrl,
 *   channel: Channel,
 *   tldr: string | null,
 *   full_summary: JSON,
 *   status: SummaryStatus,
 *   error_code: SummaryErrorCode | null,
 *   generated_at: string | null,
 *   rating_stats: { upvotes: number, downvotes: number },
 *   user_rating: boolean | null
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid summary ID format
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 403 Forbidden: Summary belongs to non-subscribed channel
 * - 404 Not Found: Summary not found
 * - 500 Internal Server Error: Database error
 */
export const GET: APIRoute = async ({ locals, params }) => {
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
      securityLogger.auth("Unauthorized summary details attempt - no valid session");
      securityLogger.apiAccess({
        method: "GET",
        path: `/api/summaries/${params.summaryId}`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("GET", `/api/summaries/${params.summaryId}`, duration, 401);

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

    // Extract and validate summary ID from path
    const summaryId = params.summaryId;
    if (!summaryId) {
      const duration = performance.now() - startTime;

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "GET",
        path: `/api/summaries/${params.summaryId}`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("GET", `/api/summaries/${params.summaryId}`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Summary ID is required",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = UUIDSchema.safeParse(summaryId);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Path parameter validation failed"), undefined, undefined, {
        endpoint: `/api/summaries/${params.summaryId}`,
        method: "GET",
      });

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "GET",
        path: `/api/summaries/${params.summaryId}`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("GET", `/api/summaries/${params.summaryId}`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid summary ID format",
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get summary details
    const summary: DetailedSummary = await getSummaryDetails(supabase, userId, summaryId);

    // Log successful summary details access
    securityLogger.auth("Summary details accessed successfully", {
      user_id: userId,
      summary_id: summaryId,
    });

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "GET",
      path: `/api/summaries/${params.summaryId}`,
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("GET", `/api/summaries/${params.summaryId}`, duration, 200);

    return new Response(JSON.stringify(summary), {
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
    // Handle specific error types
    const duration = performance.now() - startTime;
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";

    if (error instanceof Error) {
      if (error.message === "SUMMARY_NOT_FOUND") {
        statusCode = 404;
        errorCode = "SUMMARY_NOT_FOUND";
        message = "Summary not found";
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: `/api/summaries/${params.summaryId}`,
      method: "GET",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "GET",
      path: `/api/summaries/${params.summaryId}`,
      statusCode,
    });
    performanceLogger.apiResponseTime("GET", `/api/summaries/${params.summaryId}`, duration, statusCode);

    const errorResponse: ApiError = {
      error: {
        code: errorCode,
        message,
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};
