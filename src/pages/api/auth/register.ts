import type { APIRoute } from 'astro';
import { RegisterRequestSchema } from '../../../lib/validation/schemas';
import type { RegisterRequest, AuthResponse, ApiError } from '../../../types';
import { z } from 'zod';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';

/**
 * POST /api/auth/register
 *
 * Creates a new user account with email and password authentication.
 * Upon successful registration, automatically creates a user profile 
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
          details: validationResult.error.errors.reduce((acc, err) => {
            const path = err.path.join('.');
            acc[path] = err.message;
            return acc;
          }, {} as Record<string, string>),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, password }: RegisterRequest = validationResult.data;

    // Call Supabase Auth signUp first (handles uniqueness on auth.users)
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { email }, // Metadata for profile sync
      },
    });

    if (authError) {
      // Map Supabase Auth errors to custom codes
      const duration = performance.now() - startTime;
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        securityLogger.apiAccess({
          method: 'POST',
          path: '/api/auth/register',
          statusCode: 409,
        });
        performanceLogger.apiResponseTime('POST', '/api/auth/register', duration, 409);

        const errorResponse: ApiError = {
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'An account with this email already exists. Please login.',
            details: {}, // No field-specific details for duplicate
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (authError.message.includes('Password should be at least') || authError.message.includes('weak')) {
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
            details: { password: authError.message },
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (authError.message.includes('Invalid email') || authError.message.includes('login')) {
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
            details: { email: authError.message },
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Log and return generic error for other auth issues
      errorLogger.apiError(authError, 'POST', '/api/auth/register');
      securityLogger.authFailure('User registration failed', {
        error_type: 'supabase_auth_error',
        supabase_status: authError.status,
      });
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
          details: { /* No sensitive details */ },
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
      securityLogger.auth('User registration successful (confirmation required)', {
        user_id: data.user.id,
      });
      
      const authResponse: AuthResponse = {
        user: {
          id: data.user.id,
          email: data.user.email!,
          created_at: data.user.created_at!,
        },
      };

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
          'X-Registration-Status': 'confirmation_required'
        },
      });
    }

    // Create profile row explicitly after auth success (RLS allows insert for new auth users: auth.uid() = id)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at!,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Log but don't fail response (auth succeeded; profile can be created on login if needed)
      securityLogger.authFailure('Profile creation failed after registration', {
        user_id: data.user.id,
        error: profileError.message,
      });
      // Optional: Trigger a function to retry profile creation
    }

    // Log successful registration
    securityLogger.auth('User registration successful', {
      user_id: data.user.id, // Safe to log - internal UUID
    });

    // Format successful response according to AuthResponse type
    const authResponse: AuthResponse = {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at!,
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
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });

  } catch (error) {
    // Handle unexpected errors (e.g., JSON parse, network)
    const duration = performance.now() - startTime;
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/auth/register',
      method: 'POST',
    });

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
        details: {},
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
