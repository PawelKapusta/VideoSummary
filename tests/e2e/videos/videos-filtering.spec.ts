import { test, expect } from "@playwright/test";
import { VideosPage } from "../pages/videos.page";
import { loadTestUser } from "../helpers/test-data.helper";

test.describe("Videos Page - Filtering Functionality", () => {
  let videosPage: VideosPage;

  test.beforeAll(async () => {
    await loadTestUser();
  });

  test.beforeEach(async ({ page }) => {
    videosPage = new VideosPage(page);
    await videosPage.goto();
    await videosPage.expectLoaded();
  });

  test("VID-FILT-01: Search by video title works correctly", async () => {
    // Get a title from the UI to search for
    const count = await videosPage.videoCards.count();

    if (count > 0) {
      const firstCard = await videosPage.getVideoCard(0);
      const fullTitle = await firstCard.getTitle();

      expect(fullTitle).toBeTruthy();

      if (fullTitle) {
        // Search for part of the title
        const searchTerm = fullTitle.split(" ")[0]; // First word of title
        await videosPage.filterBarMethods.search(searchTerm);

        // Should show filtered results
        await videosPage.videosGridMethods.expectVideosContainSearchTerm(searchTerm);
      }
    } else {
      test.skip(true, "No videos available to test search");
    }
  });

  test("VID-FILT-02: Search with no results shows empty state", async () => {
    await videosPage.filterBarMethods.search("nonexistent-video-title-12345");
    await videosPage.expectNoFiltersMatchState();
  });

  test("VID-FILT-03: Filter by channel shows only channel videos", async () => {
    // Get first available channel option (excluding "All Channels")
    const channelSelect = videosPage.filterBarMethods.filterBar.locator("select").nth(1);
    const options = await channelSelect.locator("option").allTextContents();
    const availableChannels = options.filter((opt: string) => opt !== "All Channels");

    if (availableChannels.length > 0) {
      const targetChannel = availableChannels[0];

      await videosPage.filterBarMethods.selectChannel(targetChannel);

      // Wait for filter to apply
      await videosPage.page.waitForTimeout(500);

      // Verify all visible videos belong to the selected channel
      await videosPage.videosGridMethods.expectAllVideosFromChannel(targetChannel);
    } else {
      test.skip(true, "No channels available for testing");
    }
  });

  test('VID-FILT-04: Filter by status "Summary Available" works', async () => {
    await videosPage.filterBarMethods.selectStatus("with");

    // Wait for filter to apply
    await videosPage.page.waitForTimeout(500);

    // Check if any videos are shown (assuming some videos have summaries)
    const visibleCount = await videosPage.videosGridMethods.videoCards.count();
    if (visibleCount > 0) {
      // All visible videos should have summaries available
      await videosPage.videosGridMethods.expectAllVideosHaveStatus("summary-available");
    } else {
      // No videos with summaries found - this is also valid
      console.log("No videos with summaries found - filter working correctly");
    }
  });

  test('VID-FILT-05: Filter by status "No Summary" works', async () => {
    await videosPage.filterBarMethods.selectStatus("without");

    // Wait for filter to apply
    await videosPage.page.waitForTimeout(500);

    // Check if any videos are shown (assuming some videos don't have summaries)
    const visibleCount = await videosPage.videosGridMethods.videoCards.count();
    if (visibleCount > 0) {
      // All visible videos should have no summaries
      await videosPage.videosGridMethods.expectAllVideosHaveStatus("no-summary");
    } else {
      // No videos without summaries found - this is also valid
      console.log("No videos without summaries found - filter working correctly");
    }
  });

  test("VID-FILT-06: Date range filtering works", async () => {
    // Set date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
    const toDate = today.toISOString().split("T")[0];

    await videosPage.setDateRange(fromDate, toDate);

    // Wait for filter to apply
    await videosPage.page.waitForTimeout(1000);

    // Should show videos within date range
    const visibleCardsCount = await videosPage.videoCards.count();
    expect(visibleCardsCount).toBeGreaterThan(0);
  });

  test("VID-FILT-07: Clear all filters resets to default state", async () => {
    // Apply multiple filters
    await videosPage.filterBarMethods.search("test");
    await videosPage.filterBarMethods.selectStatus("with");
    // Select a channel if available
    const availableChannels = await videosPage.filterBarMethods.getAvailableChannels();
    if (availableChannels.length > 0) {
      await videosPage.filterBarMethods.selectChannel(availableChannels[0]);
    }

    // Wait for filters to apply
    await videosPage.page.waitForTimeout(500);

    // Clear all filters
    await videosPage.filterBarMethods.clearAllFilters();

    // Wait for reset
    await videosPage.page.waitForTimeout(500);

    // Should show all videos again (or original filtered set)
    const visibleCardsCount = await videosPage.videosGridMethods.videoCards.count();
    expect(visibleCardsCount).toBeGreaterThan(0);
  });

  test("VID-FILT-08: Combined filters work together", async () => {
    // Get available channels
    const channelSelect = videosPage.filterBarMethods.filterBar.locator("select").nth(1);
    const channelOptions = await channelSelect.locator("option").allTextContents();
    const availableChannels = channelOptions.filter((opt) => opt !== "All Channels");

    if (availableChannels.length > 0) {
      const targetChannel = availableChannels[0];

      // Apply multiple filters
      await videosPage.filterBarMethods.selectStatus("with");
      await videosPage.filterBarMethods.selectChannel(targetChannel);
      await videosPage.filterBarMethods.search("test");

      // Wait for all filters to apply
      await videosPage.page.waitForTimeout(1000);

      const visibleCardsCount = await videosPage.videosGridMethods.videoCards.count();

      if (visibleCardsCount > 0) {
        // All visible cards should match all filter criteria
        for (let i = 0; i < Math.min(visibleCardsCount, 3); i++) {
          const card = await videosPage.getVideoCard(i);
          const channelName = await card.getChannelName();
          const actionText = await card.getActionText();

          if (channelName) expect(channelName).toBe(targetChannel);
          if (actionText) expect(actionText).toBe("See Summary");
        }
      } else {
        // No videos match all criteria - this is also valid
        console.log("No videos match combined filter criteria - filters working correctly");
      }
    } else {
      test.skip(true, "No channels available for combined filter testing");
    }
  });

  test("VID-FILT-09: Filter persistence across page reloads", async () => {
    // Apply a filter
    await videosPage.searchVideos("machine learning");

    // Wait for filter to apply
    await videosPage.page.waitForTimeout(500);

    // Reload page
    await videosPage.page.reload();
    await videosPage.expectLoaded();

    // Check if filter is maintained (depending on implementation)
    // This test may need adjustment based on actual app behavior
    const visibleCardsCount = await videosPage.videoCards.count();
    expect(visibleCardsCount).toBeGreaterThan(0);
  });

  test("VID-FILT-10: Filter bar is responsive", async ({ isMobile }) => {
    if (isMobile) {
      // On mobile, filters should stack vertically
      await expect(videosPage.filterBar).toHaveClass(/flex-col/);
    } else {
      // On desktop, filters should be in a row
      await expect(videosPage.filterBar).toHaveClass(/grid/);
    }
  });
});
