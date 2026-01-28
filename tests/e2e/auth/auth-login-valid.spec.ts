import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";

test.describe("Login Page - Valid Credentials", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test.skip("should login successfully with valid credentials", async ({ page }) => {
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    // Skip test if credentials not available
    test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

    await authPage.login(testEmail as string, testPassword as string);

    // Wait for successful login - redirect to dashboard
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify welcome message or dashboard content
    await expect(
      page.locator("h1").filter({ hasText: "Welcome" }).or(page.locator('[data-testid*="dashboard"]'))
    ).toBeVisible();
  });

  // test.fixme("should persist session after login", async ({ page, context }) => {
  //   const testEmail = process.env.E2E_USERNAME;
  //   const testPassword = process.env.E2E_PASSWORD;

  //   test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

  //   await authPage.login(testEmail as string, testPassword as string);
  //   await page.waitForURL("/dashboard", { timeout: 15000 });

  //   // Verify cookies are set (Supabase auth cookies)
  //   const cookies = await context.cookies();
  //   const authCookie = cookies.find((c) => c.name.includes("auth-token"));
  //   expect(authCookie).toBeDefined();
  // });
});
