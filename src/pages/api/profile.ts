import type { APIRoute } from 'astro';
import type { UserProfile, ApiError } from '../../types';
import { securityLogger, errorLogger, performanceLogger } from '../../lib/logger';
import { getUserProfile } from '../../lib/profile.service';

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
export const GET: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Get user from session (cookie-based)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth('Unauthorized profile access attempt - no valid session');
      securityLogger.apiAccess({
        method: 'GET',
        path: '/api/profile',
        statusCode: 401,
      });
      performanceLogger.apiResponseTime('GET', '/api/profile', duration, 401);

      const errorResponse: ApiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Get user profile with subscription data
    const profile: UserProfile = await getUserProfile(supabase, userId);

    // Log successful profile access
    securityLogger.auth('Profile accessed successfully', {
      user_id: userId, // Safe to log - this is an internal UUID
    });

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'GET',
      path: '/api/profile',
      statusCode: 200,
    });
    performanceLogger.apiResponseTime('GET', '/api/profile', duration, 200);

    return new Response(JSON.stringify(profile), {
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
      endpoint: '/api/profile',
      method: 'GET',
    });

    // Determine appropriate error response based on error type
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';

    if (error instanceof Error && error.message === 'User not found') {
      statusCode = 404;
      errorCode = 'RESOURCE_NOT_FOUND';
      message = 'User profile not found';
    }

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'GET',
      path: '/api/profile',
      statusCode,
    });
    performanceLogger.apiResponseTime('GET', '/api/profile', duration, statusCode);

    const errorResponse: ApiError = {
      error: {
        code: errorCode,
        message,
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
