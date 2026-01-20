import type { APIRoute } from "astro";
import type { ApiError, ApiSuccess } from "../../../types";
import { securityLogger, errorLogger, performanceLogger } from "../../../lib/logger";
import { unhideAllSummaries } from "../../../lib/hidden-summaries.service";

/**
 * POST /api/summaries/unhide-all
 *
 * Restores all hidden summaries to the user's dashboard.
 *
 * Authentication: Required (Cookie session)
 * Body: None
 *
 * Response (200 OK):
 * {
 *   message: string,
 *   count: number
 * }
 */
export const POST: APIRoute = async ({ locals }) => {
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
      securityLogger.auth("Unauthorized unhide all summaries attempt - no valid session");
      securityLogger.apiAccess({
        method: "POST",
        path: "/api/summaries/unhide-all",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("POST", "/api/summaries/unhide-all", duration, 401);

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

    // Call service to unhide all summaries
    const result = await unhideAllSummaries(supabase, userId);

    // Log success
    securityLogger.auth("All summaries unhidden successfully", {
      user_id: userId,
      count: result.count,
    });

    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/summaries/unhide-all",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("POST", "/api/summaries/unhide-all", duration, 200);

    const successResponse: ApiSuccess<{ count: number }> = {
      message: result.message,
      data: {
        count: result.count,
      },
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
      endpoint: "/api/summaries/unhide-all",
      method: "POST",
    });

    securityLogger.apiAccess({
      method: "POST",
      path: "/api/summaries/unhide-all",
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("POST", "/api/summaries/unhide-all", duration, 500);

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
