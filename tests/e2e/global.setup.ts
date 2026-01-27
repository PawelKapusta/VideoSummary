import { test as setup } from "@playwright/test";

// Note: For E2E tests, we assume the test user already exists in the database
// and is configured via environment variables. We don't need direct database access
// for E2E tests - authentication and data operations happen through the app's public API.

setup("setup test environment", async () => {
  console.log("🚀 Setting up test environment...");

  try {
    // Validate test user configuration
    console.log("📋 Validating test user configuration...");
    await validateTestUser();

    console.log("✅ Test environment setup completed successfully!");
    console.log("   Test user configured and ready for E2E tests");
  } catch (error) {
    console.error("❌ Failed to setup test environment:", error);
    throw error;
  }
});

async function validateTestUser() {
  const testEmail = process.env.E2E_USERNAME;
  const testPassword = process.env.E2E_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
  }

  console.log(`   Test user configured: ${testEmail}`);
}
