import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Footer on Home Page
 * Covers AppFooter component with all sections and links
 */
test.describe("Home Page - Footer", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-HOME-017: Footer Brand Section displays correctly", async () => {
    const footer = homePage.footer;

    await footer.expectBrandSectionVisible();
    await footer.expectBrandLinkText("VideoSummary");
    await footer.expectBrandDescription();
    await footer.expectContactEmail("hello@videosummary.org");
  });

  test("TC-HOME-018: Footer Product Links are visible and correct", async () => {
    const footer = homePage.footer;

    await footer.expectProductLinksVisible();
    await footer.expectProductLinksCount(4);

    // Verify all product links exist
    await expect(footer.dashboardLink).toBeVisible();
    await expect(footer.summariesLink).toBeVisible();
    await expect(footer.generateLink).toBeVisible();
    await expect(footer.profileLink).toBeVisible();
  });

  test("TC-HOME-019: Footer Legal & Support Links are visible", async () => {
    const footer = homePage.footer;

    await footer.expectLegalLinksVisible();
    await footer.expectLegalLinksCount(4);

    // Verify all legal links exist
    await expect(footer.termsLink).toBeVisible();
    await expect(footer.privacyLink).toBeVisible();
    await expect(footer.supportEmailLink).toBeVisible();
    await expect(footer.privacyEmailLink).toBeVisible();
  });

  test("TC-HOME-020: Footer Copyright displays current year", async () => {
    const footer = homePage.footer;

    await footer.expectCurrentYearInCopyright();
    await footer.expectMadeWithLoveText();
  });

  test("TC-HOME-021: Footer links have hover effects", async () => {
    const footer = homePage.footer;

    // Test hover on different links
    await footer.expectLinkHoverEffect("dashboard");
    await footer.expectLinkHoverEffect("summaries");
    await footer.expectLinkHoverEffect("terms");
    await footer.expectLinkHoverEffect("privacy");
  });

  test("TC-HOME-023: Footer - Desktop responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const footer = homePage.footer;
    await footer.expectResponsiveLayout();
  });

  test("TC-HOME-024: Footer - Mobile responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const footer = homePage.footer;
    await footer.expectResponsiveLayout();
  });

  test("TC-HOME-027: Footer supports keyboard navigation", async () => {
    const footer = homePage.footer;

    // Scroll to footer
    await footer.footer.scrollIntoViewIfNeeded();

    await footer.expectKeyboardNavigation();
  });

  test("TC-HOME-028: Footer navigation has proper ARIA labels", async () => {
    const footer = homePage.footer;

    await footer.expectAccessibleNavigation();
  });

  test("TC-HOME-029: Footer has proper styling", async () => {
    const footer = homePage.footer;

    await footer.expectGradientBackground();
    await footer.expectShadow();
    await footer.expectMaxWidthContainer();
    await footer.expectRoundedCorners();
  });

  test("TC-HOME-035: Footer email links are mailto:", async () => {
    const footer = homePage.footer;

    await footer.expectEmailLinks();

    // Verify email links
    await expect(footer.contactEmail).toHaveAttribute("href", "mailto:hello@videosummary.org");
    await expect(footer.supportEmailLink).toHaveAttribute("href", "mailto:support@videosummary.org");
    await expect(footer.privacyEmailLink).toHaveAttribute("href", "mailto:privacy@videosummary.org");
  });

  test("TC-HOME-036: Footer internal links are correct", async () => {
    const footer = homePage.footer;

    await footer.expectInternalLinks();

    // Get all product links
    const productLinks = await footer.getAllProductLinks();
    expect(productLinks).toContain("/dashboard");
    expect(productLinks).toContain("/summaries");
    expect(productLinks).toContain("/generate");
    expect(productLinks).toContain("/profile");

    // Get all legal links
    const legalLinks = await footer.getAllLegalLinks();
    expect(legalLinks).toContain("/terms");
    expect(legalLinks).toContain("/privacy");
  });

  test("TC-HOME-042: Navigation from footer to Dashboard (redirect to login)", async () => {
    const footer = homePage.footer;

    // Click Dashboard link
    await footer.clickDashboardLink();

    // Should redirect to login since user is not authenticated
    await homePage.page.waitForURL(/\/login/);
    await expect(homePage.page).toHaveURL(/\/login/);
  });

  test("TC-HOME-043: Navigation from footer to Terms", async () => {
    const footer = homePage.footer;

    // Click Terms link
    await footer.clickTermsLink();

    // Should navigate to terms page
    await homePage.page.waitForURL("/terms");
    await expect(homePage.page).toHaveURL("/terms");
  });

  test("TC-HOME-044: Navigation from footer to Privacy", async () => {
    const footer = homePage.footer;

    // Click Privacy link
    await footer.clickPrivacyLink();

    // Should navigate to privacy page
    await homePage.page.waitForURL("/privacy");
    await expect(homePage.page).toHaveURL("/privacy");
  });

  test("TC-HOME-046: Footer headings are uppercase", async () => {
    const footer = homePage.footer;

    await footer.expectProductHeadingUppercase();
    await footer.expectLegalHeadingUppercase();
  });

  test("TC-HOME-047: Footer has proper spacing and layout", async () => {
    const footer = homePage.footer;

    await footer.expectSpacing();
    await footer.expectGridLayout();
    await footer.expectBottomBarSeparator();
  });
});
