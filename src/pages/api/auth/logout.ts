import type { APIRoute } from 'astro';
import type { ApiSuccess, ApiError } from '../../../types';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';

/**
 * POST /api/auth/logout
 *
 * Terminates the current authenticated user session by invalidating the access token.
 * Requires a valid Bearer token in the Authorization header.
 *
 * Request Body: None
 *
 * Response (200 OK):
 * {
 *   message: "Successfully logged out"
 * }
 *
 * Error Responses:
 * - 401 Unauthorized: Missing or invalid Bearer token, or token expired
 * - 500 Internal Server Error: Supabase Auth service error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();
  
  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Verify authentication - get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      
      // Log authentication failure
      securityLogger.authFailure('Logout failed: invalid or missing token', {
        error_type: 'invalid_token',
      });

      // Log API access and performance for auth error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/logout',
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/logout', duration, 401);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Missing or invalid authentication token',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Supabase Auth signOut to invalidate the session
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Handle Supabase Auth errors
      const duration = performance.now() - startTime;
      errorLogger.apiError(error, 'POST', '/api/auth/logout');
      securityLogger.authFailure('User logout failed', {
        user_id: user.id,
        error_type: 'supabase_auth_error',
      });

      // Log API access and performance for internal error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/logout',
        statusCode: 500,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/logout', duration, 500);

      const errorResponse: ApiError = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to log out',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log successful logout
    securityLogger.auth('User logout successful', {
      user_id: user.id, // Safe to log - this is an internal UUID
    });

    // Format successful response
    const successResponse: ApiSuccess<void> = {
      message: 'Successfully logged out',
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/auth/logout',
      statusCode: 200,
    });
    performanceLogger.apiResponseTime('POST', '/api/auth/logout', duration, 200);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Add security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });

  } catch (error) {
    // Handle unexpected errors
    const duration = performance.now() - startTime;
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/auth/logout',
      method: 'POST',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/auth/logout',
      statusCode: 500,
    });
    performanceLogger.apiResponseTime('POST', '/api/auth/logout', duration, 500);

    const errorResponse: ApiError = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

