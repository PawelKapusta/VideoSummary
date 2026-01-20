import type { APIRoute } from "astro";
import type { SubscriptionWithChannel, ApiSuccess, ApiError, PaginatedResponse } from "../../../types";
import { SubscribeRequestSchema, PaginationSchema } from "../../../lib/validation/schemas";
import { securityLogger, errorLogger, performanceLogger } from "../../../lib/logger";
import { subscribeToChannel, listUserSubscriptions } from "../../../lib/subscriptions.service";
import type { RuntimeEnv } from "../../../lib/env";

/**
 * POST /api/subscriptions
 *
 * Subscribe the authenticated user to a YouTube channel.
 * If the channel doesn't exist in the database, it fetches metadata from YouTube API and creates a new channel record.
 *
 * Authentication: Required (Cookie session)
 * Request Body:
 * {
 *   channel_url: string // YouTube channel URL
 * }
 *
 * Response (201 Created):
 * {
 *   subscription_id: string,
 *   channel: Channel,
 *   subscribed_at: string,
 *   message: "Successfully subscribed to channel"
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid YouTube channel URL
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 404 Not Found: YouTube channel not found
 * - 409 Conflict: User already subscribed to this channel
 * - 422 Unprocessable Entity: Subscription limit reached (10 channels max)
 * - 500 Internal Server Error: YouTube API error or database error
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
      securityLogger.auth("Unauthorized subscription attempt - no valid session");
      securityLogger.apiAccess({
        method: "POST",
        path: "/api/subscriptions",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("POST", "/api/subscriptions", duration, 401);

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

    // Parse request body
    const body = await request.json();

    // Validate request body using Zod schema
    const validationResult = SubscribeRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Request validation failed"), undefined, undefined, {
        endpoint: "/api/subscriptions",
        method: "POST",
      });

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "POST",
        path: "/api/subscriptions",
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("POST", "/api/subscriptions", duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_URL",
          message: "Invalid YouTube channel URL format",
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { channel_url }: { channel_url: string } = validationResult.data;

    // Subscribe to channel
    const runtimeEnv = locals.runtime?.env as RuntimeEnv;
    const subscriptionData: SubscriptionWithChannel = await subscribeToChannel(
      supabase,
      userId,
      channel_url,
      runtimeEnv
    );

    // Log successful subscription
    securityLogger.auth("Channel subscription successful", {
      user_id: userId,
      channel_id: subscriptionData.channel.id,
      subscription_id: subscriptionData.subscription_id,
    });

    // Format successful response
    const successResponse: ApiSuccess<SubscriptionWithChannel> = {
      data: subscriptionData,
      message: "Successfully subscribed to channel",
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/subscriptions",
      statusCode: 201,
    });
    performanceLogger.apiResponseTime("POST", "/api/subscriptions", duration, 201);

    return new Response(JSON.stringify(successResponse), {
      status: 201,
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
      if (error.message === "SUBSCRIPTION_LIMIT_REACHED") {
        statusCode = 422;
        errorCode = "SUBSCRIPTION_LIMIT_REACHED";
        message = "Maximum subscription limit reached (10 channels)";
      } else if (error.message === "ALREADY_SUBSCRIBED") {
        statusCode = 409;
        errorCode = "ALREADY_SUBSCRIBED";
        message = "Already subscribed to this channel";
      } else if (error.message.includes("YouTube channel not found")) {
        statusCode = 404;
        errorCode = "CHANNEL_NOT_FOUND";
        message = "YouTube channel not found";
      } else if (error.message.includes("YouTube API")) {
        statusCode = 500;
        errorCode = "YOUTUBE_API_ERROR";
        message = "YouTube API service error";
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: "/api/subscriptions",
      method: "POST",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/subscriptions",
      statusCode,
    });
    performanceLogger.apiResponseTime("POST", "/api/subscriptions", duration, statusCode);

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

/**
 * GET /api/subscriptions
 *
 * Retrieves all YouTube channels that the authenticated user is subscribed to,
 * with pagination support.
 *
 * Authentication: Required (Cookie session)
 * Query Parameters:
 * - limit (number, default: 50, max: 100)
 * - offset (number, default: 0, min: 0)
 *
 * Response (200 OK):
 * {
 *   data: SubscriptionWithChannel[],
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth("Unauthorized subscriptions list attempt - no valid session");
      securityLogger.apiAccess({
        method: "GET",
        path: "/api/subscriptions",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("GET", "/api/subscriptions", duration, 401);

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

    const validationResult = PaginationSchema.safeParse({
      limit: rawLimit,
      offset: rawOffset,
    });

    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Query parameter validation failed"), undefined, undefined, {
        endpoint: "/api/subscriptions",
        method: "GET",
      });

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "GET",
        path: "/api/subscriptions",
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("GET", "/api/subscriptions", duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid limit or offset value",
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { limit, offset } = validationResult.data;

    // Get paginated subscriptions
    const result: PaginatedResponse<SubscriptionWithChannel> = await listUserSubscriptions(
      supabase,
      userId,
      limit,
      offset
    );

    // Log successful subscriptions access
    securityLogger.auth("Subscriptions list accessed successfully", {
      user_id: userId,
      subscription_count: result.pagination.total,
    });

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "GET",
      path: "/api/subscriptions",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("GET", "/api/subscriptions", duration, 200);

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
      endpoint: "/api/subscriptions",
      method: "GET",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "GET",
      path: "/api/subscriptions",
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("GET", "/api/subscriptions", duration, 500);

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
