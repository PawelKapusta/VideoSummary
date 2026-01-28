import { type Page, type Locator, expect } from "@playwright/test";

export class ProfilePage {
  readonly page: Page;

  // Main containers
  readonly profileView: Locator;

  // User header
  readonly userHeader: Locator;
  readonly userAvatar: Locator;
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly joinDate: Locator;

  // Stats section
  readonly statsSection: Locator;
  readonly totalSummariesStat: Locator;
  readonly totalChannelsStat: Locator;
  readonly thisMonthSummariesStat: Locator;

  // Subscription section
  readonly subscriptionSection: Locator;
  readonly subscriptionTable: Locator;
  readonly channelRows: Locator;
  readonly addChannelButton: Locator;

  // Add channel dialog
  readonly addChannelDialog: Locator;
  readonly channelUrlInput: Locator;
  readonly addChannelSubmitButton: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly appLoader: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main containers
    this.profileView = page.locator('[data-testid="profile-view"]');

    // User header
    this.userHeader = page.locator('[data-testid="user-header"]');
    this.userAvatar = page.locator(
      '[data-testid="user-header"] img, [data-testid="user-header"] [data-testid*="avatar"]'
    );
    this.userName = page.locator('[data-testid="user-header"] h2, [data-testid="user-header"] [data-testid*="name"]');
    this.userEmail = page.locator('[data-testid="user-header"] p').filter({ hasText: "@" });
    this.joinDate = page.locator('[data-testid="user-header"]').locator("text=/Joined|Member since/i");

    // Stats section
    this.statsSection = page.locator('[data-testid="stats-section"]');
    this.totalSummariesStat = page
      .locator('[data-testid="stats-section"]')
      .locator("text=/Summaries|Generated/i")
      .locator("..")
      .locator("div")
      .filter({ hasText: /^\d+$/ });
    this.totalChannelsStat = page
      .locator('[data-testid="stats-section"]')
      .locator("text=/Channels/i")
      .locator("..")
      .locator("div")
      .filter({ hasText: /^\d+$/ });
    this.thisMonthSummariesStat = page
      .locator('[data-testid="stats-section"]')
      .locator("text=/This month|Monthly/i")
      .locator("..")
      .locator("div")
      .filter({ hasText: /^\d+$/ });

    // Subscription section
    this.subscriptionSection = page.locator('[data-testid="subscription-section"]');
    this.subscriptionTable = page.locator('[data-testid="subscription-table"]');
    this.channelRows = page.locator('[data-testid="channel-row"]');
    this.addChannelButton = page
      .locator('[data-testid="subscription-section"] button')
      .filter({ hasText: /Add Channel/i });

    // Add channel dialog
    this.addChannelDialog = page.locator('[data-testid="add-channel-dialog"]');
    this.channelUrlInput = page.locator(
      '[data-testid="add-channel-dialog"] input[type="url"], [data-testid="add-channel-dialog"] input[placeholder*="youtube"]'
    );
    this.addChannelSubmitButton = page
      .locator('[data-testid="add-channel-dialog"] button[type="submit"], [data-testid="add-channel-dialog"] button')
      .filter({ hasText: /Add|Subscribe/i });

    // Loading states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.appLoader = page.locator('[data-testid="app-loader"]');
  }

  async goto() {
    await this.page.goto("/profile");
  }

  async expectProfilePageLoaded() {
    await expect(this.profileView).toBeVisible();
    await expect(this.userHeader).toBeVisible();
    await expect(this.statsSection).toBeVisible();
  }

  async expectUserHeaderVisible() {
    await expect(this.userHeader).toBeVisible();
  }

  async expectUserName(name: string) {
    await expect(this.userName).toContainText(name);
  }

  async expectUserEmail(email: string) {
    await expect(this.userEmail).toContainText(email);
  }

  async expectStatsSectionVisible() {
    await expect(this.statsSection).toBeVisible();
  }

  async getTotalSummariesCount(): Promise<number> {
    const text = await this.totalSummariesStat.textContent();
    return parseInt(text || "0");
  }

  async getTotalChannelsCount(): Promise<number> {
    const text = await this.totalChannelsStat.textContent();
    return parseInt(text || "0");
  }

  async getThisMonthSummariesCount(): Promise<number> {
    const text = await this.thisMonthSummariesStat.textContent();
    return parseInt(text || "0");
  }

  async expectSubscriptionSectionVisible() {
    await expect(this.subscriptionSection).toBeVisible();
  }

  async getChannelCount(): Promise<number> {
    return await this.channelRows.count();
  }

  async expectAddChannelButtonVisible() {
    await expect(this.addChannelButton).toBeVisible();
  }

  async clickAddChannelButton() {
    await expect(this.addChannelButton).toBeVisible();
    await this.addChannelButton.click();
  }

  async expectAddChannelDialogVisible() {
    await expect(this.addChannelDialog).toBeVisible();
  }

  async fillChannelUrl(url: string) {
    await expect(this.channelUrlInput).toBeVisible();
    await this.channelUrlInput.fill(url);
  }

  async submitAddChannel() {
    await expect(this.addChannelSubmitButton).toBeVisible();
    await this.addChannelSubmitButton.click();
  }

  async addChannel(url: string) {
    await this.clickAddChannelButton();
    await this.expectAddChannelDialogVisible();
    await this.fillChannelUrl(url);
    await this.submitAddChannel();
  }

  async expectChannelRowExists(channelName: string) {
    const channelRow = this.channelRows.filter({ hasText: channelName });
    await expect(channelRow).toBeVisible();
  }

  async removeChannel(channelName: string) {
    const channelRow = this.channelRows.filter({ hasText: channelName });
    const removeButton = channelRow.locator("button").filter({ hasText: /remove|delete/i });
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    // Handle confirmation dialog if present
    const confirmButton = this.page.locator("button").filter({ hasText: /confirm|yes|delete/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async expectLoadingState() {
    await expect(this.appLoader).toBeVisible();
  }

  async waitForLoadingToComplete() {
    await expect(this.appLoader).not.toBeVisible();
  }

  async expectOnProfilePage() {
    await expect(this.page).toHaveURL(/\/profile/);
    await this.expectProfilePageLoaded();
  }

  async expectOnPage() {
    await this.expectOnProfilePage();
  }
}
