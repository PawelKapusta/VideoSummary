import { test as teardown } from "@playwright/test";

// Note: For E2E tests, we don't need to cleanup database data
// since we assume test data is pre-configured and tests don't modify it

teardown("cleanup test environment", async () => {
  console.log("🧹 Cleaning up test environment...");

  try {
    // Clean up auth state files
    console.log("   Cleaning up auth state files...");
    await cleanupAuthState();

    console.log("✅ Test environment cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Failed to cleanup test environment:", error);
    // Don't throw error for cleanup failures as they shouldn't break the test suite
  }
});

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
