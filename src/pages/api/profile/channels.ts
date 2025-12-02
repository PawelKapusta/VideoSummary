import type { APIRoute } from 'astro';
import type { Channel, ApiError } from '../../../types';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';
import { getUserProfile } from '../../../lib/profile.service';

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
      return new Response(JSON.stringify(errorResponse), { status: 401 });
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
    return new Response(JSON.stringify(errorResponse), { status: 500 });
  }
};
