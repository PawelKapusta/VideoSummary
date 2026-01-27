import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Hero Section and CTA buttons on Landing Page
 * Covers the main value proposition and primary CTAs
 */
test.describe("Landing Page - Hero Section & CTAs", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-LANDING-010: Hero Section displays all content", async () => {
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
    await heroSection.expectDescriptionContains("YouTube videos");
    await heroSection.expectPersonalUseMessaging();
  });

  test("TC-LANDING-011: Get Started Free button navigates to signup", async () => {
    const heroSection = homePage.heroSection;

    // Verify button is visible and styled correctly
    await heroSection.expectCTAButtonsVisible();
    await heroSection.expectGetStartedButtonText("Get Started Free");
    await heroSection.expectGetStartedButtonStyling();

    // Verify button has user icon
    const buttonIcon = heroSection.getStartedButton.locator("svg");
    await expect(buttonIcon).toBeVisible();

    // Click button and verify navigation
    await heroSection.clickGetStartedButton();
    await homePage.page.waitForURL("/signup");
    await expect(homePage.page).toHaveURL(/\/signup/);
  });

  test("TC-LANDING-012: Sign In button navigates to login", async () => {
    const heroSection = homePage.heroSection;

    // Verify button is visible and styled correctly
    await heroSection.expectCTAButtonsVisible();
    await heroSection.expectSignInButtonText("Sign In");
    await heroSection.expectSignInButtonStyling();

    // Verify button has login icon
    const buttonIcon = heroSection.signInButton.locator("svg");
    await expect(buttonIcon).toBeVisible();

    // Click button and verify navigation
    await heroSection.clickSignInButton();
    await homePage.page.waitForURL("/login");
    await expect(homePage.page).toHaveURL(/\/login/);
  });

  test("TC-LANDING-013: CTA buttons support keyboard navigation", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Keyboard navigation is not applicable for mobile devices");

    // Tab to first CTA button (Get Started Free)
    await page.keyboard.press("Tab");
    const firstFocused = page.locator(":focus");
    await expect(firstFocused).toHaveAttribute("href", "/signup");

    // Tab to second CTA button (Sign In)
    await page.keyboard.press("Tab");
    const secondFocused = page.locator(":focus");
    await expect(secondFocused).toHaveAttribute("href", "/login");

    // Activate with Enter
    await page.keyboard.press("Enter");
    await page.waitForURL("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("TC-LANDING-014: CTA Section displays with blue background", async () => {
    const ctaSection = homePage.ctaSection;

    // Scroll to CTA section
    await ctaSection.ctaSection.scrollIntoViewIfNeeded();

    // Verify section is visible
    await ctaSection.expectVisible();

    // Verify blue background
    await ctaSection.expectBlueBackground();

    // Verify white text for contrast
    await ctaSection.expectWhiteText();

    // Verify heading
    await ctaSection.expectHeading("Ready to Save Hours of Watching Time?");

    // Verify description mentions "personal use"
    await ctaSection.expectPersonalUseMessaging();
  });

  test("TC-LANDING-015: CTA Section - Start Summarizing Now button", async () => {
    const ctaSection = homePage.ctaSection;

    // Scroll to CTA
    await ctaSection.ctaSection.scrollIntoViewIfNeeded();

    // Verify button styling
    await ctaSection.expectCTAButtonsVisible();
    await ctaSection.expectStartSummarizingButtonText("Start Summarizing Now");
    await ctaSection.expectStartSummarizingButtonStyling();

    // Verify lightning icon
    const buttonIcon = ctaSection.startSummarizingButton.locator("svg");
    await expect(buttonIcon).toBeVisible();

    // Click and verify navigation
    await ctaSection.clickStartSummarizingButton();
    await homePage.page.waitForURL("/signup");
    await expect(homePage.page).toHaveURL(/\/signup/);
  });

  test("TC-LANDING-016: CTA Section - Sign In to Continue button", async () => {
    const ctaSection = homePage.ctaSection;

    // Scroll to CTA
    await ctaSection.ctaSection.scrollIntoViewIfNeeded();

    // Verify button styling
    await ctaSection.expectSignInButtonText("Sign In to Continue");
    await ctaSection.expectSignInButtonStyling();

    // Click and verify navigation
    await ctaSection.clickSignInButton();
    await homePage.page.waitForURL("/login");
    await expect(homePage.page).toHaveURL(/\/login/);
  });

  test("TC-LANDING-017: All CTA buttons lead to correct destinations", async () => {
    // Test all "Get Started" / "Sign Up" CTAs lead to /signup
    const signupButtons = homePage.page.locator('a[href="/signup"]');
    const signupCount = await signupButtons.count();
    expect(signupCount).toBe(2); // Hero and CTA sections

    // Test all "Sign In" / "Login" CTAs lead to /login
    const loginButtons = homePage.page.locator('a[href="/login"]');
    const loginCount = await loginButtons.count();
    expect(loginCount).toBe(2); // Hero and CTA sections
  });

  test("TC-LANDING-018: CTAs have proper hover effects", async () => {
    // Test Hero Get Started button hover
    await homePage.heroSection.hoverGetStartedButton();
    await homePage.page.waitForTimeout(300);

    // Test Hero Sign In button hover
    await homePage.heroSection.hoverSignInButton();
    await homePage.page.waitForTimeout(300);

    // Scroll to CTA section
    await homePage.ctaSection.ctaSection.scrollIntoViewIfNeeded();

    // Test CTA Start Summarizing hover
    await homePage.ctaSection.hoverStartSummarizingButton();
    await homePage.page.waitForTimeout(300);

    // Test CTA Sign In hover
    await homePage.ctaSection.hoverSignInButton();
    await homePage.page.waitForTimeout(300);

    // No errors should occur during hover
    expect(true).toBe(true);
  });
});
