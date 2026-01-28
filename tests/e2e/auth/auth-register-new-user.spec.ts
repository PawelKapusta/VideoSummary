import { test, expect } from "@playwright/test";

test.describe("Registration Page - New User", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test.skip("should register successfully with valid data", async ({ page }) => {
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
