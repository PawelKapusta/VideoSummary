import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Accessibility on Home Page
 * Covers WCAG compliance, keyboard navigation, and screen readers
 */
test.describe("Home Page - Accessibility", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("TC-HOME-026: Page has proper semantic structure", async () => {
    await homePage.expectPageStructure();

    // Verify only one H1
    const h1Count = await homePage.page.locator("h1").count();
    expect(h1Count).toBe(1);

    // Verify H1 text
    const h1 = homePage.page.locator("h1");
    await expect(h1).toHaveText("Video Summary");

    // Verify sections exist
    const sections = homePage.page.locator("section");
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(4);
  });

  test("TC-HOME-027: All interactive elements support keyboard navigation", async ({ page }) => {
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

  test("TC-HOME-028: SVG icons have proper accessibility attributes", async () => {
    // Check Hero Section icons
    await homePage.heroSection.expectAccessibleIcons();

    // Check CTA Section icons
    await homePage.ctaSection.expectAccessibleIcons();
  });

  test("TC-HOME-029: Text has sufficient contrast ratio", async () => {
    // Hero Section - dark text on light background
    const heroHeading = homePage.heroSection.heading;
    const heroColor = await heroHeading.evaluate((el) => window.getComputedStyle(el).color);
    expect(heroColor).toBeTruthy();

    // CTA Section - white text on blue background
    await homePage.ctaSection.expectContrastRatio();

    // Footer - verify text colors
    await homePage.footer.expectTextColorMuted();
  });

  test("TC-HOME-030: All links have clear focus indicators", async ({ page }) => {
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

  test("TC-HOME-031: Page can be navigated with keyboard only", async ({ page }) => {
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

  test("TC-HOME-032: Page has proper heading hierarchy", async () => {
    // H1 should be first
    const h1 = homePage.page.locator("h1");
    await expect(h1).toHaveText("Video Summary");

    // H2 headings should follow
    const h2Count = await homePage.page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(2); // Features and CTA sections

    // H3 headings should be in Features section
    const h3Count = await homePage.page.locator("h3").count();
    expect(h3Count).toBe(3); // Three feature cards
  });

  test("TC-HOME-033: Footer navigation has proper ARIA labels", async () => {
    await homePage.footer.expectAccessibleNavigation();
  });

  test("TC-HOME-034: Page works with screen reader simulation", async ({ page }) => {
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

    // Check order
    const h1Index = textContent.indexOf("Video Summary");
    const featuresIndex = textContent.indexOf("Why Choose Video Summary?");
    const ctaIndex = textContent.indexOf("Ready to Save Hours");

    expect(h1Index).toBeLessThan(featuresIndex);
    expect(featuresIndex).toBeLessThan(ctaIndex);
  });

  test("TC-HOME-035: All images have alt text or are decorative", async () => {
    // SVG icons should be marked as decorative (aria-hidden) or have roles
    const svgs = homePage.page.locator("svg");
    const svgCount = await svgs.count();

    for (let i = 0; i < svgCount; i++) {
      const svg = svgs.nth(i);
      const ariaHidden = await svg.getAttribute("aria-hidden");
      const role = await svg.getAttribute("role");

      // Should have either aria-hidden or a role
      expect(ariaHidden === "true" || role !== null).toBe(true);
    }
  });

  test("TC-HOME-036: Page language is set", async () => {
    const htmlLang = await homePage.page.getAttribute("html", "lang");
    expect(htmlLang).toBe("en");
  });
});
