import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import type { Database } from "../../src/db/database.types";

// Note: For E2E tests, we assume the test user already exists in the database
// and is configured via environment variables. We don't need direct database access
// for E2E tests - authentication and data operations happen through the app's public API.

setup("setup test database", async () => {
  console.log("🚀 Setting up test database...");

  try {
    // Run migrations if needed (in a real setup, you might run supabase db reset)
    console.log("📋 Running database migrations...");
    await runMigrations();

    // Clean up existing test data
    console.log("🧹 Cleaning up existing test data...");
    await cleanupTestData();

    // Seed test data
    console.log("🌱 Seeding test data...");
    const testUser = await seedTestUser();
    const testChannels = await seedTestChannels();
    const testVideos = await seedTestVideos(testChannels);
    const testSummaries = await seedTestSummaries(testVideos);

    // Authentication state will be created by auth.setup.ts

    console.log("✅ Test database setup completed successfully!");
    console.log(`   Test user: ${testUser.email}`);
    console.log(`   Test channels: ${testChannels.length}`);
    console.log(`   Test videos: ${testVideos.length}`);
    console.log(`   Test summaries: ${testSummaries.length}`);
  } catch (error) {
    console.error("❌ Failed to setup test database:", error);
    throw error;
  }
});

async function runMigrations() {
  // In a real setup, you might run: supabase db reset --db-url $TEST_DB_URL
  // For now, we'll assume migrations are already run or handle this differently
  console.log("   Migrations assumed to be current");
}

async function cleanupTestData() {
  // Clean up in reverse dependency order
  console.log("   Cleaning summaries...");
  await supabase.from("summary_ratings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("hidden_summaries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("summaries").delete().neq("id", "00000000-0000-0000-0000-0000-000000000000");
  await supabase.from("generation_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("videos").delete().neq("id", "00000000-0000-0000-0000-0000-000000000000");
  await supabase.from("subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("channels").delete().neq("id", "00000000-0000-0000-0000-0000-000000000000");

  // Clean up test users (but keep the profiles table structure)
  console.log("   Cleaning test users...");
  const { data: testUsers } = await supabase.auth.admin.listUsers();
  for (const user of testUsers || []) {
    if (user.email?.includes("test-")) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }
}

async function seedTestUser() {
  console.log("   Setting up test user...");

  // Check if test user already exists (from environment variables)
  const testUserId = process.env.E2E_USERNAME_ID;
  const testEmail = process.env.E2E_USERNAME;
  const testPassword = process.env.E2E_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
  }

  console.log(`   Using test user: ${testEmail}`);

  // Try to create user, but handle case where user already exists
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError && !authError.message.includes("already registered")) {
    throw new Error(`Failed to setup test user: ${authError.message}`);
  }

  // If user was just created, wait for profile trigger
  if (authData?.user) {
    console.log("   New test user created, waiting for profile...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      id: authData.user.id,
      email: testEmail,
      password: testPassword,
    };
  }

  // User already exists or we need to find existing user
  if (testUserId) {
    console.log("   Using existing test user from E2E_USERNAME_ID");
    return {
      id: testUserId,
      email: testEmail,
      password: testPassword,
    };
  }

  // Try to find existing user by email
  console.log("   Looking for existing test user...");
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.find((user) => user.email === testEmail);

  if (!existingUser) {
    throw new Error("Test user not found and could not be created");
  }

  return {
    id: existingUser.id,
    email: testEmail,
    password: testPassword,
  };
}

async function seedTestChannels() {
  console.log("   Creating test channels...");

  const channels = [
    {
      youtube_channel_id: "UC_test_channel_1",
      name: "Test Tech Channel",
    },
    {
      youtube_channel_id: "UC_test_channel_2",
      name: "Test Science Channel",
    },
    {
      youtube_channel_id: "UC_test_channel_3",
      name: "Test Business Channel",
    },
  ];

  const insertedChannels = [];
  for (const channel of channels) {
    const { data, error } = await supabase.from("channels").insert(channel).select().single();

    if (error) {
      throw new Error(`Failed to create channel ${channel.name}: ${error.message}`);
    }

    insertedChannels.push(data);
  }

  return insertedChannels;
}

async function seedTestVideos(channels: any[]) {
  console.log("   Creating test videos...");

  const videos = [
    {
      youtube_video_id: "test_video_1",
      title: "Introduction to Machine Learning",
      thumbnail_url: "https://img.youtube.com/vi/test_video_1/maxresdefault.jpg",
      published_at: new Date("2024-01-15T10:00:00Z").toISOString(),
      channel_id: channels[0].id,
    },
    {
      youtube_video_id: "test_video_2",
      title: "Quantum Physics Explained",
      thumbnail_url: "https://img.youtube.com/vi/test_video_2/maxresdefault.jpg",
      published_at: new Date("2024-01-20T15:30:00Z").toISOString(),
      channel_id: channels[1].id,
    },
    {
      youtube_video_id: "test_video_3",
      title: "Business Strategy Fundamentals",
      thumbnail_url: "https://img.youtube.com/vi/test_video_3/maxresdefault.jpg",
      published_at: new Date("2024-01-25T08:45:00Z").toISOString(),
      channel_id: channels[2].id,
    },
    {
      youtube_video_id: "test_video_4",
      title: "Advanced AI Techniques",
      thumbnail_url: "https://img.youtube.com/vi/test_video_4/maxresdefault.jpg",
      published_at: new Date("2024-01-30T12:15:00Z").toISOString(),
      channel_id: channels[0].id,
    },
    {
      youtube_video_id: "test_video_5",
      title: "Climate Change Solutions",
      thumbnail_url: "https://img.youtube.com/vi/test_video_5/maxresdefault.jpg",
      published_at: new Date("2024-02-01T09:20:00Z").toISOString(),
      channel_id: channels[1].id,
    },
  ];

  const insertedVideos = [];
  for (const video of videos) {
    const { data, error } = await supabase.from("videos").insert(video).select().single();

    if (error) {
      throw new Error(`Failed to create video ${video.title}: ${error.message}`);
    }

    insertedVideos.push(data);
  }

  return insertedVideos;
}

async function seedTestSummaries(videos: any[]) {
  console.log("   Creating test summaries...");

  const summaries = [
    {
      video_id: videos[0].id,
      channel_id: videos[0].channel_id,
      status: "completed",
      tldr: "Machine learning is a subset of AI that enables computers to learn without explicit programming.",
      full_summary: JSON.stringify({
        summary:
          "This video provides a comprehensive introduction to machine learning concepts, algorithms, and applications.",
        conclusions: ["ML is transforming industries", "Understanding basics is crucial for modern developers"],
        key_points: ["Supervised vs Unsupervised learning", "Neural networks basics", "Real-world applications"],
      }),
      generated_at: new Date("2024-01-16T14:30:00Z").toISOString(),
    },
    {
      video_id: videos[1].id,
      channel_id: videos[1].channel_id,
      status: "completed",
      tldr: "Quantum physics explores the behavior of matter and energy at atomic and subatomic scales.",
      full_summary: JSON.stringify({
        summary: "An in-depth exploration of quantum mechanics principles and their implications for modern physics.",
        conclusions: ["Quantum effects are fundamental to reality", "Many phenomena remain unexplained"],
        key_points: ["Wave-particle duality", "Uncertainty principle", "Quantum entanglement"],
      }),
      generated_at: new Date("2024-01-21T16:45:00Z").toISOString(),
    },
    {
      video_id: videos[2].id,
      channel_id: videos[2].channel_id,
      status: "failed",
      error_code: "NO_SUBTITLES",
      generated_at: new Date("2024-01-26T10:15:00Z").toISOString(),
    },
    {
      video_id: videos[3].id,
      channel_id: videos[3].channel_id,
      status: "in_progress",
      generated_at: new Date("2024-01-31T13:30:00Z").toISOString(),
    },
    {
      video_id: videos[4].id,
      channel_id: videos[4].channel_id,
      status: "pending",
    },
  ];

  const insertedSummaries = [];
  for (const summary of summaries) {
    const { data, error } = await supabase.from("summaries").insert(summary).select().single();

    if (error) {
      throw new Error(`Failed to create summary for video ${summary.video_id}: ${error.message}`);
    }

    insertedSummaries.push(data);
  }

  return insertedSummaries;
}
