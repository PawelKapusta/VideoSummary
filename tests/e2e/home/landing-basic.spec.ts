import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Basic tests for Public Landing Page (/)
 * Tests fundamental rendering, structure, and core functionality
 * This is a PUBLIC page - no authentication required
 */
test.describe("Landing Page (/) - Basic Functionality", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-LANDING-001: Page loads successfully with correct structure", async () => {
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

  test("TC-LANDING-002: Header navigation is NOT displayed (public page)", async () => {
    // Verify that Header with navigation is NOT rendered
    // This is a public landing page, so showNavigation=false
    await homePage.expectHeaderNotVisible();
    await homePage.expectNoHamburgerMenu();
  });

  test("TC-LANDING-003: Footer is displayed with all sections", async () => {
    // Verify footer is visible
    await homePage.footer.expectVisible();

    // Verify footer sections
    await homePage.footer.expectBrandSectionVisible();
    await homePage.footer.expectProductLinksVisible();
    await homePage.footer.expectLegalLinksVisible();
  });

  test("TC-LANDING-004: Footer Disclaimer section is visible", async () => {
    // Verify disclaimer at the bottom
    await homePage.expectFooterDisclaimerVisible();

    // Should mention "personal use" and "YouTube's Terms of Service"
    const disclaimerText = await homePage.footerDisclaimerText.textContent();
    expect(disclaimerText).toContain("personal use");
    expect(disclaimerText).toContain("YouTube's Terms of Service");
  });

  test("TC-LANDING-005: Page works without JavaScript (Progressive Enhancement)", async ({ browser }) => {
    // Create new context with JavaScript disabled
    const context = await browser.newContext({
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    const landingPage = new HomePage(page);

    await landingPage.goto();

    // Static content should still be visible (Astro SSG)
    await landingPage.heroSection.expectVisible();
    await landingPage.heroSection.expectHeading("Video Summary");

    // Features should be visible
    await landingPage.featuresSection.expectVisible();
    await landingPage.featuresSection.expectFeatureCardsCount(3);

    // CTA should be visible
    await landingPage.ctaSection.expectVisible();

    // Footer should be visible (may not be interactive)
    await landingPage.footer.expectVisible();

    await context.close();
  });

  test("TC-LANDING-006: No console errors on page load", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.reload();
    await homePage.expectLoaded();

    // Check for errors
    console.log(`Console errors: ${errors.length}`, errors);

    // Filter out known mobile-specific module loading errors
    // "TypeError: Importing a module script failed." is common in WebKit emulation
    const criticalErrors = errors.filter((e) => !e.includes("Importing a module script failed"));

    expect(criticalErrors).toHaveLength(0);
  });

  test("TC-LANDING-007: Page has correct SEO meta tags", async () => {
    // Verify title
    await expect(homePage.page).toHaveTitle("Video Summary");

    // Verify meta tags exist
    await homePage.expectMetaDescription();
    await homePage.expectMetaViewport();
    await homePage.expectFavicon();

    // Check HTML lang attribute
    const htmlLang = await homePage.page.getAttribute("html", "lang");
    expect(htmlLang).toBe("en");
  });

  test("TC-LANDING-008: Semantic HTML structure is correct", async () => {
    // Verify proper HTML structure
    await homePage.expectPageStructure();

    // Verify only one H1 in main content
    const h1Count = await homePage.page.locator("main h1").count();
    expect(h1Count).toBe(1);

    // Verify H1 text
    const h1Text = await homePage.page.locator("main h1").textContent();
    expect(h1Text).toBe("Video Summary");
  });
});
