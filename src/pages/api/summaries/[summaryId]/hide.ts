import type { APIRoute } from "astro";
import type { ApiError, ApiSuccess } from "../../../../types";
import { UUIDSchema } from "../../../../lib/validation/schemas";
import { securityLogger, errorLogger, performanceLogger } from "../../../../lib/logger";
import { hideSummary, unhideSummary } from "../../../../lib/hidden-summaries.service";

/**
 * POST /api/summaries/:summaryId/hide
 *
 * Hides a summary from the user's dashboard.
 *
 * Authentication: Required (Cookie session)
 * Path Parameters:
 * - summaryId (UUID) - ID of the summary
 * Body: None
 *
 * Response (200 OK):
 * {
 *   message: string
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid summary ID
 * - 401 Unauthorized: Missing or invalid session
 * - 403 Forbidden: Not subscribed to channel or already hidden
 * - 404 Not Found: Summary not found
 * - 500 Internal Server Error: Database or server error
 */
export const POST: APIRoute = async ({ locals, params }) => {
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
      securityLogger.auth("Unauthorized summary hide attempt - no valid session");
      securityLogger.apiAccess({
        method: "POST",
        path: `/api/summaries/${params.summaryId}/hide`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/hide`, duration, 401);

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
        path: `/api/summaries/${params.summaryId}/hide`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/hide`, duration, 400);

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
        endpoint: `/api/summaries/${params.summaryId}/hide`,
        method: "POST",
      });

      securityLogger.apiAccess({
        method: "POST",
        path: `/api/summaries/${params.summaryId}/hide`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/hide`, duration, 400);

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

    // Call service to hide summary
    let hideResult: { message: string };
    try {
      hideResult = await hideSummary(supabase, userId, summaryId);
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
            message = "You must be subscribed to the channel to hide this summary";
            break;
          case "ALREADY_HIDDEN":
            statusCode = 409;
            errorCode = "ALREADY_HIDDEN";
            message = "Summary is already hidden";
            break;
          // Add more cases as needed
        }
      }

      const duration = performance.now() - startTime;
      errorLogger.appError(serviceError instanceof Error ? serviceError : new Error(String(serviceError)), {
        endpoint: `/api/summaries/${summaryId}/hide`,
        method: "POST",
      });

      securityLogger.apiAccess({
        method: "POST",
        path: `/api/summaries/${summaryId}/hide`,
        statusCode,
      });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/hide`, duration, statusCode);

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
    securityLogger.auth("Summary hidden successfully", {
      user_id: userId,
      summary_id: summaryId,
    });

    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "POST",
      path: `/api/summaries/${summaryId}/hide`,
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/hide`, duration, 200);

    const successResponse: ApiSuccess = {
      message: hideResult.message,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
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
      endpoint: `/api/summaries/${params.summaryId}/hide`,
      method: "POST",
    });

    securityLogger.apiAccess({
      method: "POST",
      path: `/api/summaries/${params.summaryId}/hide`,
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("POST", `/api/summaries/${params.summaryId}/hide`, duration, 500);

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
 * DELETE /api/summaries/:summaryId/hide
 *
 * Removes a summary from the user's hidden list, making it appear in their dashboard again.
 *
 * Authentication: Required (Cookie session)
 * Path Parameters:
 * - summaryId (UUID) - ID of the summary to unhide
 *
 * Response (200 OK):
 * {
 *   message: "Summary restored to your dashboard"
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid summary ID format
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 404 Not Found: Summary not found or not hidden
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
      securityLogger.auth("Unauthorized unhide summary attempt - no valid session");
      securityLogger.apiAccess({
        method: "DELETE",
        path: `/api/summaries/${params.summaryId}/hide`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/hide`, duration, 401);

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
        path: `/api/summaries/${params.summaryId}/hide`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/hide`, duration, 400);

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
        endpoint: `/api/summaries/${params.summaryId}/hide`,
        method: "DELETE",
      });

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "DELETE",
        path: `/api/summaries/${params.summaryId}/hide`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/hide`, duration, 400);

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

    // Unhide the summary
    const result = await unhideSummary(supabase, userId, summaryId);

    // Log successful unhide
    securityLogger.auth("Summary unhidden successfully", {
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
      path: `/api/summaries/${params.summaryId}/hide`,
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/hide`, duration, 200);

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
      if (error.message === "SUMMARY_NOT_HIDDEN") {
        statusCode = 404;
        errorCode = "RESOURCE_NOT_FOUND";
        message = "Summary not found or not hidden";
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: `/api/summaries/${params.summaryId}/hide`,
      method: "DELETE",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "DELETE",
      path: `/api/summaries/${params.summaryId}/hide`,
      statusCode,
    });
    performanceLogger.apiResponseTime("DELETE", `/api/summaries/${params.summaryId}/hide`, duration, statusCode);

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
