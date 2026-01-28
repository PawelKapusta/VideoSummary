import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";

/**
 * Password Reset Tests
 *
 * These tests run WITHOUT a pre-authenticated session (storageState: undefined)
 * to verify the password reset functionality from a fresh browser state.
 */

test.describe.skip("Password Reset Page", () => {
  // Run all password reset tests sequentially to avoid rate limiting
  test.describe.configure({ mode: "serial" });

  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoResetPassword();
  });

  test.describe("Page Load", () => {
    // Run success test first to avoid rate limiting from validation tests
    test("should show success message for valid email", async ({ page }) => {
      // Use a valid test email - run this test first to avoid rate limiting
      const testEmail = process.env.E2E_USERNAME || "test@example.com";

      await page.locator('input[type="email"]').fill(testEmail);
      await page.locator('button[type="submit"]').click();

      // Wait for success message
      await expect(
        page
          .locator('[data-testid="reset-success"]')
          .or(page.locator("text=Password reset email sent. Check your inbox (and spam folder)."))
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display reset password form with all required elements", async ({ page }) => {
      // Verify email input
      await expect(page.locator('input[type="email"]')).toBeVisible();

      // Verify submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should have correct page title", async ({ page }) => {
      await expect(page).toHaveTitle(/Video Summary|Reset password|Forgot password|Recover/i);
    });

    test("should show link to login page", async ({ page }) => {
      const loginLink = page.locator("a").filter({ hasText: /Log in|Sign in|Back to login/i });
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe("Reset Password Form Validation", () => {
    test("should show error for empty email", async ({ page }) => {
      // Fill email field to enable button, then clear it to trigger validation
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');

      await emailInput.fill("temp@example.com");
      await expect(submitButton).toBeEnabled(); // Button should be enabled when email is filled

      await emailInput.clear();
      await expect(submitButton).toBeDisabled(); // Button should be disabled when email is empty

      // Email field should be invalid (custom validation, not HTML5 required attribute)
      await expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });

    test("should show error for invalid email format", async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');

      // Fill valid email to enable button
      await emailInput.fill("valid@example.com");
      await expect(submitButton).toBeEnabled();

      // Change to invalid email
      await emailInput.fill("invalid-email");

      // Check that email is invalid and button may be disabled
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });
  });

  test.describe("Reset Password Flow", () => {
    test("should handle non-existent email gracefully", async ({ page }) => {
      // Use a non-existent email - system should always show success for security
      // (prevents account enumeration by not revealing which emails are registered)
      await page.locator('input[type="email"]').fill("nonexistent-user-12345@example.com");
      await page.locator('button[type="submit"]').click();

      // Always show success message regardless of email existence (security feature)
      await expect(
        page
          .locator('[data-testid="reset-success"]')
          .or(page.locator("text=Password reset email sent. Check your inbox (and spam folder)."))
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Rate Limiting", () => {
    test("should show rate limit error after too many requests", async ({ page }) => {
      // Make multiple password reset requests with 4s intervals to trigger rate limiting
      const maxRequests = 3; // Fewer attempts with longer delays

      for (let i = 0; i < maxRequests; i++) {
        await page.locator('input[type="email"]').fill(`test-rate-limit-${i}@example.com`);
        await page.locator('button[type="submit"]').click();

        // Wait 4 seconds between requests to trigger rate limit
        await page.waitForTimeout(4000);

        // Clear the form for next request
        await page.locator('input[type="email"]').clear();
      }

      // Final request should trigger rate limit
      await page.locator('input[type="email"]').fill("rate-limit-test@example.com");
      await page.locator('button[type="submit"]').click();

      // Check for rate limit error message
      await expect(page.locator('[data-testid="reset-error"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Navigation from Reset Password", () => {
    test("should navigate to login page when clicking back to login link", async ({ page }) => {
      const loginLink = page.locator("a").filter({ hasText: /Log in|Sign in|Back to login/i });
      await loginLink.click();

      await expect(page).toHaveURL(/\/login/);
    });
  });
});
