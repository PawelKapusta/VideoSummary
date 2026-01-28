import { type Page, type Locator, expect } from "@playwright/test";

export class HiddenSummariesPage {
  readonly page: Page;

  // Main containers
  readonly hiddenSummariesView: Locator;

  // Header elements
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly backButton: Locator;

  // Summary list
  readonly summaryList: Locator;
  readonly summaryCards: Locator;

  // Bulk actions
  readonly unhideAllButton: Locator;
  readonly unhideAllDialog: Locator;
  readonly confirmUnhideAllButton: Locator;

  // Individual actions
  readonly unhideButtons: Locator;

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
    this.hiddenSummariesView = page.locator('[data-testid="hidden-summaries-view"]');

    // Header elements
    this.pageTitle = page
      .locator('[data-testid="hidden-summaries-view"] h1, [data-testid="hidden-summaries-view"] [data-testid*="title"]')
      .filter({ hasText: /Hidden|hidden/i });
    this.pageDescription = page
      .locator('[data-testid="hidden-summaries-view"] p')
      .filter({ hasText: /restore|hidden/i });
    this.backButton = page.locator('[data-testid="hidden-summaries-view"] button').filter({ hasText: /back|Back|←/i });

    // Summary list
    this.summaryList = page
      .locator('[data-testid="hidden-summaries-view"]')
      .locator('[data-testid="summary-list"], .summary-list')
      .first();
    this.summaryCards = page.locator('[data-testid="hidden-summaries-view"] [data-testid="summary-card"]');

    // Bulk actions
    this.unhideAllButton = page
      .locator('[data-testid="hidden-summaries-view"] button')
      .filter({ hasText: /unhide all|Unhide All/i });
    this.unhideAllDialog = page
      .locator('[role="dialog"], [data-testid*="dialog"]')
      .filter({ hasText: /unhide.*all|restore.*all/i });
    this.confirmUnhideAllButton = page
      .locator('[role="dialog"] button')
      .filter({ hasText: /confirm|yes|unhide|restore/i });

    // Individual actions
    this.unhideButtons = page
      .locator('[data-testid="hidden-summaries-view"] button')
      .filter({ hasText: /unhide|restore/i });

    // Empty state
    this.emptyState = page.locator('[data-testid="empty-state"]');

    // Loading states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.appLoader = page.locator('[data-testid="app-loader"]');

    // Error states
    this.errorState = page.locator('[data-testid="error-state"]');
  }

  async goto() {
    await this.page.goto("/hidden");
  }

  async expectHiddenSummariesPageLoaded() {
    await expect(this.hiddenSummariesView).toBeVisible();
    await expect(this.pageTitle).toBeVisible();
  }

  async expectBackButtonVisible() {
    await expect(this.backButton).toBeVisible();
  }

  async clickBackButton() {
    await expect(this.backButton).toBeVisible();
    await this.backButton.click();
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

  async getHiddenSummaryCount(): Promise<number> {
    return await this.summaryCards.count();
  }

  async expectUnhideAllButtonVisible() {
    await expect(this.unhideAllButton).toBeVisible();
  }

  async clickUnhideAllButton() {
    await expect(this.unhideAllButton).toBeVisible();
    await this.unhideAllButton.click();
  }

  async expectUnhideAllDialogVisible() {
    await expect(this.unhideAllDialog).toBeVisible();
  }

  async confirmUnhideAll() {
    await expect(this.confirmUnhideAllButton).toBeVisible();
    await this.confirmUnhideAllButton.click();
  }

  async unhideAllSummaries() {
    await this.clickUnhideAllButton();
    await this.expectUnhideAllDialogVisible();
    await this.confirmUnhideAll();
  }

  async unhideSummary(index = 0) {
    const summaryCard = this.summaryCards.nth(index);
    await expect(summaryCard).toBeVisible();

    const unhideButton = summaryCard.locator("button").filter({ hasText: /unhide|restore/i });
    await expect(unhideButton).toBeVisible();
    await unhideButton.click();

    // Handle confirmation if present
    const confirmButton = this.page.locator("button").filter({ hasText: /confirm|yes|unhide|restore/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async expectSummaryCardContainsText(index: number, text: string) {
    const card = this.summaryCards.nth(index);
    await expect(card).toContainText(text);
  }

  async expectOnHiddenSummariesPage() {
    await expect(this.page).toHaveURL(/\/hidden/);
    await this.expectHiddenSummariesPageLoaded();
  }

  // Helper methods for common operations
  async waitForSummariesToLoad() {
    await expect(this.summaryList.or(this.emptyState)).toBeVisible();
  }

  async expectNoHiddenSummaries() {
    await expect(this.summaryCards).toHaveCount(0);
    await expect(this.emptyState).toBeVisible();
  }
}
