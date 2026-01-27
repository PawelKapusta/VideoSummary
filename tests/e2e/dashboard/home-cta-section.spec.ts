import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for CTA Section on Home Page
 * Covers the call-to-action section with blue background
 */
test.describe("Home Page - CTA Section", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-HOME-013: CTA Section displays correctly", async () => {
    const ctaSection = homePage.ctaSection;

    // Verify section is visible
    await ctaSection.expectVisible();

    // Verify heading
    await ctaSection.expectHeading("Ready to Save Hours of Watching Time?");

    // Verify description
    await ctaSection.expectDescriptionContains("Take control of your YouTube consumption");
    await ctaSection.expectPersonalUseMessaging();

    // Verify blue background
    await ctaSection.expectBlueBackground();
  });

  test("TC-HOME-014: Start Summarizing Now button works", async () => {
    const ctaSection = homePage.ctaSection;

    // Verify button styling
    await ctaSection.expectCTAButtonsVisible();
    await ctaSection.expectStartSummarizingButtonText("Start Summarizing Now");
    await ctaSection.expectStartSummarizingButtonStyling();

    // Click and verify navigation
    await ctaSection.clickStartSummarizingButton();
    await homePage.page.waitForURL("/signup");
    await expect(homePage.page).toHaveURL(/\/signup/);
  });

  test("TC-HOME-015: Sign In to Continue button works", async () => {
    const ctaSection = homePage.ctaSection;

    // Verify button styling
    await ctaSection.expectCTAButtonsVisible();
    await ctaSection.expectSignInButtonText("Sign In to Continue");
    await ctaSection.expectSignInButtonStyling();

    // Click and verify navigation
    await ctaSection.clickSignInButton();
    await homePage.page.waitForURL("/login");
    await expect(homePage.page).toHaveURL(/\/login/);
  });

  test("TC-HOME-023: CTA Section - Desktop responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const ctaSection = homePage.ctaSection;
    await ctaSection.expectResponsiveLayout();
  });

  test("TC-HOME-024: CTA Section - Mobile responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const ctaSection = homePage.ctaSection;
    await ctaSection.expectResponsiveLayout();
  });

  test("TC-HOME-025: CTA Section has responsive font sizes", async () => {
    const ctaSection = homePage.ctaSection;

    await ctaSection.expectHeadingFontSize();
    await ctaSection.expectDescriptionFontSize();
  });

  test("TC-HOME-027: CTA Section buttons support keyboard navigation", async () => {
    const ctaSection = homePage.ctaSection;

    // Scroll to CTA section
    await ctaSection.ctaSection.scrollIntoViewIfNeeded();

    await ctaSection.expectKeyboardNavigation();
  });

  test("TC-HOME-028: CTA Section icons are accessible", async () => {
    const ctaSection = homePage.ctaSection;

    await ctaSection.expectAccessibleIcons();
  });

  test("TC-HOME-029: CTA Section has proper contrast and styling", async () => {
    const ctaSection = homePage.ctaSection;

    // Verify white text on blue background
    await ctaSection.expectWhiteText();

    // Verify contrast ratio
    await ctaSection.expectContrastRatio();

    // Verify styling
    await ctaSection.expectCenterAlignment();
    await ctaSection.expectMaxWidthContainer();
    await ctaSection.expectSpacing();
  });

  test("TC-HOME-030: CTA Section buttons have hover effects", async () => {
    const ctaSection = homePage.ctaSection;

    // Test Start Summarizing hover
    await ctaSection.expectStartSummarizingHoverEffect();

    // Wait a bit
    await homePage.page.waitForTimeout(500);

    // Test Sign In hover
    await ctaSection.expectSignInHoverEffect();
  });

  test("TC-HOME-031: CTA Section buttons have proper icons", async () => {
    const ctaSection = homePage.ctaSection;

    await ctaSection.expectButtonsHaveIcons();
  });
});
