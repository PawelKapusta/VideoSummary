import { test, expect } from "@playwright/test";

test.describe("Registration Page - Existing User", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test.fixme("should show error when registering with existing email", async ({ page }) => {
    const existingEmail = process.env.E2E_USERNAME;
    test.skip(!existingEmail, "E2E_USERNAME must be set");

    const password = "ValidPassword123!";
    const emailInput = page.locator('input[type="email"]');
    const passwordInputs = page.locator('input[type="password"]');
    const submitButton = page.getByRole("button", { name: /sign up/i });

    // Fill all fields with valid data and trigger blur
    await emailInput.fill(existingEmail as string);
    await emailInput.blur();
    await page.waitForTimeout(200);

    await passwordInputs.first().fill(password);
    await passwordInputs.first().blur();
    await page.waitForTimeout(200);

    await passwordInputs.nth(1).fill(password); // Confirm password must match
    await passwordInputs.nth(1).blur();

    // Wait longer for validation
    await page.waitForTimeout(1000);

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
