import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Responsive Design on Home Page
 * Covers different viewport sizes and responsive behavior
 */
test.describe("Home Page - Responsive Design", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-HOME-022: Desktop viewport (1920x1080)", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await homePage.expectLoaded();

    // Verify features in 3 columns
    await homePage.featuresSection.expectFeaturesGridColumns(3);

    // Verify CTA buttons in row
    await homePage.ctaSection.expectResponsiveLayout();

    // Verify footer layout
    await homePage.footer.expectResponsiveLayout();
  });

  test("TC-HOME-023: Tablet viewport (768x1024)", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await homePage.expectLoaded();

    // Features should still be in 3 columns on tablet
    await homePage.featuresSection.expectFeaturesGridColumns(3);

    // Verify readable layout
    const heroHeading = homePage.heroSection.heading;
    await expect(heroHeading).toBeVisible();
  });

  test("TC-HOME-024: Mobile viewport (375x667 - iPhone SE)", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await homePage.expectLoaded();

    // Verify features in 1 column
    await homePage.featuresSection.expectFeaturesGridColumns(1);

    // Verify CTA buttons stack
    await homePage.ctaSection.expectResponsiveLayout();

    // Verify footer stacks
    await homePage.footer.expectResponsiveLayout();

    // No horizontal scroll
    const bodyWidth = await homePage.page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test("TC-HOME-025: Font sizes are responsive", async ({ page }) => {
    // Test mobile font sizes
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await homePage.expectLoaded();

    await homePage.heroSection.expectHeadingFontSize();
    await homePage.heroSection.expectDescriptionFontSize();
    await homePage.ctaSection.expectHeadingFontSize();
    await homePage.ctaSection.expectDescriptionFontSize();

    // Test desktop font sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await homePage.expectLoaded();

    await homePage.heroSection.expectHeadingFontSize();
    await homePage.heroSection.expectDescriptionFontSize();
  });

  test("TC-HOME-038: Very narrow viewport (320x568)", async ({ page }) => {
    // Set very narrow viewport (iPhone 5/SE)
    await page.setViewportSize({ width: 320, height: 568 });
    await page.reload();
    await homePage.expectLoaded();

    // All content should be visible without overflow
    await homePage.heroSection.expectVisible();
    await homePage.featuresSection.expectVisible();
    await homePage.ctaSection.expectVisible();
    await homePage.footer.expectVisible();

    // No horizontal scroll
    const bodyWidth = await homePage.page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(320);

    // Text should wrap properly
    const heroHeading = homePage.heroSection.heading;
    const headingBox = await heroHeading.boundingBox();
    expect(headingBox).toBeTruthy();
    if (headingBox) {
      expect(headingBox.width).toBeLessThanOrEqual(320);
    }
  });

  test("TC-HOME-039: Page loads quickly on slow network", async ({ page }) => {
    // Simulate slow 3G
    await page.route("**/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    await homePage.goto();
    await homePage.expectLoaded();
    const loadTime = Date.now() - startTime;

    // Should load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(5000); // 5 seconds
  });

  test("TC-HOME-047: Cross-browser - Chromium", async ({ browserName }) => {
    test.skip(browserName !== "chromium", "This test is only for Chromium");

    await homePage.expectLoaded();
    await homePage.heroSection.expectVisible();
    await homePage.featuresSection.expectAllThreeFeatures();
  });

  test("TC-HOME-048: Cross-browser - Firefox", async ({ browserName }) => {
    test.skip(browserName !== "firefox", "This test is only for Firefox");

    await homePage.expectLoaded();
    await homePage.heroSection.expectVisible();
    await homePage.heroSection.expectGradientBackground();
  });

  test("TC-HOME-049: Cross-browser - WebKit (Safari)", async ({ browserName }) => {
    test.skip(browserName !== "webkit", "This test is only for WebKit");

    await homePage.expectLoaded();
    await homePage.heroSection.expectVisible();
    await homePage.footer.expectGradientBackground();
  });
});
