import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";

test.describe("Registration Page - Page Load", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoRegister();
  });

  test("should display registration form with all required elements", async ({ page }) => {
    // Verify email input
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Verify password input(s)
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs.first()).toBeVisible();

    // Verify submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should have correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Video Summary|Sign up|Register|Create account/i);
  });

  test("should show link to login page", async ({ page }) => {
    const loginLink = page.locator("a").filter({ hasText: /Log in|Sign in/i });
    await expect(loginLink).toBeVisible();
  });
});
