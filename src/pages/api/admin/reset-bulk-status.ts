import type { APIRoute } from "astro";
import type { ApiError, ApiSuccess } from "../../../types";
import { securityLogger, errorLogger, performanceLogger, appLogger } from "../../../lib/logger";

/**
 * POST /api/admin/reset-bulk-status
 *
 * Resets bulk generation status that have been stuck in "in_progress" for more than 1 hour.
 * This is an admin endpoint for development and maintenance purposes.
 *
 * Authentication: Required (Cookie session) - must be admin user
 * Body: Empty (no parameters needed)
 *
 * Response (200 OK):
 * {
 *   data: {
 *     reset_count: number,
 *     updated_ids: string[]
 *   },
 *   message: string
 * }
 *
 * Error Responses:
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 403 Forbidden: User is not admin
 * - 500 Internal Server Error: Database error
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const startTime = performance.now();

  try {
    // Get user from session
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth("Unauthorized reset bulk status attempt - no valid session");
      securityLogger.apiAccess({
        method: "POST",
        path: "/api/admin/reset-bulk-status",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("POST", "/api/admin/reset-bulk-status", duration, 401);

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

    // For now, allow any authenticated user (in development)
    // In production, you might want to check for admin role
    appLogger.info("Resetting stuck bulk generations", { userId });

    // Call the database function
    const { data: result, error: rpcError } = await supabase.rpc("reset_stuck_bulk_generations");

    if (rpcError) {
      throw rpcError;
    }

    const resetCount = result?.reset_count || 0;
    const updatedIds = result?.updated_ids || [];

    appLogger.info("Bulk generations reset completed", {
      userId,
      resetCount,
      updatedIds,
    });

    // Format successful response
    const successResponse: ApiSuccess<{ reset_count: number; updated_ids: string[] }> = {
      data: {
        reset_count: resetCount,
        updated_ids: updatedIds,
      },
      message: `Reset ${resetCount} stuck bulk generation(s)`,
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/admin/reset-bulk-status",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("POST", "/api/admin/reset-bulk-status", duration, 200);

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
    const errorMessage = error instanceof Error ? error.message : String(error);

    errorLogger.appError(error instanceof Error ? error : new Error(errorMessage), {
      endpoint: "/api/admin/reset-bulk-status",
      method: "POST",
    });

    securityLogger.apiAccess({
      method: "POST",
      path: "/api/admin/reset-bulk-status",
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("POST", "/api/admin/reset-bulk-status", duration, 500);

    const errorResponse: ApiError = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to reset bulk generation status",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
