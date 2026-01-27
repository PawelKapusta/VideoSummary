import { type Page, type Locator, expect } from "@playwright/test";

export class FooterComponent {
  readonly page: Page;

  // Main container
  readonly footer: Locator;

  // Brand section
  readonly brandSection: Locator;
  readonly brandLink: Locator;
  readonly brandDescription: Locator;
  readonly contactEmail: Locator;

  // Product links section
  readonly productSection: Locator;
  readonly productHeading: Locator;
  readonly productLinks: Locator;
  readonly dashboardLink: Locator;
  readonly summariesLink: Locator;
  readonly generateLink: Locator;
  readonly profileLink: Locator;

  // Legal & Support section
  readonly legalSection: Locator;
  readonly legalHeading: Locator;
  readonly legalLinks: Locator;
  readonly termsLink: Locator;
  readonly privacyLink: Locator;
  readonly supportEmailLink: Locator;
  readonly privacyEmailLink: Locator;

  // Bottom bar
  readonly bottomBar: Locator;
  readonly copyrightText: Locator;
  readonly madeWithLoveText: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main footer container
    this.footer = page.locator("footer").or(page.locator('[data-testid="app-footer"]'));

    // Brand section
    this.brandSection = this.footer
      .locator("div")
      .filter({ has: page.locator("a").filter({ hasText: "VideoSummary" }) })
      .first();
    this.brandLink = this.footer.locator('a[href="/"]').filter({ hasText: "VideoSummary" });
    this.brandDescription = this.brandSection
      .locator("p")
      .filter({ hasText: "AI-powered YouTube video summarization" });
    this.contactEmail = this.footer.locator('a[href="mailto:hello@videosummary.org"]');

    // Product section
    this.productSection = this.footer
      .locator("div")
      .filter({ has: page.locator("h3").filter({ hasText: /product/i }) })
      .first();
    this.productHeading = this.productSection.locator("h3").first();
    this.productLinks = this.productSection.locator("nav ul").first();
    this.dashboardLink = this.footer.locator('a[href="/dashboard"]').filter({ hasText: "Dashboard" });
    this.summariesLink = this.footer.locator('a[href="/summaries"]').filter({ hasText: "Summaries" });
    this.generateLink = this.footer.locator('a[href="/generate"]').filter({ hasText: "Generate" });
    this.profileLink = this.footer.locator('a[href="/profile"]').filter({ hasText: "Profile" });

    // Legal & Support section
    this.legalSection = this.footer
      .locator("div")
      .filter({ has: page.locator("h3").filter({ hasText: /support.*legal|legal.*support/i }) })
      .first();
    this.legalHeading = this.legalSection.locator("h3").first();
    this.legalLinks = this.legalSection.locator("nav ul").first();
    this.termsLink = this.footer.locator('a[href="/terms"]').filter({ hasText: "Terms of Service" });
    this.privacyLink = this.footer.locator('a[href="/privacy"]').filter({ hasText: "Privacy Policy" });
    this.supportEmailLink = this.footer.locator('a[href="mailto:support@videosummary.org"]');
    this.privacyEmailLink = this.footer.locator('a[href="mailto:privacy@videosummary.org"]');

    // Bottom bar
    this.bottomBar = this.footer.locator("div").filter({ hasText: /©.*VideoSummary/ });
    this.copyrightText = this.bottomBar.locator("p").filter({ hasText: /©.*VideoSummary/ });
    this.madeWithLoveText = this.bottomBar.locator("span").filter({ hasText: /Made with.*for content creators/ });
  }

  async expectVisible() {
    await expect(this.footer).toBeVisible();
  }

  async expectBrandSectionVisible() {
    await expect(this.brandLink).toBeVisible();
    await expect(this.brandDescription).toBeVisible();
    await expect(this.contactEmail).toBeVisible();
  }

  async expectBrandLinkText(text: string) {
    await expect(this.brandLink).toHaveText(text);
  }

  async expectBrandDescription() {
    await expect(this.brandDescription).toContainText("AI-powered YouTube video summarization");
  }

  async expectContactEmail(email: string) {
    await expect(this.contactEmail).toHaveText(email);
    await expect(this.contactEmail).toHaveAttribute("href", `mailto:${email}`);
  }

  async expectProductLinksVisible() {
    await expect(this.productHeading).toBeVisible();
    await expect(this.dashboardLink).toBeVisible();
    await expect(this.summariesLink).toBeVisible();
    await expect(this.generateLink).toBeVisible();
    await expect(this.profileLink).toBeVisible();
  }

  async expectProductLinksCount(count: number) {
    const links = this.productLinks.locator("a");
    await expect(links).toHaveCount(count);
  }

  async expectLegalLinksVisible() {
    await expect(this.legalHeading).toBeVisible();
    await expect(this.termsLink).toBeVisible();
    await expect(this.privacyLink).toBeVisible();
    await expect(this.supportEmailLink).toBeVisible();
    await expect(this.privacyEmailLink).toBeVisible();
  }

  async expectLegalLinksCount(count: number) {
    const links = this.legalLinks.locator("a");
    await expect(links).toHaveCount(count);
  }

  async expectCopyrightText(year: number) {
    await expect(this.copyrightText).toContainText(`© ${year} VideoSummary. All rights reserved.`);
  }

  async expectCurrentYearInCopyright() {
    const currentYear = new Date().getFullYear();
    await this.expectCopyrightText(currentYear);
  }

  async expectMadeWithLoveText() {
    await expect(this.madeWithLoveText).toContainText("Made with");
    await expect(this.madeWithLoveText).toContainText("for content creators");
  }

  async clickBrandLink() {
    await this.brandLink.click();
  }

  async clickDashboardLink() {
    await this.dashboardLink.click();
  }

  async clickSummariesLink() {
    await this.summariesLink.click();
  }

  async clickGenerateLink() {
    await this.generateLink.click();
  }

  async clickProfileLink() {
    await this.profileLink.click();
  }

  async clickTermsLink() {
    await this.termsLink.click();
  }

  async clickPrivacyLink() {
    await this.privacyLink.click();
  }

  async clickContactEmail() {
    await this.contactEmail.click();
  }

  async clickSupportEmail() {
    await this.supportEmailLink.click();
  }

  async clickPrivacyEmail() {
    await this.privacyEmailLink.click();
  }

  async hoverLink(linkType: "dashboard" | "summaries" | "generate" | "profile" | "terms" | "privacy") {
    const linkMap = {
      dashboard: this.dashboardLink,
      summaries: this.summariesLink,
      generate: this.generateLink,
      profile: this.profileLink,
      terms: this.termsLink,
      privacy: this.privacyLink,
    };

    const link = linkMap[linkType];
    await link.hover();
  }

  async expectLinkHoverEffect(linkType: "dashboard" | "summaries" | "generate" | "profile" | "terms" | "privacy") {
    await this.hoverLink(linkType);
    await this.page.waitForTimeout(300); // Wait for transition

    const linkMap = {
      dashboard: this.dashboardLink,
      summaries: this.summariesLink,
      generate: this.generateLink,
      profile: this.profileLink,
      terms: this.termsLink,
      privacy: this.privacyLink,
    };

    const link = linkMap[linkType];
    const linkClasses = await link.getAttribute("class");
    expect(linkClasses).toMatch(/hover:text-foreground|hover:font-medium/);
  }

  async expectResponsiveLayout() {
    // Check grid columns for responsive behavior in the main container
    // Using a more specific selector to avoid the background pattern div
    const mainContainer = this.footer
      .locator("div.grid")
      .filter({ has: this.page.locator("h3") })
      .first();
    const containerClasses = await mainContainer.getAttribute("class");
    expect(containerClasses).toMatch(/grid-cols-1|lg:grid-cols-3/);
  }

  async expectGradientBackground() {
    const footerClasses = await this.footer.getAttribute("class");
    expect(footerClasses).toMatch(/bg-gradient|backdrop-blur/);
  }

  async expectShadow() {
    const footerClasses = await this.footer.getAttribute("class");
    expect(footerClasses).toMatch(/shadow/);
  }

  async expectMaxWidthContainer() {
    const container = this.footer.locator('div[class*="max-w-7xl"]');
    await expect(container).toBeVisible();
  }

  async expectProductHeadingUppercase() {
    const headingClasses = await this.productHeading.getAttribute("class");
    expect(headingClasses).toContain("uppercase");
  }

  async expectLegalHeadingUppercase() {
    const headingClasses = await this.legalHeading.getAttribute("class");
    expect(headingClasses).toContain("uppercase");
  }

  async expectAccessibleNavigation() {
    // Check for nav elements with aria-label
    const productNav = this.productSection.locator("nav").first();
    const legalNav = this.legalSection.locator("nav").first();

    await expect(productNav).toBeVisible();
    await expect(legalNav).toBeVisible();

    // Check for aria-label on nav elements
    await expect(productNav).toHaveAttribute("aria-label");
    await expect(legalNav).toHaveAttribute("aria-label");
  }

  async expectEmailLinks() {
    // All email links should be mailto:
    await expect(this.contactEmail).toHaveAttribute("href", /^mailto:/);
    await expect(this.supportEmailLink).toHaveAttribute("href", /^mailto:/);
    await expect(this.privacyEmailLink).toHaveAttribute("href", /^mailto:/);
  }

  async expectInternalLinks() {
    // Product links should be internal (start with /)
    await expect(this.dashboardLink).toHaveAttribute("href", /^\//);
    await expect(this.summariesLink).toHaveAttribute("href", /^\//);
    await expect(this.generateLink).toHaveAttribute("href", /^\//);
    await expect(this.profileLink).toHaveAttribute("href", /^\//);
    await expect(this.termsLink).toHaveAttribute("href", /^\//);
    await expect(this.privacyLink).toHaveAttribute("href", /^\//);
  }

  async expectKeyboardNavigation() {
    // Tab through footer links
    await this.brandLink.focus();
    await expect(this.page.locator(":focus")).toHaveAttribute("href", "/");

    // Continue tabbing through other links
    await this.page.keyboard.press("Tab");
    const focusedElement = this.page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  }

  async expectGridLayout() {
    // Check for grid layout in the main grid container
    const gridContainer = this.footer
      .locator("div.grid")
      .filter({ has: this.page.locator("h3") })
      .first();
    const containerClasses = await gridContainer.getAttribute("class");
    expect(containerClasses).toMatch(/grid/);
  }

  async expectBottomBarSeparator() {
    // Check for separator line above bottom bar
    const bottomBarClasses = await this.bottomBar.getAttribute("class");
    expect(bottomBarClasses).toMatch(/pt-6|border-t/);
  }

  async expectSpacing() {
    const footerClasses = await this.footer.getAttribute("class");
    expect(footerClasses).toMatch(/pt-8|pb-4/);
  }

  async getAllProductLinks(): Promise<string[]> {
    const links = this.productLinks.locator("a");
    const count = await links.count();
    const hrefs: string[] = [];

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href) hrefs.push(href);
    }

    return hrefs;
  }

  async getAllLegalLinks(): Promise<string[]> {
    const links = this.legalLinks.locator("a");
    const count = await links.count();
    const hrefs: string[] = [];

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href) hrefs.push(href);
    }

    return hrefs;
  }

  async expectTextColorMuted() {
    const brandDescClasses = await this.brandDescription.getAttribute("class");
    expect(brandDescClasses).toMatch(/text-muted-foreground/);
  }

  async expectRoundedCorners() {
    const footerClasses = await this.footer.getAttribute("class");
    expect(footerClasses).toMatch(/rounded/);
  }
}
