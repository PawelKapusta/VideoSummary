import type { SupabaseClient } from '../db/supabase.client';
import type { Database } from '../db/database.types';
import type { UserProfile } from '../types';

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
  // Query user basic information from auth.users
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !userData.user) {
    throw new Error('User not found');
  }

  // Query subscriptions with channel information
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
    throw subscriptionsError;
  }

  // Format subscriptions according to SubscriptionWithChannel type
  const subscribedChannels = (subscriptions || []).map((sub: any) => ({
    subscription_id: sub.id,
    channel: {
      id: sub.channels.id,
      youtube_channel_id: sub.channels.youtube_channel_id,
      name: sub.channels.name,
      created_at: sub.channels.created_at,
    },
    subscribed_at: sub.created_at,
  }));

  // Return formatted profile
  return {
    id: userData.user.id,
    email: userData.user.email!,
    created_at: userData.user.created_at,
    subscribed_channels: subscribedChannels,
    subscription_count: subscribedChannels.length,
  };
}
