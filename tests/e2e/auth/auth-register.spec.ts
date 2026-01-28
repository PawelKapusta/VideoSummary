import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";

/**
 * Registration Tests
 *
 * These tests run WITHOUT a pre-authenticated session (storageState: undefined)
 * to verify the actual registration functionality from a fresh browser state.
 *
 * Note: Registration tests that actually create accounts should be used carefully
 * in E2E testing to avoid creating many test accounts. Consider:
 * - Using a test account that can be re-registered
 * - Cleaning up test accounts in teardown
 * - Using unique email addresses per test run
 */

test.describe("Registration Page", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoRegister();
  });

  test.describe("Page Load", () => {
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

  test.describe("Registration Form Validation", () => {
    test("should show error for empty email", async ({ page }) => {
      // Fill only password
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.first().fill("ValidPassword123!");

      // If there's a confirm password field
      if ((await passwordInputs.count()) > 1) {
        await passwordInputs.nth(1).fill("ValidPassword123!");
      }

      await page.locator('button[type="submit"]').click();

      // Email field should be invalid (custom validation, not HTML5 required attribute)
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });

    test("should show error for empty password", async ({ page }) => {
      await page.locator('input[type="email"]').fill("test@example.com");
      await page.locator('button[type="submit"]').click();

      // Password field should be invalid (custom validation, not HTML5 required attribute)
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    });

    test("should show error for invalid email format", async ({ page }) => {
      await page.locator('input[type="email"]').fill("invalid-email");
      await page.locator('input[type="password"]').first().fill("ValidPassword123!");
      await page.locator('button[type="submit"]').click();

      // Check for invalid email validation
      const emailInput = page.locator('input[type="email"]');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test("should validate password strength (if implemented)", async ({ page }) => {
      await page.locator('input[type="email"]').fill("test@example.com");
      await page.locator('input[type="password"]').first().fill("weak");
      await page.locator('button[type="submit"]').click();

      // Look for password strength/validation error
      // This might be a custom validation message
      const hasPasswordError = await page
        .locator("text=/password.*short|password.*weak|password.*character|minimum.*character/i")
        .isVisible()
        .catch(() => false);

      // If no custom validation, at least check the form wasn't submitted
      // or check for minlength attribute
      if (!hasPasswordError) {
        const passwordInput = page.locator('input[type="password"]').first();
        const minLength = await passwordInput.getAttribute("minlength");
        if (minLength) {
          expect(parseInt(minLength)).toBeGreaterThan(4);
        }
      }
    });

    test("should validate password confirmation match (if field exists)", async ({ page }) => {
      const passwordInputs = page.locator('input[type="password"]');
      const hasConfirmPassword = (await passwordInputs.count()) > 1;

      test.skip(!hasConfirmPassword, "No confirm password field");

      await page.locator('input[type="email"]').fill("test@example.com");
      await passwordInputs.first().fill("ValidPassword123!");
      await passwordInputs.nth(1).fill("DifferentPassword456!");
      await page.locator('button[type="submit"]').click();

      // Look for mismatch error
      await expect(page.locator("text=/password.*match|passwords.*match/i")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Registration Flow - Existing User", () => {
    test("should show error when registering with existing email", async ({ page }) => {
      const existingEmail = process.env.E2E_USERNAME;
      test.skip(!existingEmail, "E2E_USERNAME must be set");

      await page.locator('input[type="email"]').fill(existingEmail as string);
      await page.locator('input[type="password"]').first().fill("ValidPassword123!");

      // Fill confirm password if exists
      const passwordInputs = page.locator('input[type="password"]');
      if ((await passwordInputs.count()) > 1) {
        await passwordInputs.nth(1).fill("ValidPassword123!");
      }

      await page.locator('button[type="submit"]').click();

      // Wait for error message about existing user
      await expect(
        page
          .locator('[data-testid="register-error"]')
          .or(page.locator("text=/already registered|already exists|User already/i"))
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Navigation from Registration", () => {
    test("should navigate to login page when clicking login link", async ({ page }) => {
      const loginLink = page.locator("a").filter({ hasText: /Log in|Sign in/i });
      await loginLink.click();

      await expect(page).toHaveURL(/\/login/);
    });
  });

  // Note: Actual successful registration tests should be handled carefully
  // to avoid creating many test accounts. Consider:
  // - Running these tests only in specific environments
  // - Using unique emails with timestamps
  // - Having cleanup scripts
  test.describe.skip("Registration Flow - New User", () => {
    test("should register successfully with valid data", async ({ page }) => {
      // Generate unique email for this test run
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await page.locator('input[type="email"]').fill(uniqueEmail);
      await page.locator('input[type="password"]').first().fill("ValidPassword123!");

      // Fill confirm password if exists
      const passwordInputs = page.locator('input[type="password"]');
      if ((await passwordInputs.count()) > 1) {
        await passwordInputs.nth(1).fill("ValidPassword123!");
      }

      await page.locator('button[type="submit"]').click();

      // Either redirect to dashboard or show confirmation message
      await expect(
        page.locator("text=/check.*email|confirm.*email/i").or(page.locator('[data-testid*="dashboard"]'))
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
