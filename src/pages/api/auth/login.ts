import type { APIRoute } from "astro";
import type { LoginRequest, AuthResponse, ApiError } from "../../../types";
import { LoginRequestSchema } from "../../../lib/validation/schemas";
import { securityLogger, errorLogger, performanceLogger } from "../../../lib/logger";

/**
 * POST /api/auth/login
 *
 * Authenticates an existing user with email and password credentials
 * and returns session tokens for API access.
 *
 * Request Body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response (200 OK):
 * {
 *   user: {
 *     id: string,
 *     email: string,
 *     created_at: string
 *   },
 *   session: {
 *     access_token: string,
 *     refresh_token: string,
 *     expires_at: number
 *   }
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Missing email or password
 * - 401 Unauthorized: Invalid email or password combination
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: Supabase Auth service error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Parse request body
    const body = await request.json();

    // Validate request body using Zod schema
    const validationResult = LoginRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Request validation failed"), undefined, undefined, {
        endpoint: "/api/auth/login",
        method: "POST",
      });

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: "POST",
        path: "/api/auth/login",
        statusCode: 400,
      });
      performanceLogger.apiResponseTime("POST", "/api/auth/login", duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_INPUT",
          message: "Missing or invalid email or password",
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password }: LoginRequest = validationResult.data;

    // Call Supabase Auth signInWithPassword
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle Supabase Auth errors
      const duration = performance.now() - startTime;

      // Log failed login attempt (never log email or password for privacy)
      securityLogger.authFailure("User login failed", {
        error_type: "invalid_credentials",
        supabase_status: error.status,
      });

      // Check for rate limiting
      if (error.message.includes("rate limit") || error.message.includes("too many")) {
        securityLogger.apiAccess({
          method: "POST",
          path: "/api/auth/login",
          statusCode: 429,
        });
        performanceLogger.apiResponseTime("POST", "/api/auth/login", duration, 429);

        const errorResponse: ApiError = {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many login attempts. Please try again later.",
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "900", // 15 minutes in seconds
          },
        });
      }

      // Generic error for invalid credentials (prevents account enumeration)
      securityLogger.apiAccess({
        method: "POST",
        path: "/api/auth/login",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("POST", "/api/auth/login", duration, 401);

      const errorResponse: ApiError = {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user and session were returned
    if (!data.user || !data.session) {
      const duration = performance.now() - startTime;
      errorLogger.apiError(
        new Error("Supabase auth signInWithPassword returned no user or session data"),
        "POST",
        "/api/auth/login"
      );
      securityLogger.authFailure("User login failed: no user or session data returned");

      // Log API access and performance for internal error
      securityLogger.apiAccess({
        method: "POST",
        path: "/api/auth/login",
        statusCode: 500,
      });
      performanceLogger.apiResponseTime("POST", "/api/auth/login", duration, 500);

      const errorResponse: ApiError = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Authentication failed",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log successful login
    securityLogger.auth("User login successful", {
      user_id: data.user.id, // Safe to log - this is an internal UUID
    });

    // Format successful response according to AuthResponse type
    const authResponse: AuthResponse = {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: Math.floor(new Date(data.session.expires_at!).getTime() / 1000),
      },
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/auth/login",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("POST", "/api/auth/login", duration, 200);

    return new Response(JSON.stringify(authResponse), {
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
      endpoint: "/api/auth/login",
      method: "POST",
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: "POST",
      path: "/api/auth/login",
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("POST", "/api/auth/login", duration, 500);

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
