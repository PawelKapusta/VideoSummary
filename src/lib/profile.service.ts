import type { SupabaseClient } from '../db/supabase.client';
import type { Database } from '../db/database.types';
import type { UserProfile } from '../types';
import { errorLogger } from './logger';
import { DEFAULT_USER_ID } from '../db/supabase.client';

/**
 * Get user profile with subscription information
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns UserProfile with subscribed channels and count
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile> {
  // For testing: if using DEFAULT_USER_ID, return mock user data

  let userEmail: string;
  let userCreatedAt: string;

  if (userId === DEFAULT_USER_ID) {
    // Mock data for testing
    userEmail = 'test@example.com';
    userCreatedAt = new Date().toISOString();
  } else {
    // Query user basic information from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      throw new Error('User not found');
    }

    userEmail = userData.user.email!;
    userCreatedAt = userData.user.created_at;
  }

  // Query subscriptions with channel information
  let subscribedChannels: any[] = [];

  try {
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        created_at,
        channels (
          id,
          youtube_channel_id,
          name,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      // Log error but continue with empty subscriptions
      errorLogger.appError(subscriptionsError, {
        service: 'profile_service',
        operation: 'get_user_subscriptions',
        user_id: userId,
      });
      // Don't throw - return profile with empty subscriptions
    } else {
      // Format subscriptions according to SubscriptionWithChannel type
      subscribedChannels = (subscriptions || []).map((sub: any) => ({
        subscription_id: sub.id,
        channel: {
          id: sub.channels.id,
          youtube_channel_id: sub.channels.youtube_channel_id,
          name: sub.channels.name,
          created_at: sub.channels.created_at,
        },
        subscribed_at: sub.created_at,
      }));
    }
  } catch (dbError) {
    // Log database connection errors but continue
    errorLogger.appError(dbError instanceof Error ? dbError : new Error(String(dbError)), {
      service: 'profile_service',
      operation: 'database_query',
      user_id: userId,
    });
    // Continue with empty subscriptions
  }

  // Return formatted profile
  return {
    id: userId,
    email: userEmail,
    created_at: userCreatedAt,
    subscribed_channels: subscribedChannels,
    subscription_count: subscribedChannels.length,
  };
}
