import type { SupabaseClient } from "../db/supabase.client";
import type { UserProfile, SubscriptionWithChannel } from "../types";
import { errorLogger } from "./logger";

/**
 * Update user profile information
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param updates - Profile updates (username)
 * @returns Updated UserProfile
 */
export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: { username?: string }
): Promise<UserProfile> {
  // Update profile in database
  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, created_at, username")
    .single();

  if (updateError || !updatedProfile) {
    throw new Error(`Failed to update profile: ${updateError?.message || "Unknown error"}`);
  }

  // Get current user email
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not found");
  }

  // Get subscriptions (reuse existing logic)
  const profile = await getUserProfile(supabase, userId);

  return {
    ...profile,
    username: updatedProfile.username ?? undefined,
  };
}

/**
 * Get user profile with subscription information
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns UserProfile with subscribed channels and count
 */
export async function getUserProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile> {
  // Query profile from profiles table (which has the same ID as auth.users)
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, created_at, username")
    .eq("id", userId)
    .single();

  let userCreatedAt: string;
  let userEmail: string;
  let userUsername: string | undefined;

  // If profile doesn't exist, create it (fallback for when trigger doesn't work)
  if (profileError || !profileData) {
    // Get user info to create profile
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User not found");
    }

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({ id: userId, created_at: user.created_at })
      .select("id, created_at, username")
      .single();

    if (createError || !newProfile) {
      throw new Error("User not found");
    }

    userCreatedAt = newProfile.created_at;
    userEmail = user.email || "";
    userUsername = newProfile.username ?? undefined;
  } else {
    // Profile exists, get user email
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User not found");
    }

    userCreatedAt = profileData.created_at;
    userEmail = user.email || "";
    userUsername = profileData.username ?? undefined;
  }

  // Query subscriptions with channel information
  let subscribedChannels: SubscriptionWithChannel[] = [];

  try {
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select(
        `
        id,
        created_at,
        channels (
          id,
          youtube_channel_id,
          name,
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (subscriptionsError) {
      // Log error but continue with empty subscriptions
      errorLogger.appError(subscriptionsError, {
        service: "profile_service",
        operation: "get_user_subscriptions",
        user_id: userId,
      });
      // Don't throw - return profile with empty subscriptions
    } else {
      // Format subscriptions according to SubscriptionWithChannel type
      subscribedChannels = (subscriptions || []).map(
        (sub: {
          id: string;
          created_at: string;
          channels: { id: string; youtube_channel_id: string; name: string; created_at: string };
        }) => ({
          subscription_id: sub.id,
          channel: {
            id: sub.channels.id,
            youtube_channel_id: sub.channels.youtube_channel_id,
            name: sub.channels.name,
            created_at: sub.channels.created_at,
          },
          subscribed_at: sub.created_at,
        })
      );
    }
  } catch (dbError) {
    // Log database connection errors but continue
    errorLogger.appError(dbError instanceof Error ? dbError : new Error(String(dbError)), {
      service: "profile_service",
      operation: "database_query",
      user_id: userId,
    });
    // Continue with empty subscriptions
  }

  // Return formatted profile
  return {
    id: userId,
    email: userEmail,
    username: userUsername,
    created_at: userCreatedAt,
    subscribed_channels: subscribedChannels,
    subscription_count: subscribedChannels.length,
  };
}
