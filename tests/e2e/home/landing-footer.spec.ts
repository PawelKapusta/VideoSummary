import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Footer on Landing Page
 * Covers AppFooter component with brand, product links, and legal links
 */
test.describe("Landing Page - Footer", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-LANDING-040: Footer displays all sections", async () => {
    const footer = homePage.footer;

    // Scroll to footer
    await footer.footer.scrollIntoViewIfNeeded();

    // Verify footer is visible
    await footer.expectVisible();

    // Verify all sections
    await footer.expectBrandSectionVisible();
    await footer.expectProductLinksVisible();
    await footer.expectLegalLinksVisible();
  });

  test("TC-LANDING-041: Brand Section content is correct", async () => {
    const footer = homePage.footer;

    await footer.footer.scrollIntoViewIfNeeded();

    // Verify brand link
    await footer.expectBrandLinkText("VideoSummary");

    // Verify description
    await footer.expectBrandDescription();

    // Verify contact email
    await footer.expectContactEmail("hello@videosummary.org");
  });

  test("TC-LANDING-042: Product links are correct", async () => {
    const footer = homePage.footer;

    await footer.footer.scrollIntoViewIfNeeded();

    // Verify 4 product links exist
    await footer.expectProductLinksCount(4);

    // Verify specific links
    await expect(footer.dashboardLink).toBeVisible();
    await expect(footer.summariesLink).toBeVisible();
    await expect(footer.generateLink).toBeVisible();
    await expect(footer.profileLink).toBeVisible();

    // Verify hrefs
    await expect(footer.dashboardLink).toHaveAttribute("href", "/dashboard");
    await expect(footer.summariesLink).toHaveAttribute("href", "/summaries");
    await expect(footer.generateLink).toHaveAttribute("href", "/generate");
    await expect(footer.profileLink).toHaveAttribute("href", "/profile");
  });

  test("TC-LANDING-043: Legal & Support links are correct", async () => {
    const footer = homePage.footer;

    await footer.footer.scrollIntoViewIfNeeded();

    // Verify 4 legal/support links exist
    await footer.expectLegalLinksCount(4);

    // Verify specific links
    await expect(footer.termsLink).toBeVisible();
    await expect(footer.privacyLink).toBeVisible();
    await expect(footer.supportEmailLink).toBeVisible();
    await expect(footer.privacyEmailLink).toBeVisible();
  });

  test("TC-LANDING-044: Copyright displays current year", async () => {
    const footer = homePage.footer;

    await footer.footer.scrollIntoViewIfNeeded();

    // Verify current year in copyright
    await footer.expectCurrentYearInCopyright();

    // Verify "Made with love" text
    await footer.expectMadeWithLoveText();
  });

  test("TC-LANDING-045: Email links are mailto: links", async () => {
    const footer = homePage.footer;

    await footer.footer.scrollIntoViewIfNeeded();

    // Verify all email links are mailto:
    await footer.expectEmailLinks();

    // Verify specific mailto: links
    await expect(footer.contactEmail).toHaveAttribute("href", "mailto:hello@videosummary.org");
    await expect(footer.supportEmailLink).toHaveAttribute("href", "mailto:support@videosummary.org");
    await expect(footer.privacyEmailLink).toHaveAttribute("href", "mailto:privacy@videosummary.org");
  });

  test("TC-LANDING-046: Internal links navigate correctly", async () => {
    const footer = homePage.footer;

    await footer.footer.scrollIntoViewIfNeeded();

    // Verify internal links
    await footer.expectInternalLinks();

    // Test navigation to Terms
    await footer.clickTermsLink();
    await homePage.page.waitForURL("/terms");
    await expect(homePage.page).toHaveURL("/terms");

    // Go back
    await homePage.page.goBack();
    await homePage.page.waitForURL("/");

    // Test navigation to Privacy
    await footer.footer.scrollIntoViewIfNeeded();
    await footer.clickPrivacyLink();
    await homePage.page.waitForURL("/privacy");
    await expect(homePage.page).toHaveURL("/privacy");
  });

  test("TC-LANDING-047: Footer links have hover effects", async () => {
    const footer = homePage.footer;

    await footer.footer.scrollIntoViewIfNeeded();

    // Test hover on different link types
    await footer.expectLinkHoverEffect("summaries");
    await footer.expectLinkHoverEffect("terms");
  });

  test("TC-LANDING-048: Brand link navigates to home", async () => {
    const footer = homePage.footer;

    // Navigate to a section of the home page to ensure we are at a specific URL state
    await homePage.page.goto("/#features");

    // Scroll to footer
    await footer.footer.scrollIntoViewIfNeeded();

    // Navigate back to home root via brand link in footer
    await footer.clickBrandLink();
    await homePage.page.waitForURL("/");
    await expect(homePage.page).toHaveURL("/");

    // Verify we're on home page
    await homePage.expectLoaded();
  });
});
