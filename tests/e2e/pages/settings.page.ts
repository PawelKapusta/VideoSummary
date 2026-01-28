import { type Page, type Locator, expect } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;

  // Main containers
  readonly settingsView: Locator;

  // Header elements
  readonly settingsTitle: Locator;
  readonly settingsDescription: Locator;

  // Profile settings section
  readonly profileSection: Locator;
  readonly usernameInput: Locator;
  readonly usernameEditButton: Locator;
  readonly usernameSaveButton: Locator;

  // Hidden summaries section
  readonly hiddenSummariesSection: Locator;

  // Account actions
  readonly logoutButton: Locator;
  readonly deleteAccountButton: Locator;

  // Dialogs/Modals
  readonly deleteAccountDialog: Locator;
  readonly confirmDeleteButton: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly appLoader: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main containers
    this.settingsView = page.locator('[data-testid="settings-view"]');

    // Header elements
    this.settingsTitle = page.locator('[data-testid="settings-view"] h1').filter({ hasText: "Settings" });
    this.settingsDescription = page
      .locator('[data-testid="settings-view"] p')
      .filter({ hasText: /manage|account|preferences/i });

    // Profile settings section
    this.profileSection = page
      .locator('[data-testid="settings-view"]')
      .locator("text=/Profile|Account/i")
      .locator("..")
      .locator("..");
    this.usernameInput = page
      .locator(
        '[data-testid="settings-view"] input[type="text"], [data-testid="settings-view"] input[placeholder*="username"]'
      )
      .first();
    this.usernameEditButton = page.locator('[data-testid="settings-view"] button').filter({ hasText: /edit|Edit/i });
    this.usernameSaveButton = page.locator('[data-testid="settings-view"] button').filter({ hasText: /save|Save/i });

    // Hidden summaries section
    this.hiddenSummariesSection = page.locator('[data-testid="hidden-summaries-section"]');

    // Account actions
    this.logoutButton = page.locator('[data-testid="settings-view"] button').filter({ hasText: /logout|sign out/i });
    this.deleteAccountButton = page
      .locator('[data-testid="settings-view"] button')
      .filter({ hasText: /delete.*account|remove.*account/i });

    // Dialogs/Modals
    this.deleteAccountDialog = page
      .locator('[role="dialog"], [data-testid*="dialog"]')
      .filter({ hasText: /delete.*account|remove.*account/i });
    this.confirmDeleteButton = page
      .locator('[role="dialog"] button')
      .filter({ hasText: /confirm.*delete|delete.*account|yes.*delete/i });

    // Loading states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.appLoader = page.locator('[data-testid="app-loader"]');
  }

  async goto() {
    await this.page.goto("/settings");
  }

  async expectSettingsPageLoaded() {
    await expect(this.settingsView).toBeVisible();
    await expect(this.settingsTitle).toBeVisible();
    await expect(this.settingsDescription).toBeVisible();
  }

  async expectProfileSectionVisible() {
    await expect(this.profileSection).toBeVisible();
  }

  async expectUsernameInputVisible() {
    await expect(this.usernameInput).toBeVisible();
  }

  async getCurrentUsername(): Promise<string> {
    return await this.usernameInput.inputValue();
  }

  async editUsername() {
    if (await this.usernameEditButton.isVisible()) {
      await this.usernameEditButton.click();
    }
  }

  async setUsername(username: string) {
    await expect(this.usernameInput).toBeVisible();
    await this.usernameInput.fill(username);
  }

  async saveUsername() {
    if (await this.usernameSaveButton.isVisible()) {
      await this.usernameSaveButton.click();
    } else {
      // If no save button, username might auto-save on blur
      await this.usernameInput.blur();
    }
  }

  async updateUsername(newUsername: string) {
    await this.editUsername();
    await this.setUsername(newUsername);
    await this.saveUsername();
  }

  async expectHiddenSummariesSectionVisible() {
    await expect(this.hiddenSummariesSection).toBeVisible();
  }

  async expectLogoutButtonVisible() {
    await expect(this.logoutButton).toBeVisible();
  }

  async clickLogout() {
    await expect(this.logoutButton).toBeVisible();
    await this.logoutButton.click();
  }

  async expectDeleteAccountButtonVisible() {
    await expect(this.deleteAccountButton).toBeVisible();
  }

  async clickDeleteAccount() {
    await expect(this.deleteAccountButton).toBeVisible();
    await this.deleteAccountButton.click();
  }

  async expectDeleteAccountDialogVisible() {
    await expect(this.deleteAccountDialog).toBeVisible();
  }

  async confirmDeleteAccount() {
    await expect(this.confirmDeleteButton).toBeVisible();
    await this.confirmDeleteButton.click();
  }

  async deleteAccount() {
    await this.clickDeleteAccount();
    await this.expectDeleteAccountDialogVisible();
    await this.confirmDeleteAccount();
  }

  async expectLoadingState() {
    await expect(this.appLoader).toBeVisible();
  }

  async waitForLoadingToComplete() {
    await expect(this.appLoader).not.toBeVisible();
  }

  async expectOnSettingsPage() {
    await expect(this.page).toHaveURL(/\/settings/);
    await this.expectSettingsPageLoaded();
  }

  async expectOnPage() {
    await this.expectOnSettingsPage();
  }

  // Helper methods for common settings operations
  async logout() {
    await this.clickLogout();
    // Wait for redirect to login or home page
    await this.page.waitForURL(/\/login|\/$/, { timeout: 10000 });
  }
}
