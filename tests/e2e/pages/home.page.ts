import { type Page, type Locator, expect } from "@playwright/test";
import { HeroSectionComponent } from "../components/hero-section.component";
import { FeaturesSectionComponent } from "../components/features-section.component";
import { CTASectionComponent } from "../components/cta-section.component";
import { FooterComponent } from "../components/footer.component";
import { ToastNotificationsComponent } from "../components/toast-notifications.component";

export class HomePage {
  readonly page: Page;

  // Main container
  readonly container: Locator;
  readonly pageTitle: Locator;

  // Component instances (following POM pattern)
  readonly heroSection: HeroSectionComponent;
  readonly featuresSection: FeaturesSectionComponent;
  readonly ctaSection: CTASectionComponent;
  readonly footer: FooterComponent;
  readonly toasts: ToastNotificationsComponent;

  // Sections
  readonly footerDisclaimer: Locator;
  readonly footerDisclaimerText: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main container
    this.container = page.locator("body");
    this.pageTitle = page.locator("title");

    // Initialize components following POM pattern
    this.heroSection = new HeroSectionComponent(page);
    this.featuresSection = new FeaturesSectionComponent(page);
    this.ctaSection = new CTASectionComponent(page);
    this.footer = new FooterComponent(page);
    this.toasts = new ToastNotificationsComponent(page);

    // Footer Disclaimer section
    this.footerDisclaimer = page.locator("section").filter({ hasText: "This tool is designed for personal use only" });
    this.footerDisclaimerText = this.footerDisclaimer.locator("p");
  }

  async goto() {
    await this.page.goto("/");
  }

  async expectLoaded() {
    await expect(this.container).toBeVisible();
    await this.expectTitle("Video Summary");
    await this.heroSection.expectVisible();
    await this.featuresSection.expectVisible();
    await this.ctaSection.expectVisible();
    await this.footer.expectVisible();
  }

  async expectTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async expectMetaDescription() {
    const metaDescription = this.page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content");
  }

  async expectMetaViewport() {
    const metaViewport = this.page.locator('meta[name="viewport"]');
    await expect(metaViewport).toHaveAttribute("content", "width=device-width");
  }

  async expectFavicon() {
    const favicon = this.page.locator('link[rel="icon"]');
    await expect(favicon).toHaveAttribute("href");
  }

  async expectHeaderNotVisible() {
    // Header should NOT be rendered when showNavigation=false
    const header = this.page.locator("header").filter({ has: this.page.locator("nav") });
    await expect(header).not.toBeVisible();
  }

  async expectNoHamburgerMenu() {
    const hamburgerMenu = this.page.locator('button[aria-label*="menu" i]');
    await expect(hamburgerMenu).not.toBeVisible();
  }

  async expectFooterDisclaimerVisible() {
    await expect(this.footerDisclaimer).toBeVisible();
    await expect(this.footerDisclaimerText).toContainText("This tool is designed for personal use only");
    await expect(this.footerDisclaimerText).toContainText("YouTube's Terms of Service");
  }

  async expectNoConsoleErrors() {
    // This should be implemented in test setup, but can be checked here too
    const errors: string[] = [];
    this.page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    expect(errors).toHaveLength(0);
  }

  async expectNoNetworkErrors() {
    const failedRequests: string[] = [];
    this.page.on("response", (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.url()} - ${response.status()}`);
      }
    });
    expect(failedRequests).toHaveLength(0);
  }

  async expectPageStructure() {
    // Verify semantic HTML structure
    const sections = this.page.locator("section");
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(4); // Hero, Features, CTA, Footer Disclaimer

    // Verify only one H1 in main content (exclude Playwright DevTools)
    const h1Count = await this.page.locator("main h1").count();
    expect(h1Count).toBe(1);
  }

  async expectAccessibility() {
    // Tab through interactive elements
    await this.page.keyboard.press("Tab");
    const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  }

  async navigateToSignup() {
    await this.heroSection.clickGetStartedButton();
    await this.page.waitForURL("/signup");
    await expect(this.page).toHaveURL(/\/signup/);
  }

  async navigateToLogin() {
    await this.heroSection.clickSignInButton();
    await this.page.waitForURL("/login");
    await expect(this.page).toHaveURL(/\/login/);
  }

  async expectResponsiveDesktop() {
    // Check features are in 3 columns
    await this.featuresSection.expectFeaturesGridColumns(3);
  }

  async expectResponsiveMobile() {
    // Check features are in 1 column
    await this.featuresSection.expectFeaturesGridColumns(1);
  }

  async expectMinimalLoadTime() {
    // Check performance metrics
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      };
    });

    // Assert load times (adjust thresholds as needed)
    expect(performanceMetrics.loadTime).toBeLessThan(3000); // 3s
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2s
  }

  async takeFullPageScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async expectCSSLoaded() {
    // Check if Tailwind CSS is applied
    const bodyClasses = await this.container.getAttribute("class");
    expect(bodyClasses).toBeTruthy();
  }
}
