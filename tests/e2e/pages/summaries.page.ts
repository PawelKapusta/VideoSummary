import { type Page, type Locator, expect } from "@playwright/test";

export class SummariesPage {
  readonly page: Page;

  // Main containers
  readonly summariesView: Locator;

  // Header elements
  readonly summariesTitle: Locator;
  readonly summariesDescription: Locator;

  // Filter components
  readonly filterPanel: Locator;
  readonly filterBar: Locator;

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
    this.summariesView = page.locator('[data-testid="summaries-view"]');

    // Header elements
    this.summariesTitle = page.locator('[data-testid="summaries-view"] h1').filter({ hasText: /Summaries|summaries/i });
    this.summariesDescription = page.locator('[data-testid="summaries-view"] p').filter({ hasText: /Browse|manage|filter/i });

    // Filter components
    this.filterPanel = page.locator('[data-testid="filter-panel"]');
    this.filterBar = page.locator('[data-testid="filter-bar"]');

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
    await this.page.goto("/summaries");
  }

  async expectSummariesPageLoaded() {
    await expect(this.summariesView).toBeVisible();
    await expect(this.summariesTitle).toBeVisible();
    await expect(this.summariesDescription).toBeVisible();
  }

  async expectFilterPanelVisible() {
    await expect(this.filterPanel).toBeVisible();
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

  async clickSummaryCard(index: number = 0) {
    const card = this.summaryCards.nth(index);
    await expect(card).toBeVisible();
    await card.click();
  }

  async expectSummaryCardContainsText(index: number, text: string) {
    const card = this.summaryCards.nth(index);
    await expect(card).toContainText(text);
  }

  async rateSummary(index: number, rating: boolean | null) {
    const card = this.summaryCards.nth(index);
    await expect(card).toBeVisible();

    let ratingButton: Locator;
    if (rating === true) {
      ratingButton = card.locator('button').filter({ hasText: /thumbs up|like|positive/i });
    } else if (rating === false) {
      ratingButton = card.locator('button').filter({ hasText: /thumbs down|dislike|negative/i });
    } else {
      ratingButton = card.locator('button').filter({ hasText: /neutral|clear/i });
    }

    await expect(ratingButton).toBeVisible();
    await ratingButton.click();
  }

  async hideSummary(index: number) {
    const card = this.summaryCards.nth(index);
    await expect(card).toBeVisible();

    const hideButton = card.locator('button').filter({ hasText: /hide|Hide/i });
    await expect(hideButton).toBeVisible();
    await hideButton.click();

    // Handle confirmation if present
    const confirmButton = this.page.locator('button').filter({ hasText: /confirm|yes|hide/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async regenerateSummary(index: number) {
    const card = this.summaryCards.nth(index);
    await expect(card).toBeVisible();

    const regenerateButton = card.locator('button').filter({ hasText: /regenerate|Regenerate/i });
    await expect(regenerateButton).toBeVisible();
    await regenerateButton.click();
  }

  async expectOnSummariesPage() {
    await expect(this.page).toHaveURL(/\/summaries/);
    await this.expectSummariesPageLoaded();
  }

  // Filter methods
  async filterByChannel(channelName: string) {
    const channelSelect = this.filterBar.locator('select, [role="combobox"]').first();
    await expect(channelSelect).toBeVisible();
    await channelSelect.selectOption({ label: channelName });
  }

  async filterByStatus(status: string) {
    const statusSelect = this.filterBar.locator('select, [role="combobox"]').nth(1);
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption({ label: status });
  }

  async searchSummaries(searchTerm: string) {
    const searchInput = this.filterBar.locator('input[type="text"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill(searchTerm);
  }

  // Date range filter methods
  async setDateRange(fromDate: string, toDate: string) {
    const dateRangeFilter = this.filterBar.locator('[data-testid="date-range-filter"]');
    await expect(dateRangeFilter).toBeVisible();

    const fromInput = dateRangeFilter.locator('input[type="date"]').first();
    const toInput = dateRangeFilter.locator('input[type="date"]').nth(1);

    await fromInput.fill(fromDate);
    await toInput.fill(toDate);
  }
}