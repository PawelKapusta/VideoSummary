import { test as setup, expect } from "@playwright/test";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Alternative authentication setup using API calls (faster than UI interactions)
setup("authenticate via api", async ({ page, request: _request }) => {
  console.log("🔐 Setting up authentication state via API...");

  try {
    // Load test user data from environment variables
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    }

    console.log(`   Logging in as: ${testEmail} (Direct via SDK)`);

    // Use Supabase client directly to get a session
    // This is more reliable in E2E tests than hitting the app's own API
    // which might have environment loading issues
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_KEY || "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error(`   ❌ Direct SDK login failed:`, loginError.message);
      throw loginError;
    }

    if (!loginData.session) {
      throw new Error("No session returned from Supabase");
    }

    console.log("   ✅ Direct SDK login successful");

    // Add session cookies to the browser context
    const projectRef = process.env.SUPABASE_URL?.match(/https:\/\/(.*)\.supabase\.co/)?.[1] || "";

    await page.context().addCookies([
      {
        name: `sb-${projectRef}-auth-token`,
        value: JSON.stringify(loginData.session),
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // Now navigate to dashboard
    await page.goto("/dashboard");

    // Wait for dashboard to load and verify authentication
    // Check for "Welcome" text or dashboard-related elements
    await expect(
      page.locator("h1").filter({ hasText: "Welcome" }).or(page.locator('[data-testid*="dashboard"]'))
    ).toBeVisible({ timeout: 15000 });

    console.log("   ✅ Session established, saving browser state...");

    // Save authenticated state
    await page.context().storageState({
      path: path.join(process.cwd(), "test-results", ".auth", "user-api.json"),
    });
  } catch (error) {
    console.error("   ❌ API authentication setup failed:", error);
    throw error;
  }
});

// Mobile authentication via API
setup("authenticate mobile via api", async ({ page, request }) => {
  console.log("📱 Setting up mobile authentication state via API...");

  try {
    // Load test user data from environment variables
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    }

    console.log(`   Logging in as: ${testEmail} via API (mobile)`);

    // Make API call to login endpoint
    const loginResponse = await request.post("/api/auth/login", {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();

    console.log("   ✅ API login successful");

    // Navigate to the app to establish browser session
    await page.goto("/dashboard");

    // Set the session token
    await page.evaluate((session) => {
      localStorage.setItem("supabase.auth.token", JSON.stringify(session));
      document.cookie = `sb-access-token=${session.access_token}; path=/; secure; samesite=lax`;
      document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; secure; samesite=lax`;
    }, loginData.session);

    // Reload the page to apply the session
    await page.reload();

    // Wait for dashboard to load
    await expect(
      page.locator("h1").filter({ hasText: "Welcome" }).or(page.locator('[data-testid*="dashboard"]'))
    ).toBeVisible();

    console.log("   ✅ Mobile session established, saving browser state...");

    // Save authenticated state for mobile
    await page.context().storageState({
      path: path.join(process.cwd(), "test-results", ".auth", "user-mobile-api.json"),
    });
  } catch (error) {
    console.error("   ❌ Mobile API authentication setup failed:", error);
    throw error;
  }
});
