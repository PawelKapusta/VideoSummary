import { type Page, type Locator, expect } from "@playwright/test";
import { VideosFilterBarComponent } from "../components/videos-filter-bar.component";
import { VideosGridComponent } from "../components/videos-grid.component";
import { GenerateSummaryDialogComponent } from "../components/generate-summary-dialog.component";
import { ToastNotificationsComponent } from "../components/toast-notifications.component";
import { EmptyStateComponent } from "../components/empty-state.component";
import { ErrorStateComponent } from "../components/error-state.component";
import { VideoCardComponent } from "../components/video-card.component";

export class VideosPage {
  readonly page: Page;

  // Main container
  readonly container: Locator;
  readonly pageHeader: Locator;
  readonly videosCount: Locator;

  // Component instances (following POM pattern)
  readonly filterBar: VideosFilterBarComponent;
  readonly videosGrid: VideosGridComponent;
  readonly generateDialog: GenerateSummaryDialogComponent;
  readonly toasts: ToastNotificationsComponent;
  readonly emptyState: EmptyStateComponent;
  readonly errorState: ErrorStateComponent;

  // Backward compatibility - direct access to commonly used elements
  readonly videoCards: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main container
    this.container = page.locator('[data-testid="videos-view"]');
    this.pageHeader = page.locator("h1").filter({ hasText: "Available Videos" });
    this.videosCount = page.locator("p").filter({ hasText: /Currently displaying \d+ videos/ });

    // Initialize components following POM pattern
    this.filterBar = new VideosFilterBarComponent(page);
    this.videosGrid = new VideosGridComponent(page);
    this.generateDialog = new GenerateSummaryDialogComponent(page);
    this.toasts = new ToastNotificationsComponent(page);
    this.emptyState = new EmptyStateComponent(page);
    this.errorState = new ErrorStateComponent(page);

    // Backward compatibility
    this.videoCards = this.videosGrid.videoCards;
    this.loadingIndicator = this.videosGrid.loadingIndicator;
  }

  async goto() {
    await this.page.goto("/videos");
  }

  async expectLoaded() {
    await expect(this.container).toBeVisible();
    await expect(this.pageHeader).toBeVisible();
    await this.filterBar.expectVisible();
    await this.videosGrid.expectVisible();
  }

  async expectVideosCount(expectedCount: number) {
    await expect(this.videosCount).toContainText(`Currently displaying ${expectedCount} videos`);
  }

  async expectVideoCardsCount(expectedCount: number) {
    await this.videosGrid.expectVideoCardsCount(expectedCount);
  }

  async searchForVideos(searchTerm: string) {
    await this.filterBar.search(searchTerm);
  }

  async filterByStatus(status: "all" | "with" | "without") {
    await this.filterBar.selectStatus(status);
  }

  async filterByChannel(channelName: string) {
    await this.filterBar.selectChannel(channelName);
  }

  async setDateRange(fromDate: string, toDate: string) {
    await this.filterBar.setDateFrom(fromDate);
    await this.filterBar.setDateTo(toDate);
  }

  async clearAllFilters() {
    await this.filterBar.clearAllFilters();
  }

  async getVideoCard(index: number): Promise<VideoCardComponent> {
    return await this.videosGrid.getVideoCard(index);
  }

  async clickVideoCard(index: number) {
    await this.videosGrid.clickVideoCard(index);
  }

  async expectEmptyStateVisible(message?: string) {
    await this.emptyState.expectVisible();
    if (message) {
      await expect(this.page.locator(`text=${message}`)).toBeVisible();
    }
  }

  async expectNoVideosState() {
    await this.emptyState.expectType("videos");
  }

  async expectNoFiltersMatchState() {
    await this.emptyState.expectType("search-results");
  }

  async expectGenerateDialogVisible() {
    await this.generateDialog.expectVisible();
  }

  async expectGenerateDialogHidden() {
    await this.generateDialog.expectHidden();
  }

  async getVideoTitleInDialog() {
    return await this.generateDialog.getVideoTitle();
  }

  async confirmGenerateSummary() {
    await this.generateDialog.clickConfirm();
  }

  async cancelGenerateSummary() {
    await this.generateDialog.clickCancel();
  }

  async expectValidationStepsCount(expectedCount: number) {
    await this.generateDialog.expectValidationStepsCount(expectedCount);
  }

  async expectToastMessage(message: string) {
    await this.toasts.expectToastContainsText(message);
  }

  async expectLoadingIndicator() {
    await this.videosGrid.expectLoadingIndicator();
  }

  async waitForLoadingToComplete() {
    await this.videosGrid.waitForLoadingToComplete();
  }

  async scrollToLoadMore() {
    await this.videosGrid.scrollToLoadMore();
  }
}

// VideoCard component is now available as VideoCardComponent in components/video-card.component.ts
