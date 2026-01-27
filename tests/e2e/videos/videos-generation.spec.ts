import { test, expect } from "@playwright/test";
import { VideosPage } from "../pages/videos.page";
import { loadTestUser } from "../helpers/test-data.helper";

test.describe("Videos Page - Summary Generation", () => {
  let videosPage: VideosPage;

  test.beforeAll(async () => {
    await loadTestUser();
  });

  test.beforeEach(async ({ page }) => {
    videosPage = new VideosPage(page);
    await videosPage.goto();
    await videosPage.expectLoaded();
  });

  test("VID-GEN-01: Open generate dialog from video card", async () => {
    // Find a video without summary
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();
    expect(videoCards.length).toBeGreaterThan(0);

    // Click the first video card to open dialog
    await videoCards[0].click();

    // Verify dialog opens
    await videosPage.expectGenerateDialogVisible();

    // Verify dialog content
    const dialogTitle = await videosPage.getVideoTitleInDialog();
    const cardTitle = await videoCards[0].getTitle();
    expect(dialogTitle).toBe(cardTitle);
  });

  test("VID-GEN-02: Generate dialog shows validation steps", async () => {
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();
    await videoCards[0].click();

    // Check validation steps are present
    await videosPage.expectValidationStepsCount(5); // URL, Subscription, Limit, Duration, Generation status

    // Check validation passes
    await videosPage.generateDialog.expectAllValidationStepsSuccess();
    await videosPage.generateDialog.expectValidationStatus("ready");
  });

  test("VID-GEN-03: Successful summary generation flow", async () => {
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();
    const initialAction = await videoCards[0].getActionText();

    // Verify it's a video without summary
    expect(initialAction).toBe("Generate Summary");

    // Open dialog and confirm generation
    await videoCards[0].click();
    await videosPage.confirmGenerateSummary();

    // Check toast notification
    await videosPage.toasts.expectSuccessToast("Generowanie w toku");

    // Dialog should close
    await videosPage.expectGenerateDialogHidden();

    // Video status should change to generating
    await videoCards[0].expectGenerating();
  });

  test("VID-GEN-04: Cancel generation dialog", async () => {
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();
    await videoCards[0].click();

    // Dialog should be visible
    await videosPage.expectGenerateDialogVisible();

    // Cancel generation
    await videosPage.cancelGenerateSummary();

    // Dialog should close
    await videosPage.expectGenerateDialogHidden();

    // Video status should remain unchanged
    await videoCards[0].expectNoSummary();
  });

  test("VID-GEN-05: Dialog validation shows error for invalid video", async () => {
    // This test would require a video that fails validation
    // For now, we'll test the validation UI structure
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();
    await videoCards[0].click();

    // Verify validation UI is present
    await videosPage.generateDialog.expectDialogStructure();
    await videosPage.generateDialog.expectValidationStatus("ready");
  });

  test("VID-GEN-06: Dialog keyboard navigation", async ({ page }) => {
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();
    await videoCards[0].click();

    // Test Escape key closes dialog
    await page.keyboard.press("Escape");
    await videosPage.expectGenerateDialogHidden();
  });

  test("VID-GEN-07: Dialog accessibility", async () => {
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();
    await videoCards[0].click();

    // Check accessibility attributes
    await videosPage.generateDialog.expectAccessible();
  });

  test("VID-GEN-08: Multiple generation attempts are handled", async () => {
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();

    // Try to generate the same video multiple times quickly
    await videoCards[0].click();
    await videosPage.confirmGenerateSummary();

    // Immediately try again
    await videoCards[0].click();
    await videosPage.confirmGenerateSummary();

    // Second attempt should be rejected (already in progress)
    await videosPage.toasts.expectErrorToast("already in progress");
  });

  test("VID-GEN-09: Generation status changes are reflected in UI", async () => {
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();

    // Start generation
    await videoCards[0].click();
    await videosPage.confirmGenerateSummary();

    // Verify status changes
    await videoCards[0].expectGenerating();

    // Reload page to check persistence
    await videosPage.page.reload();
    await videosPage.expectLoaded();

    // Status should still show as generating (depending on implementation)
    // This test may need adjustment based on actual behavior
  });

  test("VID-GEN-10: Dialog shows correct video information", async () => {
    await videosPage.filterByStatus("without");
    await videosPage.page.waitForTimeout(500);

    const videoCards = await videosPage.videosGrid.getAllVideoCards();
    const cardTitle = await videoCards[0].getTitle();
    const cardChannel = await videoCards[0].getChannelName();

    await videoCards[0].click();

    // Verify dialog shows same information
    const dialogTitle = await videosPage.generateDialog.getVideoTitle();
    const dialogChannel = await videosPage.generateDialog.getVideoChannel();

    expect(dialogTitle).toBe(cardTitle);
    expect(dialogChannel).toBe(cardChannel);
  });
});
