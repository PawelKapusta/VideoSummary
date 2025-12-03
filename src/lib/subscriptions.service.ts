import { createHash } from 'crypto';
import type { SupabaseClient } from '../db/supabase.client';
import { errorLogger, appLogger, dbLogger, externalLogger } from './logger';
import type { PaginatedResponse, SubscriptionWithChannel, ChannelInsert, SubscriptionInsert, AtomicSubscriptionResult } from '../types';
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
  appLogger.debug('subscribeToChannel called', { userId, channelUrl });

  // Extract YouTube channel ID or handle from URL
  const youtubeChannelIdOrHandle = extractYouTubeChannelId(channelUrl);
  appLogger.debug('Extracted YouTube identifier', { youtubeChannelIdOrHandle });

  // Check subscription limit (max 10 per user)
  appLogger.debug('Checking subscription count', { userId });
  const { count: subscriptionCount, error: countError } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    dbLogger.error('Subscription count query failed', {
      error: countError.message,
      user_id: userId,
      channel_url: channelUrl,
    });
    throw countError;
  }

  if (subscriptionCount && subscriptionCount >= 10) {
    throw new Error('SUBSCRIPTION_LIMIT_REACHED');
  }

  // Fetch channel metadata from YouTube API (handles both ID and handle)
  appLogger.debug('Fetching YouTube channel metadata', { youtubeChannelIdOrHandle });
  let channelMetadata;
  try {
    channelMetadata = await fetchYouTubeChannelMetadata(youtubeChannelIdOrHandle);
  } catch (youtubeError) {
    externalLogger.error('YouTube API call failed', {
      error: youtubeError instanceof Error ? youtubeError.message : String(youtubeError),
      youtube_channel_id_or_handle: youtubeChannelIdOrHandle,
      user_id: userId,
    });
    throw youtubeError;
  }

  // Now we have the actual YouTube channel ID from the API response
  const youtubeChannelId = channelMetadata.id;

  // Check if channel exists in database
  let channelId: string;
  const { data: existingChannel, error: channelError } = await supabase
    .from('channels')
    .select('id')
    .eq('youtube_channel_id', youtubeChannelId)
    .single();

  if (channelError && channelError.code !== 'PGRST116') { // PGRST116 = no rows returned
    dbLogger.error('Channel lookup failed', {
      error: channelError.message,
      youtube_channel_id: youtubeChannelId,
      user_id: userId,
    });
    throw channelError;
  }

  if (existingChannel) {
    channelId = existingChannel.id;
  } else {
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
      dbLogger.error('Channel creation failed', {
        error: insertError.message,
        youtube_channel_id: youtubeChannelId,
        channel_name: channelMetadata.title,
        user_id: userId,
      });
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
    dbLogger.error('Subscription check failed', {
      error: subscriptionError.message,
      user_id: userId,
      channel_id: channelId,
    });
    throw subscriptionError;
  }

  if (existingSubscription) {
    throw new Error('ALREADY_SUBSCRIBED');
  }

  // Create subscription using advisory lock to prevent race conditions
  // Hash channel ID to create a lock key
  const lockKey = hashStringToInt32(channelId);

  // Use RPC function for atomic operation with advisory lock
  let subscription: any;
  try {
    const result = await supabase
      .rpc('subscribe_to_channel_atomic', {
        p_user_id: userId,
        p_channel_id: channelId,
        p_lock_key: lockKey,
      });

    subscription = result.data;
    const subscribeError = result.error;

    if (subscribeError) {
      dbLogger.error('Atomic subscription failed', {
        error: subscribeError.message,
        user_id: userId,
        channel_id: channelId,
        lock_key: lockKey,
      });

      if (subscribeError.message.includes('SUBSCRIPTION_LIMIT_REACHED')) {
        throw new Error('SUBSCRIPTION_LIMIT_REACHED');
      }
      if (subscribeError.message.includes('ALREADY_SUBSCRIBED')) {
        throw new Error('ALREADY_SUBSCRIBED');
      }
      throw subscribeError;
    }

    if (!subscription) {
      throw new Error('No subscription data returned from atomic function');
    }
  } catch (rpcError) {
    errorLogger.appError(rpcError instanceof Error ? rpcError : new Error(String(rpcError)), {
      service: 'subscriptions_service',
      operation: 'rpc_call_failed',
      user_id: userId,
      channel_id: channelId,
    });
    throw rpcError;
  }

  // Type the JSON result properly
  const subscriptionData: AtomicSubscriptionResult = subscription;

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
  const { data, error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    dbLogger.error('Unsubscribe failed', { error: error.message, userId, subscriptionId });
    if (error.code === 'PGRST116') { // No rows returned
      throw new Error('Subscription not found or user does not own it.');
    }
    throw error;
  }
}

/**
 * Generate 32-bit integer hash for advisory lock keys using crypto
 * @param str - String to hash
 * @returns 32-bit signed integer hash within PostgreSQL integer range
 */
function hashStringToInt32(str: string): number {
  // Create SHA-256 hash of the string
  const hash = createHash('sha256').update(str).digest('hex');

  // Convert first 8 characters of hex to 32-bit integer
  // Take first 8 hex chars (32 bits) and convert to number
  const int32Hash = parseInt(hash.substring(0, 8), 16);

  // Convert to signed 32-bit integer within PostgreSQL range (-2147483648 to 2147483647)
  // Use bitwise OR to convert to signed 32-bit
  const signedInt32 = int32Hash | 0;
  
  // Return absolute value to ensure positive (advisory locks prefer positive integers)
  // But keep within valid range
  return Math.abs(signedInt32);
}
