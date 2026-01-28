import { test, expect } from "@playwright/test";

test.describe("Registration Page - Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test.skip("should show error for empty email", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInputs = page.locator('input[type="password"]');
    const submitButton = page.getByRole("button", { name: /sign up/i });

    // Fill email first to enable button, then clear it to trigger validation
    await emailInput.fill("temp@example.com");
    await passwordInputs.first().fill("ValidPassword123!");

    // If there's a confirm password field
    if ((await passwordInputs.count()) > 1) {
      await passwordInputs.nth(1).fill("ValidPassword123!");
    }

    // Wait for form validation to complete
    await page.waitForTimeout(500);

    // Button should be enabled when all fields are valid
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    // Clear email and trigger blur to show validation error
    await emailInput.clear();
    await emailInput.blur();
    
    // Wait for validation to process
    await page.waitForTimeout(200);

    // Button should be disabled when email is empty
    await expect(submitButton).toBeDisabled();

    // Email field should be invalid
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

  test.skip("should show error for invalid email format", async ({ page }) => {
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
});
