import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Features Section on Landing Page
 * Covers the three main features: AI Summaries, YouTube Integration, Daily Automation
 */
test.describe("Landing Page - Features Section", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-LANDING-020: Features Section displays correctly", async () => {
    const featuresSection = homePage.featuresSection;

    // Scroll to features
    await featuresSection.featuresSection.scrollIntoViewIfNeeded();

    // Verify section is visible
    await featuresSection.expectVisible();

    // Verify section heading
    await featuresSection.expectSectionHeading("Why Choose Video Summary?");

    // Verify description
    await featuresSection.expectSectionDescriptionContains("Transform how you consume YouTube content");
    await featuresSection.expectPersonalUseMessaging();

    // Verify gray background
    await featuresSection.expectGrayBackground();
  });

  test("TC-LANDING-021: All three feature cards are visible", async () => {
    const featuresSection = homePage.featuresSection;

    // Scroll to features
    await featuresSection.featuresSection.scrollIntoViewIfNeeded();

    // Verify exactly 3 feature cards
    await featuresSection.expectFeatureCardsCount(3);

    // Verify all three features are visible
    await featuresSection.expectAllThreeFeatures();
  });

  test("TC-LANDING-022: Feature 1 - AI-Powered Summaries", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.featuresSection.scrollIntoViewIfNeeded();

    // Verify AI-Powered Summaries feature
    await featuresSection.expectAIPoweredFeature();

    // Verify card content
    const card = featuresSection.aiPoweredCard;
    const heading = await card.locator("h3").textContent();
    const description = await card.locator("p").textContent();

    expect(heading).toBe("AI-Powered Summaries");
    expect(description).toContain("TL;DR");
    expect(description).toContain("detailed summaries");

    // Verify icon is visible
    await featuresSection.expectFeatureIconStyling(card);
  });

  test("TC-LANDING-023: Feature 2 - YouTube Integration", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.featuresSection.scrollIntoViewIfNeeded();

    // Verify YouTube Integration feature
    await featuresSection.expectYouTubeIntegrationFeature();

    // Verify card content
    const card = featuresSection.youtubeIntegrationCard;
    const heading = await card.locator("h3").textContent();
    const description = await card.locator("p").textContent();

    expect(heading).toBe("YouTube Integration");
    expect(description).toContain("Connect up to 10 YouTube channels");

    // Verify icon is visible
    await featuresSection.expectFeatureIconStyling(card);
  });

  test("TC-LANDING-024: Feature 3 - Daily Automation", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.featuresSection.scrollIntoViewIfNeeded();

    // Verify Daily Automation feature
    await featuresSection.expectDailyAutomationFeature();

    // Verify card content
    const card = featuresSection.dailyAutomationCard;
    const heading = await card.locator("h3").textContent();
    const description = await card.locator("p").textContent();

    expect(heading).toBe("Daily Automation");
    expect(description).toContain("Automatic daily summary generation");

    // Verify icon is visible
    await featuresSection.expectFeatureIconStyling(card);
  });

  test("TC-LANDING-025: Feature cards have hover effects", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.featuresSection.scrollIntoViewIfNeeded();

    // Test hover on each card
    for (let i = 0; i < 3; i++) {
      await featuresSection.hoverFeatureCard(i);
      await homePage.page.waitForTimeout(200);
    }

    // Verify hover effect on first card
    await featuresSection.expectHoverEffect(0);
  });

  test("TC-LANDING-026: All feature icons are visible and properly styled", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.featuresSection.scrollIntoViewIfNeeded();

    // Verify all icons are visible
    await featuresSection.expectAllIconsVisible();

    // Verify icon colors (blue-600)
    await featuresSection.expectIconColors();
  });

  test("TC-LANDING-027: Feature cards are properly styled", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.featuresSection.scrollIntoViewIfNeeded();

    // Verify card styling
    await featuresSection.expectFeatureCardStyling();

    // Verify spacing and layout
    await featuresSection.expectSpacing();
    await featuresSection.expectMaxWidthContainer();
    await featuresSection.expectCenterAlignment();
  });

  test("TC-LANDING-028: Features Section has proper heading hierarchy", async () => {
    const featuresSection = homePage.featuresSection;

    await featuresSection.featuresSection.scrollIntoViewIfNeeded();

    // Verify accessible headings (H2 for section, H3 for cards)
    await featuresSection.expectAccessibleHeadings();

    // Verify H2 exists
    const h2 = featuresSection.sectionHeading;
    await expect(h2).toBeVisible();

    // Verify 3 H3 headings exist
    const h3Count = await featuresSection.featuresGrid.locator("h3").count();
    expect(h3Count).toBe(3);
  });
});
