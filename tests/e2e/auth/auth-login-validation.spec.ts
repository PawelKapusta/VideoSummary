import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";

test.describe("Login Page - Form Validation", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test("should show error for empty email", async ({ page }) => {
    // Fill only password
    await authPage.loginPasswordInput.fill("somepassword");
    await authPage.loginButton.click();

    // Email field should be invalid (HTML5 validation or custom error)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("required");
  });

  test("should show error for empty password", async ({ page }) => {
    // Fill email, leave password empty, try to submit
    await authPage.loginEmailInput.fill("test@example.com");
    
    // Don't fill password - leave it empty
    
    // Try to submit
    await authPage.loginButton.click();

    // Wait a bit
    await page.waitForTimeout(500);

    // Should still be on login page (validation blocked submit)
    await expect(page).toHaveURL(/\/login/);
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
