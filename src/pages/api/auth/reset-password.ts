import type { APIRoute } from 'astro';
import type { ResetPasswordRequest, ApiSuccess, ApiError } from '../../../types';
import { ResetPasswordRequestSchema } from '../../../lib/validation/schemas';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';

/**
 * POST /api/auth/reset-password
 *
 * Initiates the password reset process by sending an email with a time-limited,
 * single-use reset link to the user. Always returns success to prevent account enumeration.
 *
 * Request Body:
 * {
 *   email: string
 * }
 *
 * Response (200 OK):
 * {
 *   message: "Password reset email sent"
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid email format
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: Email service error or Supabase Auth service error
 *
 * Security Note: Always returns 200 OK even if email doesn't exist to prevent account enumeration
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();
  
  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Parse request body
    const body = await request.json();

    // Validate request body using Zod schema
    const validationResult = ResetPasswordRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Request validation failed'),
        undefined,
        undefined,
        { endpoint: '/api/auth/reset-password', method: 'POST' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/reset-password',
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/reset-password', duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid email format',
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email }: ResetPasswordRequest = validationResult.data;

    // Determine redirect URL for password reset page
    // In production, this should be the actual frontend URL
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/reset-password/confirm`;

    // Call Supabase Auth resetPasswordForEmail
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // Log the request for security monitoring (email is sensitive, not logged)
    securityLogger.auth('Password reset requested');

    // Handle Supabase Auth errors
    if (error) {
      // Check for rate limiting
      if (error.message.includes('rate limit') || error.message.includes('too many')) {
        const duration = performance.now() - startTime;
        
        securityLogger.authFailure('Password reset rate limit exceeded');

        // Log API access and performance for rate limit error
        securityLogger.apiAccess({
          method: 'POST',
          path: '/api/auth/reset-password',
          statusCode: 429,
        });
        performanceLogger.apiResponseTime('POST', '/api/auth/reset-password', duration, 429);

        const errorResponse: ApiError = {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many password reset requests. Please try again later.',
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '3600', // 1 hour in seconds
          },
        });
      }

      // Log error but still return success to prevent account enumeration
      errorLogger.apiError(error, 'POST', '/api/auth/reset-password');
      securityLogger.authFailure('Password reset email failed to send', {
        error_type: 'email_service_error',
      });

      // IMPORTANT: Still return 200 OK to prevent account enumeration
      // The user won't know if the email exists or not
    }

    // Format successful response (always return success for security)
    const successResponse: ApiSuccess<void> = {
      message: 'Password reset email sent',
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/auth/reset-password',
      statusCode: 200,
    });
    performanceLogger.apiResponseTime('POST', '/api/auth/reset-password', duration, 200);

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
      endpoint: '/api/auth/reset-password',
      method: 'POST',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/auth/reset-password',
      statusCode: 500,
    });
    performanceLogger.apiResponseTime('POST', '/api/auth/reset-password', duration, 500);

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

