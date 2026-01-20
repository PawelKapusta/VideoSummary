import type { APIRoute } from "astro";
import type { ApiSuccess, ApiError } from "../../../types";
import { securityLogger, errorLogger, performanceLogger } from "../../../lib/logger";

/**
 * POST /api/auth/logout
 *
 * Terminates the current authenticated user session by invalidating the access token.
 * Signs out from Supabase and clears auth cookies.
 *
 * Request Body: None
 *
 * Response (200 OK):
 * {
 *   message: "Successfully logged out"
 * }
 *
 * Error Responses:
 * - 500 Internal Server Error: Supabase Auth service error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Check for existing session to log who is logging out
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "unknown";

    // Sign out from Supabase (clears cookies and invalidates session)
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Log warning but proceed to return success as we want to clear client state anyway
      console.warn("Supabase signOut error:", error);
    }

    // Log logout attempt
    securityLogger.auth("User logout processed", {
      user_id: userId,
    });

    // Format successful response
    const successResponse: ApiSuccess<void> = {
      message: "Successfully logged out",
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/auth/logout",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("POST", "/api/auth/logout", duration, 200);

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
    // Handle unexpected errors
    const duration = performance.now() - startTime;
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: "/api/auth/logout",
      method: "POST",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/auth/logout",
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("POST", "/api/auth/logout", duration, 500);

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
