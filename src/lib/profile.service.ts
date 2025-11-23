import type { SupabaseClient } from '../db/supabase.client';
import type { Database } from '../db/database.types';
import type { UserProfile } from '../types';
import { errorLogger } from './logger';

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
  // Query profile from profiles table (which has the same ID as auth.users)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, created_at')
    .eq('id', userId)
    .single();

  let userCreatedAt: string;
  let userEmail: string;

  // If profile doesn't exist, create it (fallback for when trigger doesn't work)
  if (profileError || !profileData) {
    // Get user info to create profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not found');
    }

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({ id: userId, created_at: user.created_at })
      .select('id, created_at')
      .single();

    if (createError || !newProfile) {
      throw new Error('User not found');
    }

    userCreatedAt = newProfile.created_at;
    userEmail = user.email!;
  } else {
    // Profile exists, get user email
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not found');
    }

    userCreatedAt = profileData.created_at;
    userEmail = user.email!;
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
