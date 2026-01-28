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
      const emailInput = page.locator('input[type="email"]');
      const passwordInputs = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      // Fill email first to enable button, then clear it to trigger validation
      await emailInput.fill("temp@example.com");
      await passwordInputs.first().fill("ValidPassword123!");

      // If there's a confirm password field
      if ((await passwordInputs.count()) > 1) {
        await passwordInputs.nth(1).fill("ValidPassword123!");
      }

      await expect(submitButton).toBeEnabled(); // Button should be enabled when email is filled

      await emailInput.clear();
      await expect(submitButton).toBeDisabled(); // Button should be disabled when email is empty

      // Test blur validation: click on email input and then click away
      await emailInput.click();
      const passwordInput = passwordInputs.first();
      await passwordInput.click();

      // Email field should be invalid (custom validation, not HTML5 required attribute)
      await expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });

    test("should show error for empty password", async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const passwordInputs = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      await emailInput.fill("test@example.com");
      const passwordInput = passwordInputs.first();
      await passwordInput.fill("SomePassword123!");

      await passwordInput.clear();
      await expect(submitButton).toBeDisabled(); // Button should be disabled when password is empty

      // Test blur validation: click on password input and then click away
      await passwordInput.click();
      await emailInput.click();

      // Password field should be invalid (custom validation, not HTML5 required attribute)
      await expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    });

    test("should show error for invalid email format", async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]');

      await emailInput.fill("invalid-email");
      await passwordInput.fill("ValidPassword123!");

      // Test blur validation: click on email input and then click away
      await emailInput.click();
      await passwordInput.click();

      // Email field should be invalid due to incorrect format
      await expect(emailInput).toHaveAttribute("aria-invalid", "true");

      // Submit button should be disabled for invalid email
      await expect(submitButton).toBeDisabled();
    });

    test("should validate password strength (if implemented)", async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]');

      await emailInput.fill("test@example.com");
      await passwordInput.fill("weak");

      // Test blur validation: click on password input and then click away
      await passwordInput.click();
      await emailInput.click();

      // Password field should be invalid due to weak password
      await expect(passwordInput).toHaveAttribute("aria-invalid", "true");

      // Submit button should be disabled for weak password
      await expect(submitButton).toBeDisabled();
    });

    test("should validate password confirmation match (if field exists)", async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const passwordInputs = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');
      const hasConfirmPassword = (await passwordInputs.count()) > 1;

      test.skip(!hasConfirmPassword, "No confirm password field");

      await emailInput.fill("test@example.com");
      await passwordInputs.first().fill("ValidPassword123!");
      await passwordInputs.nth(1).fill("DifferentPassword456!");

      // Test blur validation: click on confirm password and then click away
      await passwordInputs.nth(1).click();
      await emailInput.click();

      // Confirm password field should be invalid due to mismatch
      await expect(passwordInputs.nth(1)).toHaveAttribute("aria-invalid", "true");

      // Submit button should be disabled when passwords don't match
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe("Registration Flow - Existing User", () => {
    test("should show error when registering with existing email", async ({ page }) => {
      const existingEmail = process.env.E2E_USERNAME;
      test.skip(!existingEmail, "E2E_USERNAME must be set");

      const password = "ValidPassword123!";
      const emailInput = page.locator('input[type="email"]');
      const passwordInputs = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      // Fill all fields with valid data
      await emailInput.fill(existingEmail as string);
      await passwordInputs.first().fill(password);
      await passwordInputs.nth(1).fill(password); // Confirm password must match

      // Wait for form validation to complete and button to be enabled
      await expect(submitButton).toBeEnabled({ timeout: 10000 });

      // Click submit button
      await submitButton.click();

      // Wait for error message about existing user
      const errorMessage = page.locator('[data-testid="form-error-message"]');

      // First wait for the element to be in DOM
      await errorMessage.waitFor({ state: "attached", timeout: 10000 });

      // Then wait for it to be visible (handles animation)
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      // Finally verify the exact error text
      await expect(errorMessage).toContainText("An account with this email already exists. Please login.");
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
  test.describe("Registration Flow - New User", () => {
    test("should register successfully with valid data", async ({ page }) => {
      // Generate unique email for this test run
      const uniqueEmail = `test-${Date.now()}@example.com`;
      const password = "ValidPassword123!";

      const emailInput = page.locator('input[type="email"]');
      const passwordInputs = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      // Fill all required fields
      await emailInput.fill(uniqueEmail);
      await passwordInputs.first().fill(password);
      await passwordInputs.nth(1).fill(password); // Confirm password must match

      // Wait for form validation to complete and button to be enabled
      await expect(submitButton).toBeEnabled({ timeout: 10000 });

      // Click submit button
      await submitButton.click();

      // Either redirect to dashboard or show confirmation message
      await expect(
        page.locator("text=/check.*email|confirm.*email/i").or(page.locator('[data-testid*="dashboard"]'))
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
