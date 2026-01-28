import { type Page, type Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;

  // Main containers
  readonly dashboardView: Locator;
  readonly aiDisclaimer: Locator;

  // Header elements
  readonly dashboardTitle: Locator;
  readonly dashboardDescription: Locator;

  // Stats section (if any)
  readonly statsSection: Locator;

  // Summary list
  readonly summaryList: Locator;
  readonly summaryCards: Locator;

  // Empty state
  readonly emptyState: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly appLoader: Locator;

  // Error states
  readonly errorState: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main containers
    this.dashboardView = page.locator('[data-testid="dashboard-view"]');
    this.aiDisclaimer = page.locator('[data-testid="dashboard-view"] [data-testid="ai-disclaimer"]');

    // Header elements
    this.dashboardTitle = page.locator('[data-testid="dashboard-view"] h1').filter({ hasText: "Dashboard" });
    this.dashboardDescription = page
      .locator('[data-testid="dashboard-view"] p')
      .filter({ hasText: /Track your video insights/ });

    // Stats section (placeholder - add if dashboard has stats)
    this.statsSection = page.locator('[data-testid="stats-section"]');

    // Summary list
    this.summaryList = page.locator('[data-testid="summary-list"]');
    this.summaryCards = page.locator('[data-testid="summary-card"]');

    // Empty state
    this.emptyState = page.locator('[data-testid="empty-state"]');

    // Loading states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.appLoader = page.locator('[data-testid="app-loader"]');

    // Error states
    this.errorState = page.locator('[data-testid="error-state"]');
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async expectDashboardLoaded() {
    await expect(this.dashboardView).toBeVisible();
    await expect(this.dashboardTitle).toBeVisible();
    await expect(this.dashboardDescription).toBeVisible();
  }

  async expectAiDisclaimerVisible() {
    await expect(this.aiDisclaimer).toBeVisible();
  }

  async expectSummaryListVisible() {
    await expect(this.summaryList).toBeVisible();
  }

  async expectEmptyStateVisible() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectLoadingState() {
    await expect(this.appLoader).toBeVisible();
  }

  async waitForLoadingToComplete() {
    await expect(this.appLoader).not.toBeVisible();
  }

  async expectErrorStateVisible() {
    await expect(this.errorState).toBeVisible();
  }

  async getSummaryCount(): Promise<number> {
    return await this.summaryCards.count();
  }

  async clickSummaryCard(index = 0) {
    const card = this.summaryCards.nth(index);
    await expect(card).toBeVisible();
    await card.click();
  }

  async expectSummaryCardContainsText(index: number, text: string) {
    const card = this.summaryCards.nth(index);
    await expect(card).toContainText(text);
  }

  async expectOnDashboardPage() {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await this.expectDashboardLoaded();
  }

  async expectOnPage() {
    await this.expectOnDashboardPage();
  }
}
