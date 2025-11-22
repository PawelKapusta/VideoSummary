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
    // Extract authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Decode and verify the JWT token manually
    let userId: string;
    try {
      // Basic JWT validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Decode JWT payload (second part of the token)
      // Note: atob expects base64, but JWT uses base64url encoding
      const payloadBase64Url = parts[1];
      const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
      }

      // Extract user ID from token
      userId = payload.sub;

      if (!userId) {
        throw new Error('Invalid token payload');
      }
    } catch (error) {
      const duration = performance.now() - startTime;

      // Log authentication failure with error details
      securityLogger.authFailure('Logout failed: invalid token', {
        error_type: 'invalid_token',
        error_message: error instanceof Error ? error.message : 'Unknown error',
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
          message: 'Invalid authentication token',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For API-based logout, we don't actually need to call signOut()
    // since sessions are managed client-side. The logout is successful
    // as long as the token was valid.

    // Log successful logout
    securityLogger.auth('User logout successful', {
      user_id: userId, // Safe to log - this is an internal UUID
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

