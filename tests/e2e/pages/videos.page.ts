import { type Page, type Locator, expect } from "@playwright/test";

export class VideoCard {
  readonly locator: Locator;

  constructor(locator: Locator) {
    this.locator = locator;
  }

  async getTitle(): Promise<string> {
    const titleElement = this.locator.locator('[data-testid="video-title"], h3, h4').first();
    await expect(titleElement).toBeVisible();
    return (await titleElement.textContent()) || "";
  }

  async getChannelName(): Promise<string> {
    const channelElement = this.locator.locator('[data-testid="video-channel"], [data-testid*="channel"]').first();
    await expect(channelElement).toBeVisible();
    return (await channelElement.textContent()) || "";
  }

  async getActionText(): Promise<string> {
    const actionElement = this.locator.locator('[data-testid="video-action"], button, [role="button"]').first();
    await expect(actionElement).toBeVisible();
    return (await actionElement.textContent()) || "";
  }

  async click() {
    await expect(this.locator).toBeVisible();
    await this.locator.click();
  }

  async expectGenerating() {
    const generatingElement = this.locator.locator('[data-testid*="generating"], [data-testid*="loading"]').first();
    await expect(generatingElement).toBeVisible();
  }

  async expectNoSummary() {
    const noSummaryElement = this.locator.locator('[data-testid*="no-summary"], [data-testid*="generate"]').first();
    await expect(noSummaryElement).toBeVisible();
  }

  async expectThumbnailVisible() {
    const thumbnail = this.locator.locator('img, [data-testid*="thumbnail"]').first();
    await expect(thumbnail).toBeVisible();
  }
}

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
  readonly generateDialog: Locator;

  // Empty state
  readonly emptyState: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly appLoader: Locator;

  // Error states
  readonly errorState: Locator;

  // Page header
  readonly pageHeader: Locator;

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
    this.generateDialog = this.generateSummaryDialog; // Alias for convenience

    // Empty state
    this.emptyState = page.locator('[data-testid="empty-state"]');

    // Loading states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.appLoader = page.locator('[data-testid="app-loader"]');

    // Error states
    this.errorState = page.locator('[data-testid="error-state"]');

    // Page header
    this.pageHeader = page.locator('h1, [data-testid="page-title"]').first();
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

  async clickVideoCard(index = 0) {
    const card = this.videoCards.nth(index);
    await expect(card).toBeVisible();
    await card.click();
  }

  async expectVideoCardContainsText(index: number, text: string) {
    const card = this.videoCards.nth(index);
    await expect(card).toContainText(text);
  }

  async clickGenerateSummaryOnVideo(index = 0) {
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

  async expectOnPage() {
    await this.expectOnVideosPage();
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

  // Additional filter methods for filtering test
  async selectChannel(channelName: string) {
    await this.filterByChannel(channelName);
  }

  async selectStatus(status: string) {
    await this.filterByStatus(status);
  }

  async search(searchTerm: string) {
    await this.searchVideos(searchTerm);
  }

  async getAvailableChannels(): Promise<string[]> {
    const channelSelect = this.filterBar.locator('select, [role="combobox"]').first();
    await expect(channelSelect).toBeVisible();
    const options = channelSelect.locator("option");
    const count = await options.count();
    const channels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) channels.push(text);
    }
    return channels;
  }

  async clearAllFilters() {
    const clearButton = this.filterBar
      .locator("button")
      .filter({ hasText: /clear|reset/i })
      .first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  // Additional methods
  async setDateRange(fromDate: string, toDate: string) {
    const fromInput = this.filterBar.locator('input[type="date"]').first();
    const toInput = this.filterBar.locator('input[type="date"]').nth(1);

    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();

    await fromInput.fill(fromDate);
    await toInput.fill(toDate);
  }

  async expectNoFiltersMatchState() {
    const noResultsElement = this.page.locator('[data-testid*="no-results"], [data-testid*="empty"]').first();
    await expect(noResultsElement).toBeVisible();
  }

  async getVideoCard(index: number): Promise<VideoCard> {
    const cards = await this.getAllVideoCards();
    return cards[index];
  }

  // Alias for expectVideosPageLoaded to match test expectations
  async expectLoaded() {
    await this.expectVideosPageLoaded();
  }

  // Get all video cards as array of VideoCard instances
  async getAllVideoCards(): Promise<VideoCard[]> {
    await expect(this.videosGrid).toBeVisible();
    const count = await this.videoCards.count();
    const cards: VideoCard[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(new VideoCard(this.videoCards.nth(i)));
    }
    return cards;
  }

  // Alias for expectGenerateSummaryDialogVisible to match test expectations
  async expectGenerateDialogVisible() {
    await this.expectGenerateSummaryDialogVisible();
  }

  // Get video title from dialog
  async getVideoTitleInDialog(): Promise<string> {
    await expect(this.generateDialog).toBeVisible();
    const titleElement = this.generateDialog.locator('[data-testid="dialog-video-title"], h2, h3').first();
    await expect(titleElement).toBeVisible();
    return (await titleElement.textContent()) || "";
  }

  // Check validation steps count
  async expectValidationStepsCount(expectedCount: number) {
    await expect(this.generateDialog).toBeVisible();
    const validationSteps = this.generateDialog.locator('[data-testid*="validation"], [data-testid*="step"]');
    await expect(validationSteps).toHaveCount(expectedCount);
  }

  // Confirm generation in dialog
  async confirmGenerateSummary() {
    await expect(this.generateDialog).toBeVisible();
    const confirmButton = this.generateDialog
      .locator("button")
      .filter({ hasText: /confirm|generate|start/i })
      .first();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
  }

  // Cancel generation in dialog
  async cancelGenerateSummary() {
    await expect(this.generateDialog).toBeVisible();
    const cancelButton = this.generateDialog
      .locator("button")
      .filter({ hasText: /cancel|close/i })
      .first();
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
  }

  // Check dialog is hidden
  async expectGenerateDialogHidden() {
    await expect(this.generateDialog).not.toBeVisible();
  }

  // Toast methods
  get toasts() {
    const self = this;
    return {
      async expectSuccessToast(message: string) {
        const toast = self.page.locator('[data-testid*="toast"]').filter({ hasText: message });
        await expect(toast).toBeVisible();
      },

      async expectErrorToast(message: string) {
        const toast = self.page.locator('[data-testid*="toast"]').filter({ hasText: message });
        await expect(toast).toBeVisible();
      },
    };
  }

  // Generate dialog methods
  get generateDialogMethods() {
    const dialogLocator = this.generateDialog;
    return {
      async expectAllValidationStepsSuccess() {
        const successSteps = dialogLocator.locator(
          '[data-testid*="validation"].success, [data-testid*="step"].success'
        );
        await expect(successSteps).toHaveCount(5); // Assuming 5 validation steps
      },

      async expectValidationStatus(status: string) {
        const statusElement = dialogLocator.locator(`[data-testid*="status"]:has-text("${status}")`);
        await expect(statusElement).toBeVisible();
      },

      async expectDialogStructure() {
        await expect(dialogLocator.locator('[data-testid="dialog-header"]')).toBeVisible();
        await expect(dialogLocator.locator('[data-testid="dialog-content"]')).toBeVisible();
        await expect(dialogLocator.locator('[data-testid="dialog-actions"]')).toBeVisible();
      },

      async expectAccessible() {
        await expect(dialogLocator).toHaveAttribute("role", "dialog");
        await expect(dialogLocator).toHaveAttribute("aria-labelledby");
        await expect(dialogLocator).toHaveAttribute("aria-describedby");
      },

      async getVideoTitle(): Promise<string> {
        const titleElement = dialogLocator.locator('[data-testid="dialog-video-title"], h2, h3').first();
        await expect(titleElement).toBeVisible();
        return (await titleElement.textContent()) || "";
      },

      async getVideoChannel(): Promise<string> {
        const channelElement = dialogLocator
          .locator('[data-testid="dialog-video-channel"], [data-testid*="channel"]')
          .first();
        await expect(channelElement).toBeVisible();
        return (await channelElement.textContent()) || "";
      },
    };
  }

  // Videos grid methods
  get videosGridMethods() {
    const gridLocator = this.videosGrid;
    const self = this;
    return {
      get videoCards() {
        return gridLocator.locator('[data-testid="video-card"]');
      },

      async expectAllVideosHaveStatus(status: string) {
        const cards = this.videoCards;
        const count = await cards.count();
        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);
          const statusElement = card.locator(
            `[data-testid*="status"]:has-text("${status}"), [data-testid*="${status}"]`
          );
          await expect(statusElement).toBeVisible();
        }
      },

      async expectAllVideosFromChannel(channelName: string) {
        const cards = this.videoCards;
        const count = await cards.count();
        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);
          const channelElement = card.locator('[data-testid*="channel"]');
          await expect(channelElement).toContainText(channelName);
        }
      },

      async expectVideosContainSearchTerm(searchTerm: string) {
        const cards = this.videoCards;
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);
          await expect(card).toContainText(searchTerm);
        }
      },
    };
  }

  // Filter bar methods
  get filterBarMethods() {
    const filterBarLocator = this.filterBar;
    return {
      get filterBar() {
        return filterBarLocator;
      },

      async selectChannel(channelName: string) {
        const channelSelect = filterBarLocator.locator('select, [role="combobox"]').first();
        await expect(channelSelect).toBeVisible();
        await channelSelect.selectOption({ label: channelName });
      },

      async selectStatus(status: string) {
        const statusSelect = filterBarLocator.locator('select, [role="combobox"]').nth(1);
        await expect(statusSelect).toBeVisible();
        await statusSelect.selectOption({ label: status });
      },

      async search(searchTerm: string) {
        const searchInput = filterBarLocator.locator('input[type="text"], input[placeholder*="search"]').first();
        await expect(searchInput).toBeVisible();
        await searchInput.fill(searchTerm);
      },

      async getAvailableChannels(): Promise<string[]> {
        const channelSelect = filterBarLocator.locator('select, [role="combobox"]').first();
        await expect(channelSelect).toBeVisible();
        const options = channelSelect.locator("option");
        const count = await options.count();
        const channels: string[] = [];
        for (let i = 0; i < count; i++) {
          const text = await options.nth(i).textContent();
          if (text) channels.push(text);
        }
        return channels;
      },

      async clearAllFilters() {
        const clearButton = filterBarLocator
          .locator("button")
          .filter({ hasText: /clear|reset/i })
          .first();
        if (await clearButton.isVisible()) {
          await clearButton.click();
        }
      },
    };
  }

  // Toast methods
  async expectSuccessToast(message: string) {
    const toast = this.page.locator('[data-testid*="toast"]').filter({ hasText: message });
    await expect(toast).toBeVisible();
  }

  async expectErrorToast(message: string) {
    const toast = this.page.locator('[data-testid*="toast"]').filter({ hasText: message });
    await expect(toast).toBeVisible();
  }

  // Generate dialog methods
  async expectAllValidationStepsSuccess() {
    const successSteps = this.generateDialog.locator(
      '[data-testid*="validation"].success, [data-testid*="step"].success'
    );
    await expect(successSteps).toHaveCount(5); // Assuming 5 validation steps
  }

  async expectValidationStatus(status: string) {
    const statusElement = this.generateDialog.locator(`[data-testid*="status"]:has-text("${status}")`);
    await expect(statusElement).toBeVisible();
  }

  async expectDialogStructure() {
    await expect(this.generateDialog.locator('[data-testid="dialog-header"]')).toBeVisible();
    await expect(this.generateDialog.locator('[data-testid="dialog-content"]')).toBeVisible();
    await expect(this.generateDialog.locator('[data-testid="dialog-actions"]')).toBeVisible();
  }

  async expectAccessible() {
    await expect(this.generateDialog).toHaveAttribute("role", "dialog");
    await expect(this.generateDialog).toHaveAttribute("aria-labelledby");
    await expect(this.generateDialog).toHaveAttribute("aria-describedby");
  }

  async getVideoTitle(): Promise<string> {
    const titleElement = this.generateDialog.locator('[data-testid="dialog-video-title"], h2, h3').first();
    await expect(titleElement).toBeVisible();
    return (await titleElement.textContent()) || "";
  }

  async getVideoChannel(): Promise<string> {
    const channelElement = this.generateDialog
      .locator('[data-testid="dialog-video-channel"], [data-testid*="channel"]')
      .first();
    await expect(channelElement).toBeVisible();
    return (await channelElement.textContent()) || "";
  }

  // Additional methods for test compatibility
  async expectVideosCount(expectedCount: number) {
    const actualCount = await this.getVideoCount();
    expect(actualCount).toBe(expectedCount);
  }

  async expectVideoCardsCount(expectedCount: number) {
    await this.expectVideosCount(expectedCount);
  }

  async expectLoadingIndicator() {
    await this.expectLoadingState();
  }

  // Alias for searchVideos to match test expectations
  async searchForVideos(searchTerm: string) {
    await this.searchVideos(searchTerm);
  }
}
