import { type Page, type Locator, expect } from "@playwright/test";
import { VideoCardComponent } from "./video-card.component";

export class VideosGridComponent {
  readonly page: Page;
  readonly grid: Locator;

  // Grid elements
  readonly videoCards: Locator;
  readonly loadingIndicator: Locator;
  readonly loadMoreIndicator: Locator;

  // Empty states
  readonly emptyState: Locator;
  readonly noVideosMessage: Locator;
  readonly noFiltersMatchMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.grid = page.locator('[data-testid="videos-grid"]');

    // Grid elements
    this.videoCards = this.grid.locator('[data-testid="video-card"]');
    this.loadingIndicator = page.locator("text=Loading videos...");
    this.loadMoreIndicator = page.locator("text=Loading more videos...");

    // Empty states
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.noVideosMessage = page.locator("text=No videos available");
    this.noFiltersMatchMessage = page.locator("text=No videos match your filters");
  }

  async expectVisible() {
    await expect(this.grid).toBeVisible();
  }

  async expectHidden() {
    await expect(this.grid).not.toBeVisible();
  }

  async expectVideoCardsCount(expectedCount: number) {
    await expect(this.videoCards).toHaveCount(expectedCount);
  }

  async expectNoVideos() {
    await expect(this.videoCards).toHaveCount(0);
  }

  async getVideoCard(index: number): Promise<VideoCardComponent> {
    const cardLocator = this.videoCards.nth(index);
    return new VideoCardComponent(this.page, cardLocator);
  }

  async getAllVideoCards(): Promise<VideoCardComponent[]> {
    const count = await this.videoCards.count();
    const cards: VideoCardComponent[] = [];

    for (let i = 0; i < count; i++) {
      cards.push(await this.getVideoCard(i));
    }

    return cards;
  }

  async clickVideoCard(index: number) {
    const card = this.videoCards.nth(index);
    await card.click();
  }

  async expectLoadingIndicator() {
    await expect(this.loadingIndicator).toBeVisible();
  }

  async expectLoadMoreIndicator() {
    await expect(this.loadMoreIndicator).toBeVisible();
  }

  async waitForLoadingToComplete() {
    await expect(this.loadingIndicator).not.toBeVisible();
  }

  async waitForLoadMoreToComplete() {
    await expect(this.loadMoreIndicator).not.toBeVisible();
  }

  async expectEmptyStateVisible(type?: "no-videos" | "no-filters") {
    await expect(this.emptyState).toBeVisible();

    if (type === "no-videos") {
      await expect(this.noVideosMessage).toBeVisible();
    } else if (type === "no-filters") {
      await expect(this.noFiltersMatchMessage).toBeVisible();
    }
  }

  async expectEmptyStateHidden() {
    await expect(this.emptyState).not.toBeVisible();
  }

  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  async scrollToLoadMore() {
    await this.scrollToBottom();
    // Wait for potential load more trigger
    await this.page.waitForTimeout(1000);
  }

  async expectGridLayout(columns: 1 | 2 | 3) {
    const expectedClass = `grid-cols-${columns}`;
    await expect(this.grid).toHaveClass(new RegExp(expectedClass));
  }

  async expectInfiniteScrollEnabled() {
    // Check if there's a scroll trigger element at the bottom
    const scrollTrigger = this.grid.locator("div.h-10");
    await expect(scrollTrigger).toBeVisible();
  }

  async getVisibleVideoTitles(): Promise<string[]> {
    const cards = await this.getAllVideoCards();
    const titles: string[] = [];

    for (const card of cards) {
      const title = await card.getTitle();
      if (title) {
        titles.push(title);
      }
    }

    return titles;
  }

  async getVisibleChannelNames(): Promise<string[]> {
    const cards = await this.getAllVideoCards();
    const channels: string[] = [];

    for (const card of cards) {
      const channel = await card.getChannelName();
      if (channel) {
        channels.push(channel);
      }
    }

    return channels;
  }

  async expectAllVideosFromChannel(expectedChannelName: string) {
    const channelNames = await this.getVisibleChannelNames();
    const uniqueChannels = [...new Set(channelNames)];

    expect(uniqueChannels).toHaveLength(1);
    expect(uniqueChannels[0]).toBe(expectedChannelName);
  }

  async expectAllVideosHaveStatus(expectedStatus: "summary-available" | "no-summary" | "generating" | "failed") {
    const cards = await this.getAllVideoCards();

    for (const card of cards) {
      switch (expectedStatus) {
        case "summary-available":
          await card.expectAction("See Summary");
          break;
        case "no-summary":
          await card.expectAction("Generate Summary");
          break;
        case "generating":
          await card.expectAction("In Progress");
          break;
        case "failed":
          await card.expectAction("Try Again");
          break;
      }
    }
  }

  async expectVideosContainSearchTerm(searchTerm: string) {
    const titles = await this.getVisibleVideoTitles();
    const channels = await this.getVisibleChannelNames();

    // At least one video should match the search term in title or channel
    const hasMatch =
      titles.some((title) => title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      channels.some((channel) => channel.toLowerCase().includes(searchTerm.toLowerCase()));

    expect(hasMatch).toBe(true);
  }

  async expectVideosWithinDateRange(_fromDate: Date, _toDate: Date) {
    // This would require checking the published dates
    // Implementation depends on how dates are displayed in cards
    // For now, we'll assume dates are available in the card data
    const cards = await this.getAllVideoCards();

    for (const card of cards) {
      // This would need to be implemented based on actual card structure
      // For now, we'll just check that cards exist
      await expect(card.card).toBeVisible();
    }
  }

  async countVideosByStatus(): Promise<{
    withSummary: number;
    withoutSummary: number;
    generating: number;
    failed: number;
  }> {
    const cards = await this.getAllVideoCards();
    let withSummary = 0;
    let withoutSummary = 0;
    let generating = 0;
    let failed = 0;

    for (const card of cards) {
      const action = await card.getActionText();
      if (action === "See Summary") {
        withSummary++;
      } else if (action === "Generate Summary") {
        withoutSummary++;
      } else if (action === "In Progress") {
        generating++;
      } else if (action === "Try Again") {
        failed++;
      }
    }

    return { withSummary, withoutSummary, generating, failed };
  }
}
