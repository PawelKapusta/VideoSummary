import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Features Section on Home Page
 * Covers the three feature cards and their content
 */
test.describe("Home Page - Features Section", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-HOME-008: Features Section displays correctly", async () => {
    const featuresSection = homePage.featuresSection;

    // Verify section is visible
    await featuresSection.expectVisible();

    // Verify section heading
    await featuresSection.expectSectionHeading("Why Choose Video Summary?");

    // Verify description
    await featuresSection.expectSectionDescriptionContains("personal use");

    // Verify all three feature cards
    await featuresSection.expectFeatureCardsCount(3);
  });

  test("TC-HOME-009: Feature 1 - AI-Powered Summaries", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.expectAIPoweredFeature();

    // Verify icon
    const aiCard = featuresSection.aiPoweredCard;
    await featuresSection.expectFeatureIconStyling(aiCard);
  });

  test("TC-HOME-010: Feature 2 - YouTube Integration", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.expectYouTubeIntegrationFeature();

    // Verify icon
    const ytCard = featuresSection.youtubeIntegrationCard;
    await featuresSection.expectFeatureIconStyling(ytCard);
  });

  test("TC-HOME-011: Feature 3 - Daily Automation", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.expectDailyAutomationFeature();

    // Verify icon
    const dailyCard = featuresSection.dailyAutomationCard;
    await featuresSection.expectFeatureIconStyling(dailyCard);
  });

  test("TC-HOME-012: Feature cards have hover effects", async () => {
    const featuresSection = homePage.featuresSection;

    // Test hover on first card
    await featuresSection.hoverFeatureCard(0);
    await featuresSection.expectHoverEffect(0);

    // Test hover on second card
    await featuresSection.hoverFeatureCard(1);
    await featuresSection.expectHoverEffect(1);

    // Test hover on third card
    await featuresSection.hoverFeatureCard(2);
    await featuresSection.expectHoverEffect(2);
  });

  test("TC-HOME-022: Features Section - Desktop layout (3 columns)", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    const featuresSection = homePage.featuresSection;
    await featuresSection.expectFeaturesGridColumns(3);
  });

  test("TC-HOME-024: Features Section - Mobile layout (1 column)", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const featuresSection = homePage.featuresSection;
    await featuresSection.expectFeaturesGridColumns(1);
  });

  test("TC-HOME-026: Features Section has proper heading hierarchy", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.expectAccessibleHeadings();
  });

  test("TC-HOME-027: Feature cards have proper styling", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.expectFeatureCardStyling();
    await featuresSection.expectGrayBackground();
    await featuresSection.expectSpacing();
    await featuresSection.expectMaxWidthContainer();
  });

  test("TC-HOME-028: All feature icons are visible and styled", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.expectAllIconsVisible();
    await featuresSection.expectIconColors();
  });

  test("TC-HOME-029: Features Section has proper layout", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.expectResponsiveLayout();
    await featuresSection.expectCenterAlignment();
    await featuresSection.expectCardTransition();
  });

  test("TC-HOME-038: Feature cards text overflow handling", async ({ page }) => {
    // Set very narrow viewport
    await page.setViewportSize({ width: 320, height: 568 });

    const featuresSection = homePage.featuresSection;

    // All features should still be visible without overflow
    await featuresSection.expectAllThreeFeatures();

    // Get first card and verify text doesn't overflow
    const firstCard = await featuresSection.getFeatureCardByIndex(0);
    const box = await firstCard.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(320);
    }
  });
});
