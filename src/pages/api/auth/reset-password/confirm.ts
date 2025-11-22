import type { APIRoute } from 'astro';
import type { ConfirmResetPasswordRequest, ApiSuccess, ApiError } from '@/types';
import { ConfirmResetPasswordRequestSchema } from '@/lib/validation/schemas';
import { securityLogger, errorLogger, performanceLogger } from '@/lib/logger';

/**
 * POST /api/auth/reset-password/confirm
 *
 * Completes the password reset process by verifying the reset token from email
 * and updating the user's password. The token is automatically invalidated after use.
 *
 * Request Body:
 * {
 *   token: string,
 *   password: string
 * }
 *
 * Response (200 OK):
 * {
 *   message: "Password successfully reset"
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid token, weak password, or missing fields
 * - 422 Unprocessable Entity: Password validation errors
 * - 500 Internal Server Error: Database error or Supabase Auth service error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Parse request body
    const body = await request.json();

    // Validate request body using Zod schema
    const validationResult = ConfirmResetPasswordRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Request validation failed'),
        undefined,
        undefined,
        { endpoint: '/api/auth/reset-password/confirm', method: 'POST' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/reset-password/confirm',
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/reset-password/confirm', duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid token or password format',
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { token, password }: ConfirmResetPasswordRequest = validationResult.data;

    // Call Supabase Auth verifyOtp to validate the reset token
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (otpError) {
      // Handle OTP verification errors
      const duration = performance.now() - startTime;
      errorLogger.apiError(otpError, 'POST', '/api/auth/reset-password/confirm');

      // Log password reset failure
      securityLogger.authFailure('Password reset token verification failed', {
        error_type: 'invalid_token',
      });

      // Log API access and performance for token error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/reset-password/confirm',
        statusCode: 400,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/reset-password/confirm', duration, 400);

      const errorResponse: ApiError = {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user was found (should be available after successful OTP verification)
    if (!otpData.user) {
      const duration = performance.now() - startTime;
      errorLogger.apiError(
        new Error('Supabase verifyOtp succeeded but no user returned'),
        'POST',
        '/api/auth/reset-password/confirm'
      );
      securityLogger.authFailure('Password reset failed: no user returned after token verification');

      // Log API access and performance for internal error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/reset-password/confirm',
        statusCode: 500,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/reset-password/confirm', duration, 500);

      const errorResponse: ApiError = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Password reset failed',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      // Handle password update errors
      const duration = performance.now() - startTime;
      errorLogger.apiError(updateError, 'POST', '/api/auth/reset-password/confirm');
      securityLogger.authFailure('Password reset failed: password update error', {
        error_type: 'password_update_failed',
      });

      // Log API access and performance for password update error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/reset-password/confirm',
        statusCode: 422,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/reset-password/confirm', duration, 422);

      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password update failed',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log successful password reset
    securityLogger.auth('Password reset successful', {
      user_id: otpData.user.id, // Safe to log - this is an internal UUID
    });

    // Format successful response
    const successResponse: ApiSuccess<void> = {
      message: 'Password successfully reset',
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/auth/reset-password/confirm',
      statusCode: 200,
    });
    performanceLogger.apiResponseTime('POST', '/api/auth/reset-password/confirm', duration, 200);

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
      endpoint: '/api/auth/reset-password/confirm',
      method: 'POST',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/auth/reset-password/confirm',
      statusCode: 500,
    });
    performanceLogger.apiResponseTime('POST', '/api/auth/reset-password/confirm', duration, 500);

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
