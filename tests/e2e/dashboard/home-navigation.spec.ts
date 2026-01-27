import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Navigation and Integration on Home Page
 * Covers navigation flows and integration with other pages
 */
test.describe("Home Page - Navigation & Integration", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-HOME-040: Navigate to /signup from Hero Section", async () => {
    await homePage.navigateToSignup();
    await expect(homePage.page).toHaveURL(/\/signup/);
  });

  test("TC-HOME-041: Navigate to /login from Hero Section", async () => {
    await homePage.navigateToLogin();
    await expect(homePage.page).toHaveURL(/\/login/);
  });

  test("TC-HOME-042: Navigate to /dashboard from Footer (redirects to login)", async () => {
    await homePage.footer.clickDashboardLink();

    // Should redirect to login since user is not authenticated
    await homePage.page.waitForURL(/\/login/);
    await expect(homePage.page).toHaveURL(/\/login/);
  });

  test("TC-HOME-043: Navigate to /terms from Footer", async () => {
    await homePage.footer.clickTermsLink();
    await homePage.page.waitForURL("/terms");
    await expect(homePage.page).toHaveURL("/terms");
  });

  test("TC-HOME-044: Navigate to /privacy from Footer", async () => {
    await homePage.footer.clickPrivacyLink();
    await homePage.page.waitForURL("/privacy");
    await expect(homePage.page).toHaveURL("/privacy");
  });

  test("TC-HOME-045: All navigation links work correctly", async () => {
    // Test Hero Section links
    const heroLinks = [
      { locator: homePage.heroSection.getStartedButton, expectedUrl: "/signup" },
      { locator: homePage.heroSection.signInButton, expectedUrl: "/login" },
    ];

    for (const link of heroLinks) {
      await homePage.goto(); // Reset
      await link.locator.click();
      await homePage.page.waitForURL(link.expectedUrl);
      await expect(homePage.page).toHaveURL(link.expectedUrl);
    }
  });

  test("TC-HOME-046: Back button navigation works", async ({ page }) => {
    // Navigate to signup
    await homePage.heroSection.clickGetStartedButton();
    await page.waitForURL("/signup");

    // Go back
    await page.goBack();
    await page.waitForURL("/");

    // Verify we're back on home page
    await homePage.expectLoaded();
  });

  test("TC-HOME-047: Brand link in footer navigates to home", async () => {
    // Navigate away first
    await homePage.heroSection.clickGetStartedButton();
    await homePage.page.waitForURL("/signup");

    // Click brand link in footer
    await homePage.footer.clickBrandLink();
    await homePage.page.waitForURL("/");

    // Verify we're on home page
    await homePage.expectLoaded();
  });

  test("TC-HOME-048: Multiple navigation actions work sequentially", async () => {
    // 1. Hero Section -> Signup
    await homePage.heroSection.clickGetStartedButton();
    await homePage.page.waitForURL("/signup");

    // 2. Back to home
    await homePage.page.goBack();
    await homePage.page.waitForURL("/");

    // 3. CTA Section -> Login
    await homePage.ctaSection.clickSignInButton();
    await homePage.page.waitForURL("/login");

    // 4. Back to home
    await homePage.page.goBack();
    await homePage.page.waitForURL("/");

    // Verify page still works
    await homePage.expectLoaded();
  });

  test("TC-HOME-049: Direct URL navigation to home page", async ({ page }) => {
    // Navigate directly via URL
    await page.goto("/");
    await homePage.expectLoaded();

    // Verify all sections are present
    await homePage.heroSection.expectVisible();
    await homePage.featuresSection.expectVisible();
    await homePage.ctaSection.expectVisible();
    await homePage.footer.expectVisible();
  });

  test("TC-HOME-050: Page maintains state during navigation", async ({ page }) => {
    // Scroll down
    await homePage.footer.footer.scrollIntoViewIfNeeded();

    // Get scroll position
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);

    // Navigate away and back
    await homePage.heroSection.clickGetStartedButton();
    await page.waitForURL("/signup");
    await page.goBack();
    await page.waitForURL("/");

    // Scroll position should be reset (new page load)
    const newScrollPosition = await page.evaluate(() => window.scrollY);
    expect(newScrollPosition).toBe(0);
  });
});
