import { test, expect } from "@playwright/test";
import { VideosPage } from "../pages/videos.page";
import { VideosFilterBarComponent } from "../components/videos-filter-bar.component";
import { VideosGridComponent } from "../components/videos-grid.component";
import { GenerateSummaryDialogComponent } from "../components/generate-summary-dialog.component";
import { ToastNotificationsComponent } from "../components/toast-notifications.component";
import { loadTestUser } from "../helpers/test-data.helper";

/**
 * Examples of using Page Object Model (POM) components
 * This file demonstrates how to use the granular components for testing
 */
test.describe("POM Components Usage Examples", () => {
  let videosPage: VideosPage;
  let filterBar: VideosFilterBarComponent;
  let videosGrid: VideosGridComponent;
  let toasts: ToastNotificationsComponent;

  test.beforeAll(async () => {
    await loadTestUser();
  });

  test.beforeEach(async ({ page }) => {
    videosPage = new VideosPage(page);
    filterBar = videosPage.filterBar;
    videosGrid = videosPage.videosGrid;
    toasts = videosPage.toasts;

    // User subscriptions assumed to be already configured
    await videosPage.goto();
    await videosPage.expectLoaded();
  });

  test("Example: Complete filtering workflow using components", async () => {
    // 1. Verify filter bar is ready
    await filterBar.expectVisible();
    await filterBar.expectEnabled();

    // 2. Apply multiple filters
    await filterBar.search("machine learning");
    await filterBar.selectStatus("with");
    await filterBar.selectChannel("Test Tech Channel");

    // 3. Set date range
    await filterBar.setDateFrom("2024-01-01");
    await filterBar.setDateTo("2024-12-31");

    // 4. Verify filters are active
    const activeFilters = await filterBar.getActiveFiltersCount();
    expect(activeFilters).toBeGreaterThan(0);

    // 5. Check filtered results
    await videosGrid.expectVideosContainSearchTerm("machine learning");
    await videosGrid.expectAllVideosHaveStatus("summary-available");

    // 6. Clear filters
    await filterBar.clearAllFilters();

    // 7. Verify filters are cleared
    const activeFiltersAfterClear = await filterBar.getActiveFiltersCount();
    expect(activeFiltersAfterClear).toBe(0);
  });

  test("Example: Video card interactions", async () => {
    // Get first video card
    const firstCard = await videosGrid.getVideoCard(0);

    // Verify card structure
    await firstCard.expectVisible();
    await firstCard.expectCardStructure();

    // Check card content
    const title = await firstCard.getTitle();
    const channel = await firstCard.getChannelName();
    const action = await firstCard.getActionText();

    expect(title).toBeTruthy();
    expect(channel).toBeTruthy();
    expect(action).toBeTruthy();

    // Test hover effects
    await firstCard.expectHoverEffects();

    // Test click action
    if (action === "Generate Summary") {
      await firstCard.click();

      // Verify dialog opens
      const dialog = new GenerateSummaryDialogComponent(videosPage.page);
      await dialog.expectVisible();

      // Close dialog
      await dialog.clickCancel();
      await dialog.expectHidden();
    }
  });

  test("Example: Toast notifications handling", async () => {
    // Trigger an action that shows toast (like filtering)
    await filterBar.search("nonexistent");
    await videosGrid.expectEmptyStateVisible();

    // Check for any toast messages
    const toastCount = await toasts.getToastCount();
    console.log(`Found ${toastCount} toast notifications`);

    // Close any open toasts
    await toasts.closeAllToasts();

    // Verify no toasts remain
    await toasts.expectNoToasts();
  });

  test("Example: Grid operations and infinite scroll", async () => {
    // Check initial grid state
    await videosGrid.expectVisible();
    const initialCount = await videosGrid.videoCards.count();

    // Test infinite scroll (if available)
    await videosGrid.scrollToBottom();

    // Wait for potential new content
    await videosGrid.page.waitForTimeout(1000);

    // Check if more content loaded
    const finalCount = await videosGrid.videoCards.count();
    console.log(`Loaded ${finalCount - initialCount} additional videos`);
  });

  test("Example: Complex component interaction", async () => {
    // 1. Filter for videos without summaries
    await filterBar.selectStatus("without");

    // 2. Get videos that can be processed
    const videoCards = await videosGrid.getAllVideoCards();

    if (videoCards.length > 0) {
      // 3. Click first video to generate summary
      const firstCard = videoCards[0];
      await firstCard.click();

      // 4. Handle the generation dialog
      const dialog = new GenerateSummaryDialogComponent(videosPage.page);
      await dialog.expectVisible();

      // 5. Verify dialog content
      await dialog.expectDialogStructure();
      await dialog.expectValidationStatus("ready");

      // 6. Confirm generation
      await dialog.clickConfirm();

      // 7. Check for success toast
      await toasts.waitForSuccessToast("Generowanie w toku");

      // 8. Verify dialog closed
      await dialog.expectHidden();

      // 9. Verify card status changed
      await firstCard.expectGenerating();
    }
  });

  test("Example: Error handling with components", async ({ page }) => {
    // Simulate network error
    await page.route("**/api/videos**", (route) => route.abort());

    // Reload page
    await page.reload();

    // Check if error state appears
    await videosPage.errorState.expectVisible();

    // Restore normal functionality
    await page.unroute("**/api/videos**");
    await page.reload();

    // Verify page loads normally
    await videosPage.expectLoaded();
  });

  test("Example: Accessibility testing with POM components", async () => {
    // Test filter bar accessibility
    await filterBar.expectVisible();
    // Components include accessibility checks in their methods

    // Test video cards accessibility
    const firstCard = await videosGrid.getVideoCard(0);
    await firstCard.expectClickable();
    await firstCard.expectAccessibility();

    // Test grid responsiveness
    await videosGrid.expectGridLayout(3); // Desktop layout
  });

  test("Example: Performance testing with components", async () => {
    const startTime = Date.now();

    // Perform search
    await filterBar.search("test");

    // Wait for results
    await videosGrid.waitForLoadingToComplete();

    const searchTime = Date.now() - startTime;
    console.log(`Search completed in ${searchTime}ms`);

    // Assert reasonable performance
    expect(searchTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
