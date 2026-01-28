import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";

test.describe("Login Page - Navigation", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test("should navigate to registration page when clicking sign up link", async ({ page }) => {
    await authPage.clickRegisterLink();

    await expect(page).toHaveURL(/\/signup/);
  });

  test("should navigate to forgot password page when clicking forgot password link", async ({ page }) => {
    await authPage.clickForgotPasswordLink();

    await expect(page).toHaveURL(/\/reset-password|\/forgot-password/);
  });
});
