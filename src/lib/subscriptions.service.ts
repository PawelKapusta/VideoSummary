import { createHash } from 'crypto';
import type { SupabaseClient } from '../db/supabase.client';
import type { Database } from '../db/database.types';
import type { PaginatedResponse, SubscriptionWithChannel, ChannelInsert, SubscriptionInsert } from '../types';
import { extractYouTubeChannelId } from './youtube.utils';
import { fetchYouTubeChannelMetadata } from './youtube.service';

/**
 * List user's subscribed channels with pagination
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param limit - Number of items per page (default: 50, max: 100)
 * @param offset - Number of items to skip (default: 0)
 * @returns Paginated response with subscription data
 */
export async function listUserSubscriptions(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<SubscriptionWithChannel>> {
  // Query subscriptions with channel information and total count
  const { data: subscriptions, error: subscriptionsError, count } = await supabase
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
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (subscriptionsError) {
    throw subscriptionsError;
  }

  // Format subscriptions according to SubscriptionWithChannel type
  const data: SubscriptionWithChannel[] = (subscriptions || []).map(sub => ({
    subscription_id: sub.id,
    channel: {
      id: sub.channels.id,
      youtube_channel_id: sub.channels.youtube_channel_id,
      name: sub.channels.name,
      created_at: sub.channels.created_at,
    },
    subscribed_at: sub.created_at,
  }));

  // Return paginated response
  return {
    data,
    pagination: {
      total: count || 0,
      limit,
      offset,
    },
  };
}

/**
 * Subscribe user to a YouTube channel
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param channelUrl - YouTube channel URL
 * @returns SubscriptionWithChannel data
 */
export async function subscribeToChannel(
  supabase: SupabaseClient,
  userId: string,
  channelUrl: string
): Promise<SubscriptionWithChannel> {
  // Extract YouTube channel ID from URL
  const youtubeChannelId = extractYouTubeChannelId(channelUrl);

  // Check subscription limit (max 10 per user)
  const { count: subscriptionCount, error: countError } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw countError;
  }

  if (subscriptionCount && subscriptionCount >= 10) {
    throw new Error('SUBSCRIPTION_LIMIT_REACHED');
  }

  // Check if channel exists in database
  let channelId: string;
  const { data: existingChannel, error: channelError } = await supabase
    .from('channels')
    .select('id')
    .eq('youtube_channel_id', youtubeChannelId)
    .single();

  if (channelError && channelError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw channelError;
  }

  if (existingChannel) {
    channelId = existingChannel.id;
  } else {
    // Channel doesn't exist, fetch from YouTube API
    const channelMetadata = await fetchYouTubeChannelMetadata(youtubeChannelId);

    // Create channel record
    const channelInsert: ChannelInsert = {
      youtube_channel_id: channelMetadata.id,
      name: channelMetadata.title,
    };

    const { data: newChannel, error: insertError } = await supabase
      .from('channels')
      .insert(channelInsert)
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    channelId = newChannel.id;
  }

  // Check if user already subscribed to this channel
  const { data: existingSubscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('channel_id', channelId)
    .single();

  if (subscriptionError && subscriptionError.code !== 'PGRST116') {
    throw subscriptionError;
  }

  if (existingSubscription) {
    throw new Error('ALREADY_SUBSCRIBED');
  }

  // Create subscription using advisory lock to prevent race conditions
  // Hash channel ID to create a lock key
  const lockKey = hashStringToInt32(channelId);

  // Use RPC function for atomic operation with advisory lock
  const { data: subscription, error: subscribeError } = await supabase
    .rpc('subscribe_to_channel_atomic', {
      p_user_id: userId,
      p_channel_id: channelId,
      p_lock_key: lockKey,
    });

  if (subscribeError) {
    if (subscribeError.message.includes('SUBSCRIPTION_LIMIT_REACHED')) {
      throw new Error('SUBSCRIPTION_LIMIT_REACHED');
    }
    if (subscribeError.message.includes('ALREADY_SUBSCRIBED')) {
      throw new Error('ALREADY_SUBSCRIBED');
    }
    throw subscribeError;
  }

  // Cast the JSON result to proper type
  const subscriptionData = subscription as {
    id: string;
    created_at: string;
    channels: {
      id: string;
      youtube_channel_id: string;
      name: string;
      created_at: string;
    };
  };

  // Return formatted subscription data
  return {
    subscription_id: subscriptionData.id,
    channel: {
      id: channelId,
      youtube_channel_id: youtubeChannelId,
      name: subscriptionData.channels.name,
      created_at: subscriptionData.channels.created_at,
    },
    subscribed_at: subscriptionData.created_at,
  };
}

/**
 * Unsubscribe user from a channel
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param subscriptionId - Subscription ID to delete
 */
export async function unsubscribeFromChannel(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string
): Promise<void> {
  // Delete subscription (RLS policy ensures user can only delete their own)
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', subscriptionId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

/**
 * Generate 32-bit integer hash for advisory lock keys using crypto
 * @param str - String to hash
 * @returns 32-bit integer hash
 */
function hashStringToInt32(str: string): number {
  // Create SHA-256 hash of the string
  const hash = createHash('sha256').update(str).digest('hex');

  // Convert first 8 characters of hex to 32-bit integer
  // Take first 8 hex chars (32 bits) and convert to number
  const int32Hash = parseInt(hash.substring(0, 8), 16);

  // Ensure positive number (advisory locks work with positive integers)
  return Math.abs(int32Hash);
}
