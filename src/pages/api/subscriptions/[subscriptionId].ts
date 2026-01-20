import type { APIRoute } from "astro";
import type { ApiSuccess, ApiError } from "../../../types";
import { UUIDSchema } from "../../../lib/validation/schemas";
import { securityLogger, errorLogger, performanceLogger } from "../../../lib/logger";
import { unsubscribeFromChannel } from "../../../lib/subscriptions.service";

/**
 * DELETE /api/subscriptions/:subscriptionId
 *
 * Unsubscribe the authenticated user from a channel.
 * This triggers automatic cleanup of the user's hidden summaries for that channel.
 *
 * Authentication: Required (Cookie session)
 * Path Parameters:
 * - subscriptionId (UUID) - ID of the subscription to delete
 *
 * Response (200 OK):
 * {
 *   message: "Successfully unsubscribed from channel"
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid subscription ID format
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 403 Forbidden: Attempting to delete another user's subscription
 * - 404 Not Found: Subscription not found
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
      securityLogger.auth("Unauthorized unsubscribe attempt - no valid session");
      securityLogger.apiAccess({
        method: "DELETE",
        path: `/api/subscriptions/${params.subscriptionId}`,
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("DELETE", `/api/subscriptions/${params.subscriptionId}`, duration, 401);

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

    // Extract and validate subscription ID from path
    const subscriptionId = params.subscriptionId;
    if (!subscriptionId) {
      const duration = performance.now() - startTime;

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "DELETE",
        path: `/api/subscriptions/${params.subscriptionId}`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("DELETE", `/api/subscriptions/${params.subscriptionId}`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Subscription ID is required",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = UUIDSchema.safeParse(subscriptionId);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Path parameter validation failed"), undefined, undefined, {
        endpoint: `/api/subscriptions/${params.subscriptionId}`,
        method: "DELETE",
      });

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "DELETE",
        path: `/api/subscriptions/${params.subscriptionId}`,
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("DELETE", `/api/subscriptions/${params.subscriptionId}`, duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid subscription ID format",
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unsubscribe from channel
    await unsubscribeFromChannel(supabase, userId, subscriptionId);

    // Log successful unsubscription
    securityLogger.auth("Channel unsubscription successful", {
      user_id: userId,
      subscription_id: subscriptionId,
    });

    // Format successful response
    const successResponse: ApiSuccess<void> = {
      message: "Successfully unsubscribed from channel",
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "DELETE",
      path: `/api/subscriptions/${params.subscriptionId}`,
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("DELETE", `/api/subscriptions/${params.subscriptionId}`, duration, 200);

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
      endpoint: `/api/subscriptions/${params.subscriptionId}`,
      method: "DELETE",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "DELETE",
      path: `/api/subscriptions/${params.subscriptionId}`,
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("DELETE", `/api/subscriptions/${params.subscriptionId}`, duration, 500);

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
