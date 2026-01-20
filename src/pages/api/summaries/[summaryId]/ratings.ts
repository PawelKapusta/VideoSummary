import type { APIRoute } from "astro";
import type { RateSummaryRequest, RatingResponse, ApiError, ApiSuccess } from "../../../../types";
import { UUIDSchema } from "../../../../lib/validation/schemas";
import { z } from "zod";
import { securityLogger, errorLogger, performanceLogger } from "../../../../lib/logger";
import { rateSummary, removeRating } from "../../../../lib/ratings.service";

/**
 * POST /api/summaries/:summaryId/ratings
 *
 * Rates a summary (upvote or downvote). Creates a new rating or updates existing one.
 *
 * Authentication: Required (Cookie session)
 * Path Parameters:
 * - summaryId (UUID) - ID of the summary
 * Body:
 * - rating: boolean (true = upvote, false = downvote)
 *
 * Response (200 OK or 201 Created):
 * {
 *   id: string,
 *   summary_id: string,
 *   rating: boolean,
 *   created_at: string,
 *   message: string
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid input (UUID, body)
 * - 401 Unauthorized: Missing or invalid session
 * - 403 Forbidden: Not subscribed to channel
 * - 404 Not Found: Summary not found
 * - 500 Internal Server Error: Database or server error
 */
export const POST: APIRoute = async ({ request, locals, params }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware
  const supabase = locals.supabase;

  try {
    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth("Unauthorized summary rating attempt - no valid session");
      securityLogger.apiAccess({
        method: "POST",
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/ratings`, duration, 401);

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

      securityLogger.apiAccess({
        method: "POST",
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/ratings`, duration, 400);

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
        endpoint: `/api/summaries/${params.summaryId}/ratings`,
        method: "POST",
      });

      securityLogger.apiAccess({
        method: "POST",
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/ratings`, duration, 400);

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

    // Parse and validate request body
    let body;
    try {
      body = (await request.json()) as RateSummaryRequest;
    } catch {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Invalid JSON body"), undefined, undefined, {
        endpoint: `/api/summaries/${params.summaryId}/ratings`,
        method: "POST",
      });

      securityLogger.apiAccess({
        method: "POST",
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/ratings`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid JSON body",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodySchema = z.object({ rating: z.boolean() });
    const bodyValidation = bodySchema.safeParse(body);
    if (!bodyValidation.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Request body validation failed"), undefined, undefined, {
        endpoint: `/api/summaries/${params.summaryId}/ratings`,
        method: "POST",
      });

      securityLogger.apiAccess({
        method: "POST",
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/ratings`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid rating value",
          details: bodyValidation.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { rating } = bodyValidation.data;

    // Call service to rate summary
    let ratingResult: RatingResponse & { statusCode: number };
    try {
      ratingResult = await rateSummary(supabase, userId, summaryId, rating);
    } catch (serviceError) {
      let statusCode = 500;
      let errorCode = "INTERNAL_ERROR";
      let message = "An unexpected error occurred";

      if (serviceError instanceof Error) {
        switch (serviceError.message) {
          case "SUMMARY_NOT_FOUND":
            statusCode = 404;
            errorCode = "SUMMARY_NOT_FOUND";
            message = "Summary not found";
            break;
          case "CHANNEL_NOT_SUBSCRIBED":
            statusCode = 403;
            errorCode = "FORBIDDEN";
            message = "You must be subscribed to the channel to rate this summary";
            break;
          // Add more cases as needed from service errors
        }
      }

      const duration = performance.now() - startTime;
      errorLogger.appError(serviceError instanceof Error ? serviceError : new Error(String(serviceError)), {
        endpoint: `/api/summaries/${summaryId}/ratings`,
        method: "POST",
      });

      securityLogger.apiAccess({
        method: "POST",
        path: `/api/summaries/${summaryId}/ratings`,
        statusCode,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/ratings`, duration, statusCode);

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

    // Log success
    securityLogger.auth("Summary rated successfully", {
      user_id: userId,
      summary_id: summaryId,
      rating,
    });

    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "POST",
      path: `/api/summaries/${summaryId}/ratings`,
      statusCode: ratingResult.statusCode,
    });
    performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/ratings`, duration, ratingResult.statusCode);

    // Remove statusCode from response as per type
    const { ...responseData } = ratingResult;

    return new Response(JSON.stringify(responseData), {
      status: ratingResult.statusCode,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: `/api/summaries/${params.summaryId}/ratings`,
      method: "POST",
    });

    securityLogger.apiAccess({
      method: "POST",
      path: `/api/summaries/${params.summaryId}/ratings`,
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/ratings`, duration, 500);

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

/**
 * DELETE /api/summaries/:summaryId/ratings
 *
 * Removes the user's rating from a summary.
 *
 * Authentication: Required (Cookie session)
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
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 404 Not Found: Rating not found
 * - 500 Internal Server Error: Database error
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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
      securityLogger.auth("Unauthorized rating removal attempt - no valid session");
      securityLogger.apiAccess({
        method: "DELETE",
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/ratings`, duration, 401);

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
        method: "DELETE",
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/ratings`, duration, 400);

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
        endpoint: `/api/summaries/${params.summaryId}/ratings`,
        method: "DELETE",
      });

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "DELETE",
        path: `/api/summaries/${params.summaryId}/ratings`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/ratings`, duration, 400);

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

    // Remove the rating
    const result = await removeRating(supabase, userId, summaryId);

    // Log successful rating removal
    securityLogger.auth("Rating removed successfully", {
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
      method: "DELETE",
      path: `/api/summaries/${params.summaryId}/ratings`,
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/ratings`, duration, 200);

    return new Response(JSON.stringify(successResponse), {
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
      if (error.message === "RATING_NOT_FOUND") {
        statusCode = 404;
        errorCode = "RESOURCE_NOT_FOUND";
        message = "Rating not found";
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: `/api/summaries/${params.summaryId}/ratings`,
      method: "DELETE",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "DELETE",
      path: `/api/summaries/${params.summaryId}/ratings`,
      statusCode,
    });
    performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/ratings`, duration, statusCode);

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
