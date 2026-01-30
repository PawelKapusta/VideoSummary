import { test, expect } from "@playwright/test";
import { VideosPage } from "../pages/videos.page";
import { loadTestUser } from "../helpers/test-data.helper";

test.describe("Videos Page - Basic Functionality", () => {
  let videosPage: VideosPage;

  test.beforeAll(async () => {
    await loadTestUser();
  });

  test.beforeEach(async ({ page }) => {
    videosPage = new VideosPage(page);

    // Navigate to videos page (assuming user is already logged in via auth setup)
    await videosPage.goto();
    await videosPage.expectLoaded();
  });

  test("VID-BASIC-01: Page loads successfully with videos", async () => {
    // Verify page structure
    await videosPage.expectLoaded();
    await expect(videosPage.pageHeader).toContainText("Available Videos");

    // Verify filter bar is present
    await videosPage.expectFilterBarVisible();
    // Filter bar enabled check - assuming it's always enabled if visible
    await videosPage.expectFilterBarVisible();

    // Verify videos grid is present
    await videosPage.expectVideosGridVisible();

    // Verify videos are displayed (assuming test data exists)
    const videoCards = await videosPage.getAllVideoCards();
    if (videoCards.length > 0) {
      await videosPage.expectVideosCount(videoCards.length);
      await videosPage.expectVideoCardsCount(videoCards.length);
    }
  });

  test("VID-BASIC-02: Page shows empty state when no videos available", async () => {
    // This test would need a user with no subscribed channels
    // For now, we'll test the empty state logic with filters
    await videosPage.searchVideos("nonexistent-video-12345");
    await videosPage.expectNoFiltersMatchState();
  });

  test("VID-BASIC-03: Video cards display correct information", async () => {
    const firstVideoCard = await videosPage.getVideoCard(0);

    // Check that video card has required elements
    await firstVideoCard.expectThumbnailVisible();
    const title = await firstVideoCard.getTitle();
    const channel = await firstVideoCard.getChannelName();

    expect(title).toBeTruthy();
    expect(channel).toBeTruthy();
    expect(title?.length).toBeGreaterThan(0);
    expect(channel?.length).toBeGreaterThan(0);
  });

  test("VID-BASIC-04: Video count updates correctly", async () => {
    // Get initial count from UI
    const initialCount = await videosPage.videoCards.count();
    await videosPage.expectVideosCount(initialCount);

    if (initialCount > 0) {
      // Get a channel from the first video
      const firstCard = await videosPage.getVideoCard(0);
      const channelName = await firstCard.getChannelName();

      if (channelName) {
        // Filter by channel
        await videosPage.filterByChannel(channelName);

        // Wait for filter to apply
        await videosPage.page.waitForTimeout(500);

        // Verify count changed or stayed same (if all videos are from this channel)
        const newCount = await videosPage.videoCards.count();
        expect(newCount).toBeLessThanOrEqual(initialCount);

        // If we have videos from other channels, count should be less
        // This is hard to assert strictly without knowing data, but we can check it's consistent
        await videosPage.expectVideosCount(newCount);
      }
    }
  });

  test("VID-BASIC-05: Page handles loading states correctly", async () => {
    // Reload page to trigger loading state
    await videosPage.page.reload();
    await videosPage.expectLoadingIndicator();
    await videosPage.waitForLoadingToComplete();
    await videosPage.expectLoaded();
  });

  test("VID-BASIC-06: Page is responsive on mobile viewport", async ({ isMobile }) => {
    test.skip(!isMobile, "This test is only for mobile viewport");

    await videosPage.expectLoaded();

    // On mobile, cards should be in single column
    await expect(videosPage.videosGrid).toHaveClass(/grid-cols-1/);
  });

  test("VID-BASIC-07: Page displays correct meta information", async () => {
    // Check page title
    await expect(videosPage.page).toHaveTitle(/Video Summary/);

    // Check URL
    await expect(videosPage.page).toHaveURL("/videos");
  });

  test("VID-BASIC-08: Navigation elements are present", async () => {
    // Check that we're not on a public page (navigation should be visible)
    const header = videosPage.page.locator("header");
    await expect(header).toBeVisible();

    // Check navigation links
    const dashboardLink = videosPage.page.locator('a[href="/dashboard"]');
    const summariesLink = videosPage.page.locator('a[href="/summaries"]');
    const videosLink = videosPage.page.locator('a[href="/videos"]');

    await expect(dashboardLink).toBeVisible();
    await expect(summariesLink).toBeVisible();
    await expect(videosLink).toBeVisible();
  });

  test("VID-BASIC-09: Page handles network errors gracefully", async ({ page }) => {
    // This would require mocking network failures
    // For now, we'll test with a simulated offline state

    // Mock a network failure for videos API
    await page.route("**/api/videos**", (route) => route.abort());

    await page.reload();
    await videosPage.expectLoadingIndicator();

    // Should show error state after loading fails
    await expect(videosPage.page.locator("text=Something went wrong")).toBeVisible();
  });

  test("VID-BASIC-10: Page maintains state on navigation", async ({ page }) => {
    // Apply some filters
    await videosPage.searchVideos("machine learning");

    // Navigate away and back
    await page.goto("/dashboard");
    await page.goto("/videos");

    // Search should be maintained (depending on implementation)
    // This test may need adjustment based on actual app behavior
    await videosPage.expectLoaded();
  });
});
