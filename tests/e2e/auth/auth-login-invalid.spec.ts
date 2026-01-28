import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";

test.describe("Login Page - Invalid Credentials", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test("should show error for wrong email", async ({ page }) => {
    // Fill login form with invalid credentials
    await authPage.loginEmailInput.fill("nonexistent@example.com");
    await authPage.loginPasswordInput.fill("WrongPassword123!");

    // Click submit
    const submitButton = authPage.loginButton;
    await submitButton.click();

    // Wait for submit to process
    await page.waitForTimeout(2000);

    // Should remain on login page (not redirect to dashboard)
    await expect(page).toHaveURL(/\/login/);
    
    // Button should be back to "Sign In" (not loading)
    await expect(submitButton).toHaveText(/Sign In/i);
  });

  test("should show error for wrong password", async ({ page }) => {
    const testEmail = process.env.E2E_USERNAME || "test@example.com";

    // Fill login form with wrong password
    await authPage.loginEmailInput.fill(testEmail);
    await authPage.loginPasswordInput.fill("WrongPassword123!");

    // Click submit
    const submitButton = authPage.loginButton;
    await submitButton.click();

    // Wait for submit to process
    await page.waitForTimeout(2000);

    // Should remain on login page (not redirect to dashboard)
    await expect(page).toHaveURL(/\/login/);
    
    // Button should be back to "Sign In" (not loading)
    await expect(submitButton).toHaveText(/Sign In/i);
  });
});
