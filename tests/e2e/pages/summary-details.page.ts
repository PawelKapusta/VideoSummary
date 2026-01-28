import { type Page, type Locator, expect } from "@playwright/test";

export class SummaryDetailsPage {
  readonly page: Page;

  // Main containers
  readonly summaryDetailsView: Locator;

  // Video header section
  readonly videoHeader: Locator;
  readonly videoTitle: Locator;
  readonly videoThumbnail: Locator;
  readonly channelInfo: Locator;
  readonly videoMetadata: Locator;

  // Summary content
  readonly summaryContent: Locator;
  readonly summaryText: Locator;
  readonly summaryMetadata: Locator;

  // Rating section
  readonly ratingSection: Locator;
  readonly thumbsUpButton: Locator;
  readonly thumbsDownButton: Locator;
  readonly currentRating: Locator;

  // Action buttons
  readonly regenerateButton: Locator;
  readonly hideButton: Locator;
  readonly shareButton: Locator;

  // Status indicators
  readonly statusBadge: Locator;
  readonly processingIndicator: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly appLoader: Locator;

  // Error states
  readonly errorState: Locator;

  // Navigation
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main containers
    this.summaryDetailsView = page.locator('[data-testid="summary-details-view"]');

    // Video header section
    this.videoHeader = page.locator('[data-testid="summary-details-view"]').locator(".video-header, header").first();
    this.videoTitle = page
      .locator('[data-testid="summary-details-view"] h1, [data-testid="summary-details-view"] [data-testid*="title"]')
      .first();
    this.videoThumbnail = page.locator('[data-testid="summary-details-view"] img').first();
    this.channelInfo = page.locator('[data-testid="summary-details-view"]').locator("text=/Channel|By/i").locator("..");
    this.videoMetadata = page
      .locator('[data-testid="summary-details-view"]')
      .locator("text=/Published|Duration|Views/i")
      .locator("..");

    // Summary content
    this.summaryContent = page
      .locator('[data-testid="summary-details-view"]')
      .locator('.summary-content, [data-testid*="summary"]')
      .first();
    this.summaryText = page
      .locator('[data-testid="summary-details-view"]')
      .locator("text=/Summary|Content/i")
      .locator("..");
    this.summaryMetadata = page
      .locator('[data-testid="summary-details-view"]')
      .locator("text=/Generated|Status|Rating/i")
      .locator("..");

    // Rating section
    this.ratingSection = page
      .locator('[data-testid="summary-details-view"]')
      .locator('[data-testid*="rating"], .rating')
      .first();
    this.thumbsUpButton = page
      .locator('[data-testid="summary-details-view"] button')
      .filter({ hasText: /thumbs up|like|positive|👍/i });
    this.thumbsDownButton = page
      .locator('[data-testid="summary-details-view"] button')
      .filter({ hasText: /thumbs down|dislike|negative|👎/i });
    this.currentRating = page
      .locator('[data-testid="summary-details-view"]')
      .locator("text=/Your rating|Rated/i")
      .locator("..");

    // Action buttons
    this.regenerateButton = page
      .locator('[data-testid="summary-details-view"] button')
      .filter({ hasText: /regenerate|Regenerate/i });
    this.hideButton = page.locator('[data-testid="summary-details-view"] button').filter({ hasText: /hide|Hide/i });
    this.shareButton = page.locator('[data-testid="summary-details-view"] button').filter({ hasText: /share|Share/i });

    // Status indicators
    this.statusBadge = page
      .locator('[data-testid="summary-details-view"]')
      .locator('[data-testid*="badge"], .badge')
      .filter({ hasText: /completed|pending|failed/i });
    this.processingIndicator = page
      .locator('[data-testid="summary-details-view"]')
      .locator("text=/processing|generating|loading/i")
      .locator("..");

    // Loading states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.appLoader = page.locator('[data-testid="app-loader"]');

    // Error states
    this.errorState = page.locator('[data-testid="error-state"]');

    // Navigation
    this.backButton = page.locator('[data-testid="summary-details-view"] button').filter({ hasText: /back|Back|←/i });
  }

  async goto(summaryId: string) {
    await this.page.goto(`/summaries/${summaryId}`);
  }

  async expectSummaryDetailsPageLoaded() {
    await expect(this.summaryDetailsView).toBeVisible();
    await expect(this.videoHeader).toBeVisible();
  }

  async expectVideoTitle(title: string) {
    await expect(this.videoTitle).toContainText(title);
  }

  async expectChannelInfo(channelName: string) {
    await expect(this.channelInfo).toContainText(channelName);
  }

  async expectSummaryContentVisible() {
    await expect(this.summaryContent).toBeVisible();
  }

  async getSummaryText(): Promise<string> {
    return (await this.summaryText.textContent()) || "";
  }

  async expectRatingSectionVisible() {
    await expect(this.ratingSection).toBeVisible();
  }

  async rateSummary(rating: "positive" | "negative") {
    if (rating === "positive") {
      await expect(this.thumbsUpButton).toBeVisible();
      await this.thumbsUpButton.click();
    } else {
      await expect(this.thumbsDownButton).toBeVisible();
      await this.thumbsDownButton.click();
    }
  }

  async expectCurrentRating(rating: "positive" | "negative" | null) {
    if (rating === "positive") {
      await expect(this.currentRating).toContainText(/thumbs up|like|positive/i);
    } else if (rating === "negative") {
      await expect(this.currentRating).toContainText(/thumbs down|dislike|negative/i);
    } else {
      await expect(this.currentRating).toContainText(/no rating|neutral/i);
    }
  }

  async expectRegenerateButtonVisible() {
    await expect(this.regenerateButton).toBeVisible();
  }

  async clickRegenerate() {
    await expect(this.regenerateButton).toBeVisible();
    await this.regenerateButton.click();
  }

  async expectHideButtonVisible() {
    await expect(this.hideButton).toBeVisible();
  }

  async clickHide() {
    await expect(this.hideButton).toBeVisible();
    await this.hideButton.click();

    // Handle confirmation dialog if present
    const confirmButton = this.page.locator("button").filter({ hasText: /confirm|yes|hide/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  async expectStatusBadge(status: "completed" | "pending" | "failed") {
    await expect(this.statusBadge).toContainText(status);
  }

  async expectProcessingIndicatorVisible() {
    await expect(this.processingIndicator).toBeVisible();
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

  async clickBackButton() {
    await expect(this.backButton).toBeVisible();
    await this.backButton.click();
  }

  async expectOnSummaryDetailsPage(summaryId?: string) {
    if (summaryId) {
      await expect(this.page).toHaveURL(new RegExp(`/summaries/${summaryId}`));
    } else {
      await expect(this.page).toHaveURL(/\/summaries\/[^/]+/);
    }
    await this.expectSummaryDetailsPageLoaded();
  }

  // Helper methods for common operations
  async waitForSummaryToLoad() {
    await expect(this.videoTitle).toBeVisible();
    await expect(this.summaryContent).toBeVisible();
  }

  async expectVideoThumbnailVisible() {
    await expect(this.videoThumbnail).toBeVisible();
  }

  async getVideoTitle(): Promise<string> {
    return (await this.videoTitle.textContent()) || "";
  }

  async getChannelName(): Promise<string> {
    return (await this.channelInfo.textContent()) || "";
  }
}
