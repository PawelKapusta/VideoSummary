import { test as setup, expect } from "@playwright/test";
import path from "path";

// Authentication setup - creates browser state for reuse in tests
setup("authenticate desktop", async ({ page }) => {
  console.log("🔐 Setting up desktop authentication state...");

  try {
    // Load test user data from environment variables
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    }

    console.log(`   Logging in as: ${testEmail}`);

    // Navigate to login page
    await page.goto("/login");

    // Wait for login form to load
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Fill in login credentials
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);

    // Submit login form
    await page.locator('button[type="submit"]').click();

    // Wait for successful login and redirect to dashboard
    await page.waitForURL("/dashboard", { timeout: 10000 });

    // Verify we're logged in by checking dashboard elements
    await expect(
      page.locator("h1").filter({ hasText: "Welcome" }).or(page.locator('[data-testid*="dashboard"]'))
    ).toBeVisible();

    console.log("   ✅ Desktop authentication successful, saving state...");

    // Save authenticated state
    await page.context().storageState({
      path: path.join(process.cwd(), "test-results", ".auth", "user.json"),
    });
  } catch (error) {
    console.error("   ❌ Desktop authentication setup failed:", error);
    throw error;
  }
});

// Mobile authentication setup
setup("authenticate mobile", async ({ page, browserName: _browserName }) => {
  console.log("📱 Setting up mobile authentication state...");

  try {
    // Load test user data from environment variables
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    }

    console.log(`   Logging in as: ${testEmail} (mobile)`);

    // Navigate to login page
    await page.goto("/login");

    // Wait for login form to load
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Fill in login credentials
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);

    // Submit login form
    await page.locator('button[type="submit"]').click();

    // Wait for successful login and redirect to dashboard
    await page.waitForURL("/dashboard", { timeout: 10000 });

    // Verify we're logged in
    await expect(
      page.locator("h1").filter({ hasText: "Welcome" }).or(page.locator('[data-testid*="dashboard"]'))
    ).toBeVisible();

    console.log("   ✅ Mobile authentication successful, saving state...");

    // Save authenticated state for mobile
    await page.context().storageState({
      path: path.join(process.cwd(), "test-results", ".auth", "user-mobile.json"),
    });
  } catch (error) {
    console.error("   ❌ Mobile authentication setup failed:", error);
    throw error;
  }
});
