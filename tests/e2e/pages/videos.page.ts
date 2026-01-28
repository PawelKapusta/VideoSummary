import { type Page, type Locator, expect } from "@playwright/test";

export class VideosPage {
  readonly page: Page;

  // Main containers
  readonly videosView: Locator;

  // Header elements
  readonly videosTitle: Locator;
  readonly videosDescription: Locator;

  // Filter components
  readonly videosFilterBar: Locator;
  readonly filterBar: Locator;

  // Video grid/list
  readonly videosGrid: Locator;
  readonly videoCards: Locator;

  // Dialogs
  readonly generateSummaryDialog: Locator;

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
    this.videosView = page.locator('[data-testid="videos-view"]');

    // Header elements
    this.videosTitle = page.locator('[data-testid="videos-view"] h1').filter({ hasText: /videos|Videos/i });
    this.videosDescription = page.locator('[data-testid="videos-view"] p').filter({ hasText: /videos|channels/i });

    // Filter components
    this.videosFilterBar = page.locator('[data-testid="videos-filter-bar"]');
    this.filterBar = page.locator('[data-testid="filter-bar"]');

    // Video grid/list
    this.videosGrid = page.locator('[data-testid="videos-grid"]');
    this.videoCards = page.locator('[data-testid="video-card"]');

    // Dialogs
    this.generateSummaryDialog = page.locator('[data-testid="generate-summary-dialog"]');

    // Empty state
    this.emptyState = page.locator('[data-testid="empty-state"]');

    // Loading states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.appLoader = page.locator('[data-testid="app-loader"]');

    // Error states
    this.errorState = page.locator('[data-testid="error-state"]');
  }

  async goto() {
    await this.page.goto("/videos");
  }

  async expectVideosPageLoaded() {
    await expect(this.videosView).toBeVisible();
    await expect(this.videosTitle).toBeVisible();
    await expect(this.videosDescription).toBeVisible();
  }

  async expectVideosGridVisible() {
    await expect(this.videosGrid).toBeVisible();
  }

  async expectFilterBarVisible() {
    await expect(this.videosFilterBar).toBeVisible();
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

  async getVideoCount(): Promise<number> {
    return await this.videoCards.count();
  }

  async clickVideoCard(index: number = 0) {
    const card = this.videoCards.nth(index);
    await expect(card).toBeVisible();
    await card.click();
  }

  async expectVideoCardContainsText(index: number, text: string) {
    const card = this.videoCards.nth(index);
    await expect(card).toContainText(text);
  }

  async clickGenerateSummaryOnVideo(index: number = 0) {
    const card = this.videoCards.nth(index);
    // Click the generate summary button/area on the card
    const generateButton = card.locator('button, [role="button"]').filter({ hasText: /generate|Generate/i });
    await expect(generateButton).toBeVisible();
    await generateButton.click();
  }

  async expectGenerateSummaryDialogVisible() {
    await expect(this.generateSummaryDialog).toBeVisible();
  }

  async expectOnVideosPage() {
    await expect(this.page).toHaveURL(/\/videos/);
    await this.expectVideosPageLoaded();
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

  async searchVideos(searchTerm: string) {
    const searchInput = this.filterBar.locator('input[type="text"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill(searchTerm);
  }
}