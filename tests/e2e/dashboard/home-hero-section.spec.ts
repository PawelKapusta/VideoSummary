import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Hero Section on Home Page
 * Covers heading, description, icons, and CTA buttons
 */
test.describe("Home Page - Hero Section", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-HOME-005: Hero Section displays all content correctly", async () => {
    const heroSection = homePage.heroSection;

    // Verify section is visible
    await heroSection.expectVisible();

    // Verify gradient background
    await heroSection.expectGradientBackground();

    // Verify video icon
    await heroSection.expectVideoIcon();

    // Verify heading
    await heroSection.expectHeading("Video Summary");

    // Verify description contains key messaging
    await heroSection.expectDescriptionContains("Get AI-powered summaries");
    await heroSection.expectPersonalUseMessaging();
  });

  test("TC-HOME-006: Get Started Free button works correctly", async () => {
    const heroSection = homePage.heroSection;

    // Verify button is visible and styled correctly
    await heroSection.expectCTAButtonsVisible();
    await heroSection.expectGetStartedButtonText("Get Started Free");
    await heroSection.expectGetStartedButtonStyling();

    // Click button and verify navigation
    await heroSection.clickGetStartedButton();
    await homePage.page.waitForURL("/signup");
    await expect(homePage.page).toHaveURL(/\/signup/);
  });

  test("TC-HOME-007: Sign In button works correctly", async () => {
    const heroSection = homePage.heroSection;

    // Verify button is visible and styled correctly
    await heroSection.expectCTAButtonsVisible();
    await heroSection.expectSignInButtonText("Sign In");
    await heroSection.expectSignInButtonStyling();

    // Click button and verify navigation
    await heroSection.clickSignInButton();
    await homePage.page.waitForURL("/login");
    await expect(homePage.page).toHaveURL(/\/login/);
  });

  test("TC-HOME-025: Hero Section has responsive font sizes", async () => {
    const heroSection = homePage.heroSection;

    // Verify responsive classes
    await heroSection.expectHeadingFontSize();
    await heroSection.expectDescriptionFontSize();
  });

  test("TC-HOME-027: Hero Section buttons support keyboard navigation", async () => {
    // Tab to first button
    await homePage.page.keyboard.press("Tab");
    const firstFocused = homePage.page.locator(":focus");
    await expect(firstFocused).toHaveAttribute("href", "/signup");

    // Tab to second button
    await homePage.page.keyboard.press("Tab");
    const secondFocused = homePage.page.locator(":focus");
    await expect(secondFocused).toHaveAttribute("href", "/login");

    // Activate with Enter
    await homePage.page.keyboard.press("Enter");
    await homePage.page.waitForURL("/login");
    await expect(homePage.page).toHaveURL(/\/login/);
  });

  test("TC-HOME-028: Hero Section icons are accessible", async () => {
    const heroSection = homePage.heroSection;

    await heroSection.expectVisible();
    await heroSection.expectAccessibleIcons();
  });

  test("TC-HOME-029: Hero Section has proper spacing", async () => {
    const heroSection = homePage.heroSection;

    await heroSection.expectSpacing();
    await heroSection.expectMaxWidthContainer();
    await heroSection.expectCenterAlignment();
  });

  test("TC-HOME-030: Hero Section buttons have icons", async () => {
    const heroSection = homePage.heroSection;

    await heroSection.expectButtonsHaveIcons();
  });

  test("TC-HOME-040: Navigation to signup from Hero Section", async () => {
    await homePage.navigateToSignup();
  });

  test("TC-HOME-041: Navigation to login from Hero Section", async () => {
    await homePage.navigateToLogin();
  });
});
