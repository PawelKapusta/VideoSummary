import type { APIRoute } from "astro";
import type { ApiSuccess, ApiError } from "../../../types";
import { securityLogger, errorLogger, performanceLogger } from "../../../lib/logger";
import { createSupabaseServiceClient } from "../../../db/supabase.client";
import type { RuntimeEnv } from "../../../lib/env";

/**
 * POST /api/auth/delete-account
 *
 * Permanently deletes the authenticated user's account and all associated data.
 * This action cannot be undone.
 *
 * Authentication: Required (Cookie session)
 * Request Body: None
 *
 * Response (200 OK):
 * {
 *   message: "Account successfully deleted"
 * }
 *
 * Error Responses:
 * - 401 Unauthorized: Missing or invalid session
 * - 500 Internal Server Error: Database or auth service error
 */
export const POST: APIRoute = async ({ locals }) => {
  const startTime = performance.now();

  // Use regular Supabase client from middleware to get current user
  const supabase = locals.supabase;

  try {
    // Get current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth("Delete account attempt - no valid session");
      securityLogger.apiAccess({
        method: "POST",
        path: "/api/auth/delete-account",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("POST", "/api/auth/delete-account", duration, 401);

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

    // Log the deletion attempt
    securityLogger.auth("Account deletion initiated", {
      user_id: userId,
      user_email: user.email,
    });

    // Create service client for admin operations
    const runtimeEnv = locals.runtime?.env as RuntimeEnv;
    const serviceClient = createSupabaseServiceClient(undefined, runtimeEnv);

    // Delete the user from Supabase Auth (this will cascade delete related data)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    // Sign out from the current session
    await supabase.auth.signOut();

    // Log successful deletion
    securityLogger.auth("Account successfully deleted", {
      user_id: userId,
      user_email: user.email,
    });

    // Format successful response
    const successResponse: ApiSuccess<void> = {
      message: "Account successfully deleted",
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/auth/delete-account",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("POST", "/api/auth/delete-account", duration, 200);

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
      endpoint: "/api/auth/delete-account",
      method: "POST",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/auth/delete-account",
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("POST", "/api/auth/delete-account", duration, 500);

    const errorResponse: ApiError = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete account. Please try again or contact support.",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
