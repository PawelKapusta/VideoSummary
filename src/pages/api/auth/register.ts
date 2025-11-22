import type { APIRoute } from 'astro';
import type { RegisterRequest, AuthResponse, ApiError } from '../../../types';
import { RegisterRequestSchema } from '../../../lib/validation/schemas';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';

/**
 * POST /api/auth/register
 *
 * Creates a new user account with email and password authentication.
 * Upon successful registration, automatically creates a user profile via database trigger
 * and returns session tokens for immediate authentication.
 *
 * Request Body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response (201 Created):
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
 * - 400 Bad Request: Invalid email format or password doesn't meet requirements
 * - 409 Conflict: Email already registered
 * - 422 Unprocessable Entity: Validation errors from Zod schema
 * - 500 Internal Server Error: Database or Supabase Auth service error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();
  
  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Parse request body
    const body = await request.json();

    // Validate request body using Zod schema
    const validationResult = RegisterRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(
        new Error('Request validation failed'),
        undefined,
        undefined,
        { endpoint: '/api/auth/register', method: 'POST' }
      );

      // Log API access and performance for validation error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/register',
        statusCode: 422,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 422);

      const errorResponse: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: validationResult.error.format(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, password }: RegisterRequest = validationResult.data;

    // Call Supabase Auth signUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Auto-confirm email for development (in production, this should be false)
        // Note: This setting is configured in Supabase dashboard
      },
    });

    if (error) {
      // Handle Supabase Auth errors
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        const duration = performance.now() - startTime;

        // Log API access and performance for duplicate email error
        securityLogger.apiAccess({
          method: 'POST',
          path: '/api/auth/register',
          statusCode: 409,
        });
        performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 409);

        const errorResponse: ApiError = {
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'An account with this email already exists',
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (error.message.includes('Password should be at least')) {
        const duration = performance.now() - startTime;

        // Log API access and performance for password validation error
        securityLogger.apiAccess({
          method: 'POST',
          path: '/api/auth/register',
          statusCode: 400,
        });
        performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 400);

        const errorResponse: ApiError = {
          error: {
            code: 'INVALID_INPUT',
            message: 'Password does not meet strength requirements',
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (error.message.includes('Invalid email')) {
        const duration = performance.now() - startTime;

        // Log API access and performance for email validation error
        securityLogger.apiAccess({
          method: 'POST',
          path: '/api/auth/register',
          statusCode: 400,
        });
        performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 400);

        const errorResponse: ApiError = {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid email format',
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Log authentication errors with structured data
      const duration = performance.now() - startTime;
      errorLogger.apiError(error, 'POST', '/api/auth/register');
      securityLogger.authFailure('User registration failed', {
        error_type: 'supabase_auth_error',
        supabase_status: error.status,
      });

      // Log API access and performance for internal error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/register',
        statusCode: 500,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 500);

      const errorResponse: ApiError = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user account',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user was created successfully
    if (!data.user) {
      const duration = performance.now() - startTime;
      errorLogger.apiError(
        new Error('Supabase auth signUp returned no user data'),
        'POST',
        '/api/auth/register'
      );
      securityLogger.authFailure('User registration failed: no user data returned');

      // Log API access and performance for no user data error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/register',
        statusCode: 500,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 500);

      const errorResponse: ApiError = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'User account creation failed',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if session was created (depends on email confirmation settings)
    if (!data.session) {
      const duration = performance.now() - startTime;
      securityLogger.authFailure('User registration succeeded but no session created', {
        user_id: data.user.id,
        reason: 'email_confirmation_required',
      });

      // Log API access and performance for session creation error
      securityLogger.apiAccess({
        method: 'POST',
        path: '/api/auth/register',
        statusCode: 500,
      });
      performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 500);

      const errorResponse: ApiError = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Account created but authentication failed. Please check your email for confirmation instructions.',
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log successful registration
    securityLogger.auth('User registration successful', {
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
      method: 'POST',
      path: '/api/auth/register',
      statusCode: 201,
    });
    performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 201);

    return new Response(JSON.stringify(authResponse), {
      status: 201,
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
      endpoint: '/api/auth/register',
      method: 'POST',
    });

    // Log API access and performance for error response
    securityLogger.apiAccess({
      method: 'POST',
      path: '/api/auth/register',
      statusCode: 500,
    });
    performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 500);

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
