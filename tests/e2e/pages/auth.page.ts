import { type Page, type Locator, expect } from "@playwright/test";

export class AuthPage {
  readonly page: Page;

  // Login form
  readonly loginForm: Locator;
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly loginError: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  // Register form
  readonly registerForm: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerConfirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly registerError: Locator;
  readonly loginLinkFromRegister: Locator;

  // Reset password form
  readonly resetPasswordForm: Locator;
  readonly resetEmailInput: Locator;
  readonly resetButton: Locator;
  readonly resetSuccessMessage: Locator;
  readonly backToLoginLink: Locator;

  // Common elements
  readonly pageTitle: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // Login form elements
    this.loginForm = page.locator("form").filter({ hasText: /Log in|Sign In/i });
    this.loginEmailInput = page.locator('input[type="email"]').first();
    this.loginPasswordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.locator('button[type="submit"]').filter({ hasText: /Log in|Sign In/i });
    this.loginError = page.locator('[data-testid="login-error"]');
    this.forgotPasswordLink = page.locator("a").filter({ hasText: "Forgot your password?" });
    this.registerLink = page.locator("a").filter({ hasText: "Create one now" });

    // Register form elements
    this.registerForm = page.locator("form").filter({ hasText: "Sign up" });
    this.registerEmailInput = page.locator('input[type="email"]').nth(1);
    this.registerPasswordInput = page.locator('input[type="password"]').nth(1);
    this.registerConfirmPasswordInput = page.locator('input[type="password"]').nth(2);
    this.registerButton = page.locator('button[type="submit"]').filter({ hasText: "Sign up" });
    this.registerError = page.locator('[data-testid="register-error"]');
    this.loginLinkFromRegister = page.locator("a").filter({ hasText: "Log in" });

    // Reset password form elements
    this.resetPasswordForm = page.locator("form").filter({ hasText: "Reset password" });
    this.resetEmailInput = page.locator('input[type="email"]').first();
    this.resetButton = page.locator('button[type="submit"]').filter({ hasText: "Send reset link" });
    this.resetSuccessMessage = page.locator('[data-testid="reset-success"]');
    this.backToLoginLink = page.locator("a").filter({ hasText: "Back to login" });

    // Common elements
    this.pageTitle = page.locator("h1");
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  }

  async gotoLogin() {
    await this.page.goto("/login");
  }

  async gotoRegister() {
    await this.page.goto("/signup");
  }

  async gotoResetPassword() {
    await this.page.goto("/reset-password");
  }

  async expectLoginPageLoaded() {
    await expect(this.loginForm).toBeVisible();
    await expect(this.pageTitle).toContainText("Log in");
  }

  async expectRegisterPageLoaded() {
    await expect(this.registerForm).toBeVisible();
    await expect(this.pageTitle).toContainText("Sign up");
  }

  async expectResetPasswordPageLoaded() {
    await expect(this.resetPasswordForm).toBeVisible();
    await expect(this.pageTitle).toContainText("Reset password");
  }

  async login(email: string, password: string) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginButton.click();
  }

  async register(email: string, password: string) {
    await this.registerEmailInput.fill(email);
    await this.registerPasswordInput.fill(password);
    await this.registerConfirmPasswordInput.fill(password);
    await this.registerButton.click();
  }

  async requestPasswordReset(email: string) {
    await this.resetEmailInput.fill(email);
    await this.resetButton.click();
  }

  async expectLoginSuccess() {
    // Wait for redirect to dashboard
    await this.page.waitForURL("/dashboard");
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async expectRegisterSuccess() {
    // Wait for redirect to dashboard after registration
    await this.page.waitForURL("/dashboard");
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async expectResetPasswordSuccess() {
    await expect(this.resetSuccessMessage).toBeVisible();
    await expect(this.resetSuccessMessage).toContainText("Check your email");
  }

  async expectLoginError(message: string) {
    await expect(this.loginError).toBeVisible();
    await expect(this.loginError).toContainText(message);
  }

  async expectRegisterError(message: string) {
    await expect(this.registerError).toBeVisible();
    await expect(this.registerError).toContainText(message);
  }

  async clickRegisterLink() {
    await this.registerLink.click();
  }

  async clickLoginLink() {
    await this.loginLinkFromRegister.click();
  }

  async clickForgotPasswordLink() {
    await this.forgotPasswordLink.click();
  }

  async clickBackToLoginLink() {
    await this.backToLoginLink.click();
  }

  async expectLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async waitForLoadingToComplete() {
    await expect(this.loadingSpinner).not.toBeVisible();
  }

  async expectValidationError(field: "email" | "password" | "confirmPassword", message: string) {
    const fieldSelector =
      field === "email"
        ? 'input[type="email"]'
        : field === "password"
          ? 'input[type="password"]:not([placeholder*="confirm"])'
          : 'input[placeholder*="confirm"]';

    const errorLocator = this.page
      .locator(`${fieldSelector}`)
      .locator("xpath=following-sibling::*")
      .filter({ hasText: message });
    await expect(errorLocator).toBeVisible();
  }

  async expectFieldRequired(field: "email" | "password" | "confirmPassword") {
    const fieldSelector =
      field === "email"
        ? 'input[type="email"]'
        : field === "password"
          ? 'input[type="password"]:not([placeholder*="confirm"])'
          : 'input[placeholder*="confirm"]';

    await expect(this.page.locator(fieldSelector)).toHaveAttribute("required");
  }

  async expectPasswordStrengthIndicator() {
    // Assuming there's a password strength indicator
    const strengthIndicator = this.page.locator('[data-testid="password-strength"]');
    await expect(strengthIndicator).toBeVisible();
  }

  async expectEmailFormatValidation() {
    await this.loginEmailInput.fill("invalid-email");
    await this.loginEmailInput.blur();
    await expect(this.page.locator("text=Please enter a valid email")).toBeVisible();
  }
}
