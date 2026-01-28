import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";

/**
 * Login Tests
 *
 * These tests run WITHOUT a pre-authenticated session (storageState: undefined)
 * to verify the actual login functionality from a fresh browser state.
 *
 * This follows the Playwright best practice of having separate projects:
 * - "auth tests" - starts with clean session (for testing login/register flows)
 * - "authenticated" - starts with saved session (for testing app features)
 */

test.describe("Login Page", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test.describe("Page Load", () => {
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

  test.describe("Login Form Validation", () => {
    test("should show error for empty email", async ({ page }) => {
      // Fill only password
      await authPage.loginPasswordInput.fill("somepassword");
      await authPage.loginButton.click();

      // Email field should be invalid (HTML5 validation or custom error)
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute("required");
    });

    test("should show error for empty password", async ({ page }) => {
      // Fill only email
      await authPage.loginEmailInput.fill("test@example.com");
      await authPage.loginButton.click();

      // Password field should be invalid (custom validation, not HTML5 required attribute)
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toHaveAttribute("aria-invalid", "true");

      // Verify error message is displayed
      await expect(page.locator("text=Password is required")).toBeVisible();
    });

    test("should show error for invalid email format", async ({ page }) => {
      await authPage.loginEmailInput.fill("invalid-email");
      await authPage.loginPasswordInput.fill("password123");
      await authPage.loginButton.click();

      // Check for invalid email validation
      const emailInput = page.locator('input[type="email"]');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });
  });

  test.describe("Login Flow - Invalid Credentials", () => {
    test("should show error for wrong email", async ({ page }) => {
      const errorMessage = page.locator('[data-testid="form-error-message"]');

      // Ensure no error message is visible before starting
      await expect(errorMessage).not.toBeVisible();

      // Fill login form with invalid credentials
      await authPage.loginEmailInput.fill("nonexistent@example.com");
      await authPage.loginPasswordInput.fill("WrongPassword123!");

      // Click submit and wait for request to complete
      const submitButton = authPage.loginButton;
      await submitButton.click();

      // Wait for the submit button to stop loading (request completed)
      await expect(submitButton).not.toHaveText(/Signing In.../i, { timeout: 15000 });

      // Wait for error message alert to appear
      // First wait for the element to be in DOM
      await errorMessage.waitFor({ state: "attached", timeout: 10000 });

      // Then wait for it to be visible (handles animation)
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      // Finally verify the text content
      await expect(errorMessage).toContainText("Invalid email or password");
    });

    test("should show error for wrong password", async ({ page }) => {
      const testEmail = process.env.E2E_USERNAME || "test@example.com";
      const errorMessage = page.locator('[data-testid="form-error-message"]');

      // Ensure no error message is visible before starting
      await expect(errorMessage).not.toBeVisible();

      // Fill login form with wrong password
      await authPage.loginEmailInput.fill(testEmail);
      await authPage.loginPasswordInput.fill("WrongPassword123!");

      // Click submit and wait for request to complete
      const submitButton = authPage.loginButton;
      await submitButton.click();

      // Wait for the submit button to stop loading (request completed)
      await expect(submitButton).not.toHaveText(/Signing In.../i, { timeout: 15000 });

      // Wait for error message alert to appear
      // First wait for the element to be in DOM
      await errorMessage.waitFor({ state: "attached", timeout: 10000 });

      // Then wait for it to be visible (handles animation)
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      // Finally verify the text content
      await expect(errorMessage).toContainText("Invalid email or password");
    });
  });

  test.describe("Login Flow - Valid Credentials", () => {
    test("should login successfully with valid credentials", async ({ page }) => {
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

    test("should persist session after login", async ({ page, context }) => {
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;

      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      await authPage.login(testEmail as string, testPassword as string);
      await page.waitForURL("/dashboard", { timeout: 15000 });

      // Verify cookies are set (Supabase auth cookies)
      const cookies = await context.cookies();
      const authCookie = cookies.find((c) => c.name.includes("auth-token"));
      expect(authCookie).toBeDefined();
    });
  });

  test.describe("Navigation from Login", () => {
    test("should navigate to registration page when clicking sign up link", async ({ page }) => {
      await authPage.clickRegisterLink();

      await expect(page).toHaveURL(/\/signup/);
    });

    test("should navigate to forgot password page when clicking forgot password link", async ({ page }) => {
      await authPage.clickForgotPasswordLink();

      await expect(page).toHaveURL(/\/reset-password|\/forgot-password/);
    });
  });
});
