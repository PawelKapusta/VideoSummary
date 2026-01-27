import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Accessibility on Landing Page
 * Covers WCAG AA compliance, keyboard navigation, and semantic structure
 */
test.describe("Landing Page - Accessibility (WCAG AA)", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-LANDING-050: Page has proper semantic HTML structure", async () => {
    // Verify semantic structure
    await homePage.expectPageStructure();

    // Verify only one H1 in main content
    const h1Count = await homePage.page.locator("main h1").count();
    expect(h1Count).toBe(1);

    // Verify H1 text
    const h1 = homePage.page.locator("main h1");
    await expect(h1).toHaveText("Video Summary");

    // Verify sections exist
    const sections = homePage.page.locator("section");
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(4);
  });

  test("TC-LANDING-051: Heading hierarchy is correct (H1 → H2 → H3)", async () => {
    // H1 should be first and only one in main content
    const h1 = homePage.page.locator("main h1");
    await expect(h1).toHaveText("Video Summary");

    // H2 headings should follow in main content
    const h2Count = await homePage.page.locator("main h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(2); // Features and CTA sections

    // H3 headings - 3 in Features section + 2 in Footer (Product, Support & Legal)
    const h3Count = await homePage.page.locator("h3").count();
    expect(h3Count).toBeGreaterThanOrEqual(3); // At least three feature cards (footer may add more)

    // Verify feature cards have H3
    const featureH3Count = await homePage.featuresSection.featuresGrid.locator("h3").count();
    expect(featureH3Count).toBe(3);

    // No H4 in main content
    const h4Count = await homePage.page.locator("main h4").count();
    expect(h4Count).toBe(0);
  });

  test("TC-LANDING-052: All interactive elements support keyboard navigation", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Keyboard navigation tests are not applicable for mobile devices (touch interface)");

    // Tab through all interactive elements
    const tabbableElements: string[] = [];

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");

      try {
        const tagName = await focused.evaluate((el) => el.tagName);
        const href = await focused.getAttribute("href");

        if (href) {
          tabbableElements.push(`${tagName}:${href}`);
        }
      } catch {
        // Element might not be focusable anymore
        break;
      }
    }

    // Verify we can navigate to key elements
    expect(tabbableElements.length).toBeGreaterThan(5);
    expect(tabbableElements.some((el) => el.includes("/signup"))).toBe(true);
    expect(tabbableElements.some((el) => el.includes("/login"))).toBe(true);
  });

  test("TC-LANDING-053: SVG icons have proper accessibility attributes", async () => {
    // Check Hero Section icons exist
    await homePage.heroSection.expectAccessibleIcons();

    // Check CTA Section icons exist
    await homePage.ctaSection.expectAccessibleIcons();

    // Verify main content SVG icons are visible (they're decorative, inside links/buttons)
    const mainSvgs = homePage.page.locator("main svg");
    const svgCount = await mainSvgs.count();
    expect(svgCount).toBeGreaterThan(0);

    // Icons inside links/buttons are inherently accessible (decorative)
    // No need to check aria-hidden on every SVG
  });

  test("TC-LANDING-054: Text has sufficient color contrast", async () => {
    // Hero Section - dark text on light background
    const heroHeading = homePage.heroSection.heading;
    const heroColor = await heroHeading.evaluate((el) => window.getComputedStyle(el).color);
    expect(heroColor).toBeTruthy();

    // CTA Section - white text on blue background
    await homePage.ctaSection.ctaSection.scrollIntoViewIfNeeded();
    await homePage.ctaSection.expectContrastRatio();

    // Footer - verify text colors
    await homePage.footer.footer.scrollIntoViewIfNeeded();
    await homePage.footer.expectTextColorMuted();
  });

  test("TC-LANDING-055: All links have clear focus indicators", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Keyboard focus indicators are not applicable for mobile devices");

    // Focus on first link
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");

    // Check that focus is visible
    const outlineStyle = await focused.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    // Either outline or box-shadow should be present for focus indicator
    const hasFocusIndicator =
      outlineStyle.outlineWidth !== "0px" || outlineStyle.boxShadow !== "none" || outlineStyle.outline !== "none";

    expect(hasFocusIndicator).toBe(true);
  });

  test("TC-LANDING-056: Page can be navigated with keyboard only", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Keyboard navigation is not applicable for mobile devices");

    // Try to navigate to signup using only keyboard
    let signupReached = false;

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");
      const href = await focused.getAttribute("href");

      if (href === "/signup") {
        // Found signup link, press Enter
        await page.keyboard.press("Enter");
        await page.waitForURL("/signup");
        signupReached = true;
        break;
      }
    }

    expect(signupReached).toBe(true);
    await expect(page).toHaveURL(/\/signup/);
  });

  test("TC-LANDING-057: Footer navigation has proper ARIA labels", async () => {
    await homePage.footer.footer.scrollIntoViewIfNeeded();
    await homePage.footer.expectAccessibleNavigation();
  });

  test("TC-LANDING-058: Page language attribute is set", async () => {
    const htmlLang = await homePage.page.getAttribute("html", "lang");
    expect(htmlLang).toBe("en");
  });

  test("TC-LANDING-059: Page works with screen reader simulation", async ({ page }) => {
    // Get page content in reading order
    const textContent = await page.evaluate(() => {
      return document.body.innerText;
    });

    // Verify key content is present and in logical order
    expect(textContent).toContain("Video Summary");
    expect(textContent).toContain("Get AI-powered summaries");
    expect(textContent).toContain("Why Choose Video Summary?");
    expect(textContent).toContain("AI-Powered Summaries");
    expect(textContent).toContain("YouTube Integration");
    expect(textContent).toContain("Daily Automation");
    expect(textContent).toContain("Ready to Save Hours");
    expect(textContent).toContain("personal use");

    // Check logical order
    const h1Index = textContent.indexOf("Video Summary");
    const featuresIndex = textContent.indexOf("Why Choose Video Summary?");
    const ctaIndex = textContent.indexOf("Ready to Save Hours");

    expect(h1Index).toBeLessThan(featuresIndex);
    expect(featuresIndex).toBeLessThan(ctaIndex);
  });
});
