import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Basic tests for Home Page (/)
 * Tests fundamental rendering, structure, and core functionality
 */
test.describe("Home Page - Basic Functionality", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-HOME-001: Page loads successfully with correct structure", async () => {
    // Verify page loads without errors
    await homePage.expectLoaded();

    // Verify title
    await homePage.expectTitle("Video Summary");

    // Verify meta tags
    await homePage.expectMetaViewport();
    await homePage.expectFavicon();

    // Verify main sections are visible
    await homePage.heroSection.expectVisible();
    await homePage.featuresSection.expectVisible();
    await homePage.ctaSection.expectVisible();
    await homePage.footer.expectVisible();
  });

  test("TC-HOME-002: Header is not displayed (showNavigation=false)", async () => {
    // Verify that Header with navigation is NOT rendered
    await homePage.expectHeaderNotVisible();
    await homePage.expectNoHamburgerMenu();
  });

  test("TC-HOME-003: Footer is displayed (showFooter=true)", async () => {
    // Verify footer is visible
    await homePage.footer.expectVisible();

    // Verify footer sections
    await homePage.footer.expectBrandSectionVisible();
    await homePage.footer.expectProductLinksVisible();
    await homePage.footer.expectLegalLinksVisible();
  });

  test("TC-HOME-004: Toaster is initialized", async () => {
    // Verify toast container exists (may be empty)
    await homePage.toasts.expectContainerVisible();
  });

  test("TC-HOME-016: Footer Disclaimer is visible", async () => {
    // Verify disclaimer section at the bottom
    await homePage.expectFooterDisclaimerVisible();
  });

  test("TC-HOME-026: Semantic HTML structure is correct", async () => {
    // Verify proper HTML structure
    await homePage.expectPageStructure();
  });

  test("TC-HOME-032: No console errors on page load", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await homePage.expectLoaded();

    // Check for errors
    expect(errors).toHaveLength(0);
  });

  test("TC-HOME-033: Page has correct meta tags for SEO", async () => {
    // Verify title
    await expect(homePage.page).toHaveTitle("Video Summary");

    // Verify meta tags exist
    await homePage.expectMetaDescription();
    await homePage.expectMetaViewport();
    await homePage.expectFavicon();
  });

  test("TC-HOME-037: Page works without JavaScript", async ({ browser }) => {
    // Create new context with JavaScript disabled
    const context = await browser.newContext({
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    const homePageNoJS = new HomePage(page);

    await homePageNoJS.goto();

    // Static content should still be visible
    await homePageNoJS.heroSection.expectVisible();
    await homePageNoJS.heroSection.expectHeading("Video Summary");

    // Features should be visible
    await homePageNoJS.featuresSection.expectVisible();
    await homePageNoJS.featuresSection.expectFeatureCardsCount(3);

    // CTA should be visible
    await homePageNoJS.ctaSection.expectVisible();

    // Footer should be visible
    await homePageNoJS.footer.expectVisible();

    await context.close();
  });
});
