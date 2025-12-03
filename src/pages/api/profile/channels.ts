import type { APIRoute } from 'astro';
import type { Channel, ApiError, SubscribeRequest, SubscriptionWithChannel } from '../../../types';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';
import { getUserProfile } from '../../../lib/profile.service';
import { SubscribeRequestSchema } from '../../../lib/validation/schemas';
import { subscribeToChannel } from '../../../lib/subscriptions.service';

/**
 * GET /api/profile/channels
 *
 * Retrieves a simple list of channels the user is subscribed to.
 * Used for dropdowns and filters.
 *
 * Authentication: Required (Cookie session)
 *
 * Response (200 OK):
 * Channel[]
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();
  const supabase = locals.supabase;

  try {
    // Get user from session (cookie-based)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ApiError = {
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      };
      return new Response(JSON.stringify(errorResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const userId = user.id;

    // Get user profile which includes subscriptions
    const profile = await getUserProfile(supabase, userId);
    
    // Extract just the channel information from subscriptions
    const channels: Channel[] = profile.subscribed_channels.map(sub => sub.channel);

    // Log API access and performance
    const duration = performance.now() - startTime;
    performanceLogger.apiResponseTime('GET', '/api/profile/channels', duration, 200);

    return new Response(JSON.stringify(channels), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: '/api/profile/channels',
      method: 'GET',
    });

    const errorResponse: ApiError = {
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
    return new Response(JSON.stringify(errorResponse), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};


/**
 * POST /api/profile/channels
 *
 * Subscribes the authenticated user to a new YouTube channel.
 *
 * Authentication: Required (Cookie session)
 * Request Body: { channel_url: string }
 *
 * Response (201 Created):
 * SubscriptionWithChannel
 *
 * Error Responses:
 * - 400 Bad Request: Invalid input
 * - 401 Unauthorized: Missing or invalid session
 * - 403 Forbidden: Subscription limit reached
 * - 409 Conflict: Already subscribed
 * - 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals }) => {
    const startTime = performance.now();
    const supabase = locals.supabase;
  
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
  
      if (authError || !user) {
        return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }), { status: 401 });
      }
  
      const body: SubscribeRequest = await request.json();
      const validation = SubscribeRequestSchema.safeParse(body);
  
      if (!validation.success) {
        return new Response(JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid channel URL', details: validation.error.flatten() } }), { status: 400 });
      }
  
      const { channel_url } = validation.data;
  
      const newSubscription = await subscribeToChannel(supabase, user.id, channel_url);
  
      const duration = performance.now() - startTime;
      performanceLogger.apiResponseTime('POST', '/api/profile/channels', duration, 201);
  
      return new Response(JSON.stringify(newSubscription), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
  
    } catch (error) {
      const err = error as Error;
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
  
      if (err.message.includes('limit')) {
        statusCode = 403;
        errorCode = 'LIMIT_REACHED';
      } else if (err.message.includes('already subscribed')) {
        statusCode = 409;
        errorCode = 'CONFLICT';
      }
  
      errorLogger.appError(err, { endpoint: '/api/profile/channels', method: 'POST' });
  
      return new Response(JSON.stringify({ error: { code: errorCode, message: err.message } }), { status: statusCode });
    }
  };
