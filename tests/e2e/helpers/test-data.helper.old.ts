import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/db/database.types";

// Test database configuration - using environment variables from .env.test
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLIC_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_PUBLIC_KEY) must be set in .env.test");
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

export interface TestChannel {
  id: string;
  youtube_channel_id: string;
  name: string;
}

export interface TestVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  channel_id: string;
}

export interface TestSummary {
  id: string;
  video_id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

/**
 * Load test user data from environment variables (.env.test)
 */
export async function loadTestUser(): Promise<TestUser> {
  try {
    const userId = process.env.E2E_USERNAME_ID;
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    }

    return {
      id: userId || "test-user-id",
      email,
      password,
    };
  } catch (error) {
    throw new Error(`Failed to load test user data: ${error}`);
  }
}

/**
 * Get all test channels
 */
export async function getTestChannels(): Promise<TestChannel[]> {
  const { data, error } = await supabase.from("channels").select("id, youtube_channel_id, name").order("name");

  if (error) {
    throw new Error(`Failed to get test channels: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all test videos
 */
export async function getTestVideos(): Promise<TestVideo[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("id, youtube_video_id, title, channel_id")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get test videos: ${error.message}`);
  }

  return data || [];
}

/**
 * Get videos with summaries
 */
export async function getVideosWithSummaries(): Promise<TestVideo[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("id, youtube_video_id, title, channel_id, summaries!inner(status)")
    .eq("summaries.status", "completed")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get videos with summaries: ${error.message}`);
  }

  return data || [];
}

/**
 * Get videos without summaries
 */
export async function getVideosWithoutSummaries(): Promise<TestVideo[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("id, youtube_video_id, title, channel_id")
    .is("summaries", null)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get videos without summaries: ${error.message}`);
  }

  return data || [];
}

/**
 * Get videos by channel
 */
export async function getVideosByChannel(channelId: string): Promise<TestVideo[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("id, youtube_video_id, title, channel_id")
    .eq("channel_id", channelId)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get videos by channel: ${error.message}`);
  }

  return data || [];
}

/**
 * Subscribe test user to a channel
 */
export async function subscribeToChannel(userId: string, channelId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      channel_id: channelId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to subscribe to channel: ${error.message}`);
  }

  return data;
}

/**
 * Unsubscribe test user from a channel
 */
export async function unsubscribeFromChannel(userId: string, channelId: string) {
  const { error } = await supabase.from("subscriptions").delete().eq("user_id", userId).eq("channel_id", channelId);

  if (error) {
    throw new Error(`Failed to unsubscribe from channel: ${error.message}`);
  }
}

/**
 * Create a test summary for a video
 */
export async function createTestSummary(videoId: string, status: "completed" | "failed" = "completed") {
  const { data: video } = await supabase.from("videos").select("channel_id").eq("id", videoId).single();

  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }

  const summaryData = {
    video_id: videoId,
    channel_id: video.channel_id,
    status,
    tldr: status === "completed" ? "Test summary TL;DR" : undefined,
    full_summary:
      status === "completed"
        ? JSON.stringify({
            summary: "Test full summary",
            conclusions: ["Test conclusion"],
            key_points: ["Test point"],
          })
        : undefined,
    generated_at: status === "completed" ? new Date().toISOString() : undefined,
    error_code: status === "failed" ? "NO_SUBTITLES" : undefined,
  };

  const { data, error } = await supabase.from("summaries").insert(summaryData).select().single();

  if (error) {
    throw new Error(`Failed to create test summary: ${error.message}`);
  }

  return data;
}

/**
 * Delete a test summary
 */
export async function deleteTestSummary(summaryId: string) {
  const { error } = await supabase.from("summaries").delete().eq("id", summaryId);

  if (error) {
    throw new Error(`Failed to delete test summary: ${error.message}`);
  }
}

/**
 * Wait for summary generation to complete
 */
export async function waitForSummaryGeneration(videoId: string, timeout = 30000): Promise<TestSummary | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const { data, error } = await supabase
      .from("summaries")
      .select("id, video_id, status")
      .eq("video_id", videoId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw new Error(`Error checking summary status: ${error.message}`);
    }

    if (data && (data.status === "completed" || data.status === "failed")) {
      return data;
    }

    // Wait 1 second before checking again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return null; // Timeout
}

/**
 * Clean up test data between tests
 */
export async function cleanupTestData() {
  // This is a lighter cleanup that can be used between tests
  // Full cleanup is done in global.teardown.ts

  const { error } = await supabase.from("summary_ratings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.warn("Warning: Failed to cleanup summary ratings:", error);
  }
}

/**
 * Setup test user subscriptions for videos tests
 */
export async function setupUserSubscriptions(userId: string) {
  const channels = await getTestChannels();

  // Subscribe to first 2 channels
  for (const channel of channels.slice(0, 2)) {
    await subscribeToChannel(userId, channel.id);
  }

  return channels.slice(0, 2);
}
