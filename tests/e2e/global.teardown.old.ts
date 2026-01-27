import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

// Test database configuration - using environment variables from .env.test
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLIC_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_PUBLIC_KEY) must be set in .env.test");
}

// Create service client for database operations
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

teardown("cleanup test database", async () => {
  console.log("🧹 Cleaning up test database...");

  try {
    // Clean up test data in reverse dependency order
    console.log("   Cleaning up test data...");
    await cleanupTestData();

    // Clean up test users
    console.log("   Cleaning up test users...");
    await cleanupTestUsers();

    // Clean up auth state files
    console.log("   Cleaning up auth state files...");
    await cleanupAuthState();

    console.log("✅ Test database cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Failed to cleanup test database:", error);
    throw error;
  }
});

async function cleanupTestData() {
  try {
    // Clean up in reverse dependency order to avoid foreign key constraints
    console.log("   Removing summary ratings...");
    await supabase.from("summary_ratings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("   Removing hidden summaries...");
    await supabase.from("hidden_summaries").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("   Removing summaries...");
    await supabase.from("summaries").delete().neq("id", "00000000-0000-0000-0000-0000-000000000000");

    console.log("   Removing generation requests...");
    await supabase.from("generation_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("   Removing videos...");
    await supabase.from("videos").delete().neq("id", "00000000-0000-0000-0000-0000-000000000000");

    console.log("   Removing subscriptions...");
    await supabase.from("subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("   Removing test channels...");
    await supabase.from("channels").delete().neq("id", "00000000-0000-0000-0000-0000-000000000000");
  } catch (error) {
    console.error("   Error during data cleanup:", error);
    throw error;
  }
}

async function cleanupTestUsers() {
  try {
    // Get all users and delete test users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("   Error listing users:", listError);
      return;
    }

    const testUsers = users?.filter((user) => user.email?.includes("test-")) || [];

    console.log(`   Found ${testUsers.length} test users to delete`);

    for (const user of testUsers) {
      console.log(`   Deleting test user: ${user.email}`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error(`   Error deleting user ${user.email}:`, deleteError);
      }
    }
  } catch (error) {
    console.error("   Error during user cleanup:", error);
    throw error;
  }
}

async function cleanupAuthState() {
  try {
    const fs = await import("fs");
    const path = await import("path");

    const authDir = path.join(process.cwd(), "test-results", ".auth");

    if (fs.existsSync(authDir)) {
      console.log("   Auth state files will be kept for next test run...");
      // Don't remove auth state files as they can be reused
      // They will be overwritten by next auth setup if needed
    }
  } catch (error) {
    console.error("   Error during auth state check:", error);
    // Don't throw error for auth state cleanup as it's not critical
  }
}
