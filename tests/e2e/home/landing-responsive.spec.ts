import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Responsive Design on Landing Page
 * Covers Desktop, Tablet, and Mobile viewports
 */
test.describe("Landing Page - Responsive Design", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test("TC-LANDING-030: Desktop viewport (1920x1080)", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await homePage.goto();
    await homePage.expectLoaded();

    // Verify Hero Section responsive layout
    await homePage.heroSection.expectResponsiveLayout();
    await homePage.heroSection.expectHeadingFontSize();

    // Verify Features in 3 columns
    await homePage.featuresSection.expectFeaturesGridColumns(3);

    // Verify CTA buttons in row
    await homePage.ctaSection.expectResponsiveLayout();

    // Verify Footer layout
    await homePage.footer.expectResponsiveLayout();
  });

  test("TC-LANDING-031: Tablet viewport (768x1024)", async ({ page }) => {
    // Set tablet viewport (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });
    await homePage.goto();
    await homePage.expectLoaded();

    // Features should still be in 3 columns on tablet (md:grid-cols-3)
    await homePage.featuresSection.expectFeaturesGridColumns(3);

    // Verify readable layout
    const heroHeading = homePage.heroSection.heading;
    await expect(heroHeading).toBeVisible();

    // All text should be readable
    const ctaHeading = homePage.ctaSection.heading;
    await expect(ctaHeading).toBeVisible();
  });

  test("TC-LANDING-032: Mobile viewport (375x667 - iPhone SE)", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await homePage.expectLoaded();

    // Verify Features in 1 column
    await homePage.featuresSection.expectFeaturesGridColumns(1);

    // Verify CTA buttons stack vertically
    await homePage.ctaSection.expectResponsiveLayout();

    // Verify Footer stacks vertically
    await homePage.footer.expectResponsiveLayout();

    // No horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test("TC-LANDING-033: Very narrow viewport (320x568 - iPhone 5/SE)", async ({ page }) => {
    // Set very narrow viewport
    await page.setViewportSize({ width: 320, height: 568 });
    await homePage.goto();
    await homePage.expectLoaded();

    // All content should be visible without overflow
    await homePage.heroSection.expectVisible();
    await homePage.featuresSection.expectVisible();
    await homePage.ctaSection.expectVisible();
    await homePage.footer.expectVisible();

    // No horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(320);

    // Text should wrap properly
    const heroHeading = homePage.heroSection.heading;
    const headingBox = await heroHeading.boundingBox();
    expect(headingBox).toBeTruthy();
    if (headingBox) {
      expect(headingBox.width).toBeLessThanOrEqual(320);
    }
  });

  test("TC-LANDING-034: Responsive font sizes", async ({ page }) => {
    // Test mobile font sizes
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await homePage.expectLoaded();

    await homePage.heroSection.expectHeadingFontSize(); // text-4xl on mobile
    await homePage.heroSection.expectDescriptionFontSize(); // text-xl on mobile
    await homePage.ctaSection.expectHeadingFontSize();

    // Test desktop font sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await homePage.expectLoaded();

    await homePage.heroSection.expectHeadingFontSize(); // text-6xl on desktop
    await homePage.heroSection.expectDescriptionFontSize(); // text-2xl on desktop
  });

  test("TC-LANDING-035: CTA buttons responsive behavior", async ({ page }) => {
    // Mobile: buttons should stack (flex-col)
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await homePage.expectLoaded();

    await homePage.heroSection.expectResponsiveLayout();
    await homePage.ctaSection.expectResponsiveLayout();

    // Desktop: buttons should be in row (sm:flex-row)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await homePage.expectLoaded();

    await homePage.heroSection.expectResponsiveLayout();
    await homePage.ctaSection.expectResponsiveLayout();
  });

  test("TC-LANDING-036: Feature cards responsive grid", async ({ page }) => {
    const featuresSection = homePage.featuresSection;

    // Mobile: 1 column
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await homePage.expectLoaded();
    await featuresSection.featuresSection.scrollIntoViewIfNeeded();
    await featuresSection.expectFeaturesGridColumns(1);

    // Desktop: 3 columns
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await homePage.expectLoaded();
    await featuresSection.featuresSection.scrollIntoViewIfNeeded();
    await featuresSection.expectFeaturesGridColumns(3);
  });

  test("TC-LANDING-037: Footer responsive layout", async ({ page }) => {
    const footer = homePage.footer;

    // Mobile: stacked layout
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await homePage.expectLoaded();
    await footer.footer.scrollIntoViewIfNeeded();
    await footer.expectResponsiveLayout();

    // Desktop: grid layout (lg:grid-cols-3)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await homePage.expectLoaded();
    await footer.footer.scrollIntoViewIfNeeded();
    await footer.expectResponsiveLayout();
  });
});
