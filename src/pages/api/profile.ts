import type { APIRoute } from "astro";
import type { UserProfile, ApiError, ApiSuccess } from "../../types";
import { securityLogger, errorLogger, performanceLogger } from "../../lib/logger";
import { getUserProfile, updateUserProfile } from "../../lib/profile.service";
import { UpdateProfileRequestSchema } from "../../lib/validation/schemas";

// export const prerender = false;
/**
 * GET /api/profile
 *
 * Retrieves the authenticated user's profile information including their
 * subscribed channels and subscription count.
 *
 * Authentication: Required (Cookie session)
 * Request Body: None
 *
 * Response (200 OK):
 * {
 *   id: string,
 *   email: string,
 *   created_at: string,
 *   subscribed_channels: SubscriptionWithChannel[],
 *   subscription_count: number
 * }
 *
 * Error Responses:
 * - 401 Unauthorized: Missing or invalid session
 * - 404 Not Found: User profile not found
 * - 500 Internal Server Error: Database connection error
 */
export const GET: APIRoute = async ({ locals }) => {
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
      securityLogger.auth("Unauthorized profile access attempt - no valid session");
      securityLogger.apiAccess({
        method: "GET",
        path: "/api/profile",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("GET", "/api/profile", duration, 401);

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

    // Get user profile with subscription data
    const profile: UserProfile = await getUserProfile(supabase, userId);

    // Log successful profile access
    securityLogger.auth("Profile accessed successfully", {
      user_id: userId, // Safe to log - this is an internal UUID
    });

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "GET",
      path: "/api/profile",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("GET", "/api/profile", duration, 200);

    return new Response(JSON.stringify(profile), {
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
      endpoint: "/api/profile",
      method: "GET",
    });

    // Determine appropriate error response based on error type
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";

    if (error instanceof Error && error.message === "User not found") {
      statusCode = 404;
      errorCode = "RESOURCE_NOT_FOUND";
      message = "User profile not found";
    }

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "GET",
      path: "/api/profile",
      statusCode,
    });
    performanceLogger.apiResponseTime("GET", "/api/profile", duration, statusCode);

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
 * PUT /api/profile
 *
 * Updates the authenticated user's profile information.
 * Currently supports updating username.
 *
 * Authentication: Required (Cookie session)
 * Request Body:
 * {
 *   username?: string // 3-30 characters, alphanumeric + underscore/dash only
 * }
 *
 * Response (200 OK):
 * {
 *   data: UserProfile,
 *   message: "Profile updated successfully"
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Missing or invalid session
 * - 409 Conflict: Username already taken
 * - 500 Internal Server Error: Database error
 */
export const PUT: APIRoute = async ({ request, locals }) => {
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
      securityLogger.auth("Unauthorized profile update attempt - no valid session");
      securityLogger.apiAccess({
        method: "PUT",
        path: "/api/profile",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("PUT", "/api/profile", duration, 401);

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

    // Parse and validate request body
    const body = await request.json();

    const validationResult = UpdateProfileRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Profile update validation failed"), undefined, undefined, {
        endpoint: "/api/profile",
        method: "PUT",
      });

      securityLogger.apiAccess({
        method: "PUT",
        path: "/api/profile",
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("PUT", "/api/profile", duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Invalid profile data",
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updates = validationResult.data;

    // Check if username is already taken (if provided)
    if (updates.username) {
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", updates.username)
        .neq("id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingUser) {
        const duration = performance.now() - startTime;
        securityLogger.apiAccess({
          method: "PUT",
          path: "/api/profile",
          statusCode: 409,
        });
        performanceLogger.apiResponseTime("PUT", "/api/profile", duration, 409);

        const errorResponse: ApiError = {
          error: {
            code: "USERNAME_TAKEN",
            message: "Username is already taken",
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Update profile
    const updatedProfile: UserProfile = await updateUserProfile(supabase, userId, updates);

    // Log successful profile update
    securityLogger.auth("Profile updated successfully", {
      user_id: userId,
      updates: Object.keys(updates),
    });

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "PUT",
      path: "/api/profile",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("PUT", "/api/profile", duration, 200);

    const successResponse: ApiSuccess<UserProfile> = {
      data: updatedProfile,
      message: "Profile updated successfully",
    };

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
      if (error.message.includes("duplicate key value") || error.message.includes("profiles_username_unique")) {
        statusCode = 409;
        errorCode = "USERNAME_TAKEN";
        message = "Username is already taken";
      } else if (error.message.includes("check constraint") || error.message.includes("profiles_username_length")) {
        statusCode = 400;
        errorCode = "INVALID_INPUT";
        message = "Username must be 3-30 characters long";
      } else if (error.message.includes("profiles_username_format")) {
        statusCode = 400;
        errorCode = "INVALID_INPUT";
        message = "Username can only contain letters, numbers, underscores, and dashes";
      }
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: "/api/profile",
      method: "PUT",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "PUT",
      path: "/api/profile",
      statusCode,
    });
    performanceLogger.apiResponseTime("PUT", "/api/profile", duration, statusCode);

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
