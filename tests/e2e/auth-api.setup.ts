import { test as setup, expect } from "@playwright/test";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { stringToBase64URL } from "@supabase/ssr";

// Constants from @supabase/ssr
const MAX_CHUNK_SIZE = 3180;

// Helper to set Supabase auth cookies in the format expected by @supabase/ssr
async function setSupabaseAuthCookies(
  page: import("@playwright/test").Page,
  session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    user?: unknown;
  },
  projectRef: string
) {
  const cookieName = `sb-${projectRef}-auth-token`;

  // JSON stringify and then base64url encode the session
  const sessionJson = JSON.stringify(session);
  const encodedValue = stringToBase64URL(sessionJson);

  // Check if we need to chunk the cookie (> MAX_CHUNK_SIZE bytes)
  const cookies: {
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Lax";
  }[] = [];

  if (encodedValue.length <= MAX_CHUNK_SIZE) {
    // Single cookie - no chunking needed
    cookies.push({
      name: cookieName,
      value: encodedValue,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    });
  } else {
    // Split into chunks
    let index = 0;
    let position = 0;
    while (position < encodedValue.length) {
      const chunkValue = encodedValue.substring(position, position + MAX_CHUNK_SIZE);
      cookies.push({
        name: `${cookieName}.${index}`,
        value: chunkValue,
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      });
      position += MAX_CHUNK_SIZE;
      index++;
    }
  }

  await page.context().addCookies(cookies);
}

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

    // Extract project reference from Supabase URL
    const projectRef = supabaseUrl.match(/https:\/\/(.*)\.supabase\.co/)?.[1] || "";

    if (!projectRef) {
      throw new Error("Could not extract project reference from SUPABASE_URL");
    }

    // Set auth cookies in the format expected by @supabase/ssr
    await setSupabaseAuthCookies(page, loginData.session, projectRef);

    console.log(`   📝 Auth cookies set for project: ${projectRef}`);

    // Debug: List all cookies
    const cookies = await page.context().cookies();
    console.log(
      `   🍪 Cookies set:`,
      cookies.map((c) => `${c.name}=${c.value.substring(0, 50)}...`)
    );

    // Now navigate to dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Debug: Check the current URL after navigation
    const currentUrl = page.url();
    console.log(`   📍 Current URL after navigation: ${currentUrl}`);

    // Debug: Take a screenshot to see what's on the page
    await page.screenshot({ path: "test-results/debug-auth-api.png" });
    console.log(`   📸 Screenshot saved to test-results/debug-auth-api.png`);

    // Debug: Log page content
    const pageTitle = await page.title();
    const h1Text = await page
      .locator("h1")
      .first()
      .textContent()
      .catch(() => "No h1 found");
    console.log(`   📄 Page title: ${pageTitle}, H1: ${h1Text}`);

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
setup("authenticate mobile via api", async ({ page, request: _request }) => {
  console.log("📱 Setting up mobile authentication state via API...");

  try {
    // Load test user data from environment variables
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    }

    console.log(`   Logging in as: ${testEmail} via SDK (mobile)`);

    // Use Supabase client directly (same approach as desktop)
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

    console.log("   ✅ SDK login successful");

    // Extract project reference from Supabase URL
    const projectRef = supabaseUrl.match(/https:\/\/(.*)\.supabase\.co/)?.[1] || "";

    if (!projectRef) {
      throw new Error("Could not extract project reference from SUPABASE_URL");
    }

    // Set auth cookies in the format expected by @supabase/ssr
    await setSupabaseAuthCookies(page, loginData.session, projectRef);

    console.log(`   📝 Auth cookies set for project: ${projectRef}`);

    // Navigate to dashboard
    await page.goto("/dashboard");

    // Wait for dashboard to load
    await expect(
      page.locator("h1").filter({ hasText: "Welcome" }).or(page.locator('[data-testid*="dashboard"]'))
    ).toBeVisible({ timeout: 15000 });

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
