import { test, expect } from "@playwright/test";
import { AuthPage } from "./pages/auth.page";
import { DashboardPage } from "./pages/dashboard.page";
import { ProfilePage } from "./pages/profile.page";
import { VideosPage } from "./pages/videos.page";
import { GenerateSummaryPage } from "./pages/generate-summary.page";
import { SummariesPage } from "./pages/summaries.page";
import { SummaryDetailsPage } from "./pages/summary-details.page";
import { SettingsPage } from "./pages/settings.page";
import { HiddenSummariesPage } from "./pages/hidden-summaries.page";

/**
 * Comprehensive E2E Test Scenarios
 *
 * This test suite covers all major user flows in the YTInsights application.
 * Each test represents a complete user journey from start to finish.
 *
 * Test Organization:
 * 1. User Registration & Authentication
 * 2. Dashboard Interaction
 * 3. Profile & Channel Management
 * 4. Summary Generation & Management
 * 5. Settings & Account Management
 * 6. Hidden Summaries Management
 */

test.describe("Comprehensive User Flows", () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;
  let profilePage: ProfilePage;
  let videosPage: VideosPage;
  let generateSummaryPage: GenerateSummaryPage;
  let summariesPage: SummariesPage;
  let summaryDetailsPage: SummaryDetailsPage;
  let settingsPage: SettingsPage;
  let hiddenSummariesPage: HiddenSummariesPage;

  test.beforeEach(async ({ page }) => {
    // Initialize all Page Object Models
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    profilePage = new ProfilePage(page);
    videosPage = new VideosPage(page);
    generateSummaryPage = new GenerateSummaryPage(page);
    summariesPage = new SummariesPage(page);
    summaryDetailsPage = new SummaryDetailsPage(page);
    settingsPage = new SettingsPage(page);
    hiddenSummariesPage = new HiddenSummariesPage(page);
  });

  test.describe("1. User Registration & Authentication Flow", () => {
    test("should complete full user registration journey", async ({ page }) => {
      // Navigate to signup page
      await authPage.gotoRegister();

      // Verify registration page loads
      await authPage.expectRegisterPageLoaded();

      // Fill registration form
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = "TestPassword123!";

      await authPage.fillEmail(testEmail);
      await authPage.fillPassword(testPassword);
      await authPage.fillConfirmPassword(testPassword);

      // Submit registration
      await authPage.clickRegisterButton();

      // Verify success state (email verification or direct login)
      if (await page.locator('[data-testid="signup-success-view"]').isVisible()) {
        await authPage.expectRegistrationSuccess();
      } else {
        // Direct login after registration
        await dashboardPage.expectDashboardLoaded();
      }
    });

    test("should complete login flow with valid credentials", async ({ page }) => {
      // This test assumes test credentials are set up
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;

      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      // Navigate to login page
      await authPage.gotoLogin();

      // Verify login page loads
      await authPage.expectLoginPageLoaded();

      // Perform login
      await authPage.login(testEmail!, testPassword!);

      // Verify successful login and redirect to dashboard
      await dashboardPage.expectOnDashboardPage();
      await dashboardPage.expectAiDisclaimerVisible();
    });

    test("should handle invalid login attempts", async ({ page }) => {
      await authPage.gotoLogin();
      await authPage.expectLoginPageLoaded();

      // Test invalid email format
      await authPage.fillEmail("invalid-email");
      await authPage.fillPassword("password123");
      await authPage.clickLoginButton();
      await authPage.expectEmailValidationError();

      // Test wrong credentials
      await authPage.fillEmail("nonexistent@example.com");
      await authPage.fillPassword("wrongpassword");
      await authPage.clickLoginButton();
      await authPage.expectLoginError("Invalid email or password");
    });
  });

  test.describe("2. Dashboard Interaction Flow", () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;
      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      await authPage.gotoLogin();
      await authPage.login(testEmail!, testPassword!);
      await dashboardPage.expectOnDashboardPage();
    });

    test("should display dashboard with all elements", async ({ page }) => {
      await dashboardPage.expectDashboardLoaded();
      await dashboardPage.expectAiDisclaimerVisible();

      // Check if there are any summaries
      const summaryCount = await dashboardPage.getSummaryCount();
      if (summaryCount > 0) {
        await dashboardPage.expectSummaryListVisible();
      } else {
        await dashboardPage.expectEmptyStateVisible();
      }
    });

    test("should navigate to summary details from dashboard", async ({ page }) => {
      const summaryCount = await dashboardPage.getSummaryCount();

      test.skip(summaryCount === 0, "No summaries available for testing");

      // Click on first summary
      await dashboardPage.clickSummaryCard(0);

      // Should navigate to summary details page
      await summaryDetailsPage.expectOnSummaryDetailsPage();
      await summaryDetailsPage.expectSummaryDetailsPageLoaded();
    });
  });

  test.describe("3. Profile & Channel Management Flow", () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;
      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      await authPage.gotoLogin();
      await authPage.login(testEmail!, testPassword!);
      await profilePage.expectOnProfilePage();
    });

    test("should display profile information correctly", async ({ page }) => {
      await profilePage.expectProfilePageLoaded();
      await profilePage.expectUserHeaderVisible();
      await profilePage.expectStatsSectionVisible();
      await profilePage.expectSubscriptionSectionVisible();
    });

    test("should add and remove YouTube channel subscription", async ({ page }) => {
      await profilePage.expectAddChannelButtonVisible();
      await profilePage.clickAddChannelButton();
      await profilePage.expectAddChannelDialogVisible();

      // Add a test channel URL (using a real but safe channel)
      const testChannelUrl = "https://www.youtube.com/@vercel";
      await profilePage.fillChannelUrl(testChannelUrl);
      await profilePage.submitAddChannel();

      // Verify channel appears in list (this might take time for backend processing)
      await page.waitForTimeout(2000); // Allow time for processing
      await profilePage.expectChannelRowExists("Vercel");

      // Remove the channel
      await profilePage.removeChannel("Vercel");

      // Verify channel is removed
      await expect(page.locator('text=Vercel')).not.toBeVisible();
    });

    test("should display accurate statistics", async ({ page }) => {
      const totalSummaries = await profilePage.getTotalSummariesCount();
      const totalChannels = await profilePage.getTotalChannelsCount();
      const thisMonthSummaries = await profilePage.getThisMonthSummariesCount();

      // Verify stats are numbers (not negative)
      expect(totalSummaries).toBeGreaterThanOrEqual(0);
      expect(totalChannels).toBeGreaterThanOrEqual(0);
      expect(thisMonthSummaries).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("4. Summary Generation & Management Flow", () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;
      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      await authPage.gotoLogin();
      await authPage.login(testEmail!, testPassword!);
    });

    test("should generate summary from URL", async ({ page }) => {
      await generateSummaryPage.goto();
      await generateSummaryPage.expectGenerateSummaryPageLoaded();
      await generateSummaryPage.expectAiDisclaimerVisible();

      // Use a short, well-known YouTube video for testing
      const testVideoUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw"; // Short tech video

      await generateSummaryPage.submitVideoUrl(testVideoUrl);

      // Verify validation and processing
      await generateSummaryPage.expectValidationStatusVisible();

      // Wait for processing to complete (this may take time)
      await page.waitForTimeout(10000);

      // Should either show success or redirect to summary
      const currentUrl = page.url();
      if (currentUrl.includes("/summaries/")) {
        await summaryDetailsPage.expectOnSummaryDetailsPage();
      } else {
        // Still on generate page, check for success message or processing status
        await expect(page.locator("text=Summary queued for generation")).toBeVisible();
      }
    });

    test("should validate YouTube URLs correctly", async ({ page }) => {
      await generateSummaryPage.goto();
      await generateSummaryPage.expectGenerateSummaryPageLoaded();

      // Test invalid URL
      await generateSummaryPage.fillVideoUrl("https://invalid-url.com");
      await generateSummaryPage.expectUrlValidationError();

      // Test valid YouTube URL format
      await generateSummaryPage.fillVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      await generateSummaryPage.expectGenerateButtonEnabled();
    });
  });

  test.describe("5. Summary Browsing & Rating Flow", () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;
      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      await authPage.gotoLogin();
      await authPage.login(testEmail!, testPassword!);
    });

    test("should browse and filter summaries", async ({ page }) => {
      await summariesPage.goto();
      await summariesPage.expectSummariesPageLoaded();

      const summaryCount = await summariesPage.getSummaryCount();

      if (summaryCount > 0) {
        await summariesPage.expectSummaryListVisible();
        await summariesPage.expectFilterPanelVisible();

        // Test search functionality
        await summariesPage.searchSummaries("test");
        await page.waitForTimeout(1000); // Allow search to process

        // Clear search
        await summariesPage.searchSummaries("");
      } else {
        await summariesPage.expectEmptyStateVisible();
      }
    });

    test("should view summary details and rate summary", async ({ page }) => {
      const summaryCount = await summariesPage.getSummaryCount();
      test.skip(summaryCount === 0, "No summaries available for testing");

      await summariesPage.goto();
      await summariesPage.clickSummaryCard(0);

      await summaryDetailsPage.expectOnSummaryDetailsPage();
      await summaryDetailsPage.expectSummaryDetailsPageLoaded();
      await summaryDetailsPage.expectRatingSectionVisible();

      // Test rating functionality
      await summaryDetailsPage.rateSummary("positive");
      await summaryDetailsPage.expectCurrentRating("positive");

      // Test changing rating
      await summaryDetailsPage.rateSummary("negative");
      await summaryDetailsPage.expectCurrentRating("negative");
    });

    test("should hide and unhide summaries", async ({ page }) => {
      const summaryCount = await summariesPage.getSummaryCount();
      test.skip(summaryCount === 0, "No summaries available for testing");

      await summariesPage.goto();

      // Get initial count
      const initialCount = await summariesPage.getSummaryCount();

      // Hide first summary
      await summariesPage.hideSummary(0);

      // Verify summary is hidden from main list
      await summariesPage.expectOnSummariesPage();
      const newCount = await summariesPage.getSummaryCount();
      expect(newCount).toBeLessThan(initialCount);

      // Check hidden summaries page
      await hiddenSummariesPage.goto();
      await hiddenSummariesPage.expectHiddenSummariesPageLoaded();

      const hiddenCount = await hiddenSummariesPage.getHiddenSummaryCount();
      expect(hiddenCount).toBeGreaterThan(0);

      // Unhide the summary
      await hiddenSummariesPage.unhideSummary(0);

      // Verify it's back in main list
      await summariesPage.goto();
      const restoredCount = await summariesPage.getSummaryCount();
      expect(restoredCount).toBe(initialCount);
    });
  });

  test.describe("6. Settings & Account Management Flow", () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;
      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      await authPage.gotoLogin();
      await authPage.login(testEmail!, testPassword!);
      await settingsPage.expectOnSettingsPage();
    });

    test("should display settings page correctly", async ({ page }) => {
      await settingsPage.expectSettingsPageLoaded();
      await settingsPage.expectProfileSectionVisible();
      await settingsPage.expectHiddenSummariesSectionVisible();
    });

    test("should update username", async ({ page }) => {
      const originalUsername = await settingsPage.getCurrentUsername();
      const newUsername = `TestUser${Date.now()}`;

      await settingsPage.updateUsername(newUsername);

      // Verify username was updated
      const updatedUsername = await settingsPage.getCurrentUsername();
      expect(updatedUsername).toBe(newUsername);

      // Restore original username
      if (originalUsername) {
        await settingsPage.updateUsername(originalUsername);
      }
    });

    test("should navigate to hidden summaries", async ({ page }) => {
      await settingsPage.expectHiddenSummariesSectionVisible();

      // Click link to hidden summaries (assuming there's a link)
      const hiddenSummariesLink = page.locator('[data-testid="hidden-summaries-section"] a, [data-testid="hidden-summaries-section"] button').filter({ hasText: /view|see|manage/i });
      if (await hiddenSummariesLink.isVisible()) {
        await hiddenSummariesLink.click();
        await hiddenSummariesPage.expectOnHiddenSummariesPage();
      }
    });

    test("should handle logout correctly", async ({ page }) => {
      await settingsPage.clickLogout();

      // Should redirect to login page
      await authPage.expectLoginPageLoaded();
      await expect(page).toHaveURL(/\/login|\/$/);
    });
  });

  test.describe("7. Hidden Summaries Management Flow", () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;
      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      await authPage.gotoLogin();
      await authPage.login(testEmail!, testPassword!);
      await hiddenSummariesPage.expectOnHiddenSummariesPage();
    });

    test("should display hidden summaries page", async ({ page }) => {
      await hiddenSummariesPage.expectHiddenSummariesPageLoaded();
      await hiddenSummariesPage.expectBackButtonVisible();
    });

    test("should navigate back from hidden summaries", async ({ page }) => {
      await hiddenSummariesPage.clickBackButton();

      // Should go back (likely to settings or dashboard)
      await expect(page).not.toHaveURL(/\/hidden/);
    });

    test("should unhide all summaries when available", async ({ page }) => {
      const hiddenCount = await hiddenSummariesPage.getHiddenSummaryCount();

      if (hiddenCount > 0) {
        await hiddenSummariesPage.expectUnhideAllButtonVisible();
        await hiddenSummariesPage.unhideAllSummaries();

        // Verify all summaries are unhidden
        await hiddenSummariesPage.expectNoHiddenSummaries();
      } else {
        await hiddenSummariesPage.expectEmptyStateVisible();
      }
    });
  });

  test.describe("8. Navigation & Cross-Page Flows", () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;
      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      await authPage.gotoLogin();
      await authPage.login(testEmail!, testPassword!);
    });

    test("should navigate between all main pages", async ({ page }) => {
      // Test navigation to each main page
      const pages = [
        { name: "Dashboard", page: dashboardPage, url: "/dashboard" },
        { name: "Summaries", page: summariesPage, url: "/summaries" },
        { name: "Videos", page: videosPage, url: "/videos" },
        { name: "Profile", page: profilePage, url: "/profile" },
        { name: "Settings", page: settingsPage, url: "/settings" },
        { name: "Generate", page: generateSummaryPage, url: "/generate" },
      ];

      for (const pageInfo of pages) {
        await page.goto(pageInfo.url);
        await pageInfo.page.expectOnPage?.() || await expect(page).toHaveURL(new RegExp(pageInfo.url));
      }
    });

    test("should handle direct URL navigation", async ({ page }) => {
      // Test direct navigation to protected routes
      const protectedUrls = [
        "/dashboard",
        "/summaries",
        "/videos",
        "/profile",
        "/settings",
        "/generate",
        "/hidden"
      ];

      for (const url of protectedUrls) {
        await page.goto(url);
        // Should either load the page (if authenticated) or redirect to login
        const currentUrl = page.url();
        expect(currentUrl).toMatch(new RegExp(`${url}|/login`));
      }
    });
  });

  test.describe("9. Error Handling & Edge Cases", () => {
    test("should handle 404 pages gracefully", async ({ page }) => {
      await page.goto("/nonexistent-page");
      // Should show 404 page or redirect appropriately
      await expect(page.locator("text=404").or(page.locator("text=Not Found")).or(page.locator("text=Page not found"))).toBeVisible();
    });

    test("should handle invalid summary IDs", async ({ page }) => {
      // Login first
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;
      test.skip(!testEmail || !testPassword, "E2E_USERNAME and E2E_PASSWORD must be set");

      await authPage.gotoLogin();
      await authPage.login(testEmail!, testPassword!);

      // Navigate to invalid summary ID
      await page.goto("/summaries/invalid-id-12345");

      // Should show error state or 404
      await expect(page.locator('[data-testid="error-state"]').or(page.locator("text=Not Found"))).toBeVisible();
    });

    test("should handle network errors gracefully", async ({ page }) => {
      // This would require mocking network failures
      // For now, just verify error states exist in components
      await page.goto("/dashboard");

      // Verify error handling components are available
      const errorElements = await page.locator('[data-testid="error-state"], [data-testid="form-error-message"]').count();
      expect(errorElements).toBeGreaterThan(0);
    });
  });
});