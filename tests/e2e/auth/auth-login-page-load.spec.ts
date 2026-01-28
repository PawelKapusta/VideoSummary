import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";

test.describe("Login Page - Page Load", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test("should display login form with all required elements", async () => {
    // Verify login form is visible
    await expect(authPage.loginForm).toBeVisible();

    // Verify email input
    await expect(authPage.loginEmailInput).toBeVisible();

    // Verify password input
    await expect(authPage.loginPasswordInput).toBeVisible();

    // Verify submit button
    await expect(authPage.loginButton).toBeVisible();
  });

  test("should have correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Log in|Login|Sign in/i);
  });

  test("should show link to registration page", async () => {
    await expect(authPage.registerLink).toBeVisible();
  });

  test("should show forgot password link", async () => {
    await expect(authPage.forgotPasswordLink).toBeVisible();
  });
});
