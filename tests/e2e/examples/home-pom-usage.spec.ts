import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Examples of using Home Page POM components
 * This file demonstrates how to use the granular components for testing the home page
 */
test.describe("Home Page POM Usage Examples", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("Example: Complete page validation workflow", async () => {
    // 1. Verify page loads correctly
    await homePage.expectLoaded();
    await homePage.expectTitle("Video Summary");

    // 2. Verify all sections are visible
    await homePage.heroSection.expectVisible();
    await homePage.featuresSection.expectVisible();
    await homePage.ctaSection.expectVisible();
    await homePage.footer.expectVisible();

    // 3. Verify Hero Section content
    await homePage.heroSection.expectHeading("Video Summary");
    await homePage.heroSection.expectPersonalUseMessaging();
    await homePage.heroSection.expectCTAButtonsVisible();

    // 4. Verify Features Section
    await homePage.featuresSection.expectFeatureCardsCount(3);
    await homePage.featuresSection.expectAllThreeFeatures();

    // 5. Verify Footer
    await homePage.footer.expectBrandSectionVisible();
    await homePage.footer.expectProductLinksVisible();
    await homePage.footer.expectCurrentYearInCopyright();
  });

  test("Example: Testing user journey - Hero to Signup", async () => {
    // 1. User lands on home page
    await homePage.expectLoaded();

    // 2. User reads Hero Section
    await homePage.heroSection.expectHeading("Video Summary");

    // 3. User hovers over Get Started button
    await homePage.heroSection.hoverGetStartedButton();

    // 4. User clicks Get Started button
    await homePage.heroSection.clickGetStartedButton();

    // 5. Verify navigation to signup
    await homePage.page.waitForURL("/signup");
    await expect(homePage.page).toHaveURL(/\/signup/);
  });

  test("Example: Testing feature card interactions", async () => {
    const featuresSection = homePage.featuresSection;

    // Get all feature cards
    const card1 = await featuresSection.getFeatureCardByIndex(0);
    const card2 = await featuresSection.getFeatureCardByIndex(1);
    const card3 = await featuresSection.getFeatureCardByIndex(2);

    // Test hover effects on each card
    await card1.hover();
    await homePage.page.waitForTimeout(300);

    await card2.hover();
    await homePage.page.waitForTimeout(300);

    await card3.hover();
    await homePage.page.waitForTimeout(300);

    // Get card content
    const title1 = await featuresSection.getFeatureCardHeading(0);
    const title2 = await featuresSection.getFeatureCardHeading(1);
    const title3 = await featuresSection.getFeatureCardHeading(2);

    expect(title1).toContain("AI-Powered Summaries");
    expect(title2).toContain("YouTube Integration");
    expect(title3).toContain("Daily Automation");
  });

  test("Example: Testing CTA Section variations", async () => {
    const ctaSection = homePage.ctaSection;

    // Verify section is visible
    await ctaSection.expectVisible();

    // Test both buttons
    const buttons = [
      { action: () => ctaSection.clickStartSummarizingButton(), expectedUrl: "/signup" },
      { action: () => ctaSection.clickSignInButton(), expectedUrl: "/login" },
    ];

    for (const button of buttons) {
      // Reload page for each test
      await homePage.goto();

      // Click button
      await button.action();

      // Verify navigation
      await homePage.page.waitForURL(button.expectedUrl);
      await expect(homePage.page).toHaveURL(button.expectedUrl);
    }
  });

  test("Example: Testing Footer links systematically", async () => {
    const footer = homePage.footer;

    // Get all product links
    const productLinks = await footer.getAllProductLinks();
    console.log("Product links:", productLinks);

    // Get all legal links
    const legalLinks = await footer.getAllLegalLinks();
    console.log("Legal links:", legalLinks);

    // Verify specific links
    expect(productLinks).toContain("/dashboard");
    expect(productLinks).toContain("/summaries");
    expect(legalLinks).toContain("/terms");
    expect(legalLinks).toContain("/privacy");

    // Test clicking a link
    await footer.clickTermsLink();
    await homePage.page.waitForURL("/terms");
    await expect(homePage.page).toHaveURL("/terms");
  });

  test("Example: Testing responsive behavior", async ({ page }) => {
    // Test Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await homePage.expectLoaded();
    await homePage.featuresSection.expectFeaturesGridColumns(3);

    // Test Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await homePage.expectLoaded();
    await homePage.featuresSection.expectFeaturesGridColumns(1);

    // Verify no horizontal scroll on mobile
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test("Example: Testing accessibility features", async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press("Tab");
    const firstFocused = page.locator(":focus");
    await expect(firstFocused).toHaveAttribute("href");

    // Test semantic structure
    await homePage.expectPageStructure();

    // Test icon accessibility
    await homePage.heroSection.expectAccessibleIcons();
    await homePage.ctaSection.expectAccessibleIcons();

    // Test ARIA labels
    await homePage.footer.expectAccessibleNavigation();
  });

  test("Example: Testing performance metrics", async () => {
    const startTime = Date.now();
    await homePage.goto();
    await homePage.expectLoaded();
    const loadTime = Date.now() - startTime;

    console.log(`Page loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);

    // Get detailed metrics
    const metrics = await homePage.page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      };
    });

    console.log("Performance metrics:", metrics);
    expect(metrics.domContentLoaded).toBeLessThan(2000);
  });

  test("Example: Testing error handling", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await homePage.goto();
    await homePage.expectLoaded();

    // Interact with page
    await homePage.heroSection.clickGetStartedButton();
    await page.waitForURL("/signup");

    // Go back
    await page.goBack();
    await homePage.expectLoaded();

    // Check for errors
    console.log(`Found ${errors.length} errors`, errors);
    expect(errors).toHaveLength(0);
  });

  test("Example: Visual regression testing", async ({ page }) => {
    await homePage.expectLoaded();

    // Take screenshots of different sections
    await homePage.heroSection.heroSection.screenshot({ path: "screenshots/hero-section.png" });
    await homePage.featuresSection.featuresSection.screenshot({ path: "screenshots/features-section.png" });
    await homePage.ctaSection.ctaSection.screenshot({ path: "screenshots/cta-section.png" });

    // Full page screenshot
    await page.screenshot({ path: "screenshots/home-page-full.png", fullPage: true });
  });

  test("Example: Testing complex user flow", async () => {
    // 1. User lands on home page
    await homePage.expectLoaded();

    // 2. User scrolls through features
    await homePage.featuresSection.featuresSection.scrollIntoViewIfNeeded();
    await homePage.page.waitForTimeout(500);

    // 3. User reads feature cards
    await homePage.featuresSection.expectAllThreeFeatures();

    // 4. User hovers over feature cards
    for (let i = 0; i < 3; i++) {
      await homePage.featuresSection.hoverFeatureCard(i);
      await homePage.page.waitForTimeout(200);
    }

    // 5. User scrolls to CTA
    await homePage.ctaSection.ctaSection.scrollIntoViewIfNeeded();
    await homePage.page.waitForTimeout(500);

    // 6. User decides to sign up
    await homePage.ctaSection.clickStartSummarizingButton();

    // 7. Verify navigation
    await homePage.page.waitForURL("/signup");
    await expect(homePage.page).toHaveURL(/\/signup/);
  });
});
