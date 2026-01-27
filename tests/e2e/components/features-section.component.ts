import { type Page, type Locator, expect } from "@playwright/test";

export class FeaturesSectionComponent {
  readonly page: Page;

  // Main container
  readonly featuresSection: Locator;

  // Section header
  readonly sectionHeading: Locator;
  readonly sectionDescription: Locator;

  // Feature cards container
  readonly featuresGrid: Locator;
  readonly featureCards: Locator;

  // Individual feature cards
  readonly aiPoweredCard: Locator;
  readonly youtubeIntegrationCard: Locator;
  readonly dailyAutomationCard: Locator;

  constructor(page: Page) {
    this.page = page;

    // Features section - has gray background
    this.featuresSection = page.locator("section").filter({ hasText: "Why Choose Video Summary?" });

    // Section header
    this.sectionHeading = this.featuresSection.locator("h2");
    this.sectionDescription = this.featuresSection.locator("p").first();

    // Features grid and cards
    this.featuresGrid = this.featuresSection.locator('div[class*="grid"]').filter({
      has: page.locator("h3"),
    });
    this.featureCards = this.featuresGrid.locator("> div");

    // Individual feature cards by heading text
    this.aiPoweredCard = this.featureCards.filter({ hasText: "AI-Powered Summaries" });
    this.youtubeIntegrationCard = this.featureCards.filter({ hasText: "YouTube Integration" });
    this.dailyAutomationCard = this.featureCards.filter({ hasText: "Daily Automation" });
  }

  async expectVisible() {
    await expect(this.featuresSection).toBeVisible();
    await expect(this.sectionHeading).toBeVisible();
    await expect(this.featuresGrid).toBeVisible();
  }

  async expectSectionHeading(text: string) {
    await expect(this.sectionHeading).toHaveText(text);
  }

  async expectSectionDescriptionContains(text: string) {
    await expect(this.sectionDescription).toContainText(text);
  }

  async expectFeatureCardsCount(count: number) {
    await expect(this.featureCards).toHaveCount(count);
  }

  async expectAllThreeFeatures() {
    await expect(this.aiPoweredCard).toBeVisible();
    await expect(this.youtubeIntegrationCard).toBeVisible();
    await expect(this.dailyAutomationCard).toBeVisible();
  }

  async expectFeatureCard(
    card: Locator,
    expectedContent: {
      heading: string;
      descriptionContains: string;
      iconVisible?: boolean;
    }
  ) {
    await expect(card).toBeVisible();

    const heading = card.locator("h3");
    await expect(heading).toHaveText(expectedContent.heading);

    const description = card.locator("p");
    await expect(description).toContainText(expectedContent.descriptionContains);

    if (expectedContent.iconVisible !== false) {
      const icon = card.locator("svg");
      await expect(icon).toBeVisible();
    }
  }

  async expectAIPoweredFeature() {
    await this.expectFeatureCard(this.aiPoweredCard, {
      heading: "AI-Powered Summaries",
      descriptionContains: "TL;DR and detailed summaries",
    });
  }

  async expectYouTubeIntegrationFeature() {
    await this.expectFeatureCard(this.youtubeIntegrationCard, {
      heading: "YouTube Integration",
      descriptionContains: "Connect up to 10 YouTube channels",
    });
  }

  async expectDailyAutomationFeature() {
    await this.expectFeatureCard(this.dailyAutomationCard, {
      heading: "Daily Automation",
      descriptionContains: "Automatic daily summary generation",
    });
  }

  async expectFeatureCardStyling() {
    const cardClasses = await this.aiPoweredCard.getAttribute("class");
    expect(cardClasses).toContain("bg-white");
    expect(cardClasses).toContain("rounded");
    expect(cardClasses).toContain("border");
    expect(cardClasses).toMatch(/hover:shadow/);
  }

  async expectFeatureIconStyling(card: Locator) {
    const iconContainer = card.locator('div[class*="bg-blue"]').first();
    await expect(iconContainer).toBeVisible();

    const icon = iconContainer.locator("svg");
    await expect(icon).toBeVisible();

    const iconClasses = await icon.getAttribute("class");
    expect(iconClasses).toContain("text-blue");
  }

  async hoverFeatureCard(cardIndex: number) {
    const card = this.featureCards.nth(cardIndex);
    await card.hover();
  }

  async expectHoverEffect(cardIndex: number) {
    const card = this.featureCards.nth(cardIndex);
    await card.hover();
    await this.page.waitForTimeout(300); // Wait for transition

    // Check if shadow increases on hover
    const cardClasses = await card.getAttribute("class");
    expect(cardClasses).toMatch(/hover:shadow-md/);
  }

  async expectFeaturesGridColumns(columns: number) {
    const gridClasses = await this.featuresGrid.getAttribute("class");

    if (columns === 3) {
      expect(gridClasses).toMatch(/md:grid-cols-3/);
    } else if (columns === 1) {
      expect(gridClasses).toMatch(/grid-cols-1/);
    }
  }

  async expectResponsiveLayout() {
    const gridClasses = await this.featuresGrid.getAttribute("class");
    expect(gridClasses).toContain("grid-cols-1");
    expect(gridClasses).toContain("md:grid-cols-3");
  }

  async expectCenterAlignment() {
    // Check the immediate parent of the heading for center alignment
    const headingParent = this.sectionHeading.locator("xpath=..");
    const containerClasses = await headingParent.getAttribute("class");
    expect(containerClasses).toContain("text-center");
  }

  async expectGrayBackground() {
    const sectionClasses = await this.featuresSection.getAttribute("class");
    expect(sectionClasses).toContain("bg-gray-50");
  }

  async expectSpacing() {
    const sectionClasses = await this.featuresSection.getAttribute("class");
    expect(sectionClasses).toMatch(/py-24/);
  }

  async expectMaxWidthContainer() {
    const container = this.featuresSection.locator('div[class*="max-w-7xl"]');
    await expect(container).toBeVisible();
  }

  async expectCardTransition() {
    const card = this.featureCards.first();
    const cardClasses = await card.getAttribute("class");
    expect(cardClasses).toMatch(/transition/);
  }

  async expectAllIconsVisible() {
    const icons = this.featuresGrid.locator("svg");
    const count = await icons.count();
    expect(count).toBe(3); // One icon per feature card

    for (let i = 0; i < count; i++) {
      await expect(icons.nth(i)).toBeVisible();
    }
  }

  async expectIconColors() {
    // All icons should be blue-600
    const icons = this.featuresGrid.locator("svg");
    const count = await icons.count();

    for (let i = 0; i < count; i++) {
      const icon = icons.nth(i);
      const iconClasses = await icon.getAttribute("class");
      expect(iconClasses).toContain("text-blue-600");
    }
  }

  async expectAccessibleHeadings() {
    // H2 should be section heading
    await expect(this.sectionHeading).toHaveRole("heading");
    // Also verify it's an H2 tag which implies level 2
    const tagName = await this.sectionHeading.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("h2");

    // H3 should be feature headings
    const featureHeadings = this.featuresGrid.locator("h3");
    const count = await featureHeadings.count();
    expect(count).toBe(3);
  }

  async expectPersonalUseMessaging() {
    await expect(this.sectionDescription).toContainText("personal use");
  }

  async getFeatureCardByIndex(index: number): Promise<Locator> {
    return this.featureCards.nth(index);
  }

  async getFeatureCardHeading(index: number): Promise<string | null> {
    const card = await this.getFeatureCardByIndex(index);
    const heading = card.locator("h3");
    return await heading.textContent();
  }

  async getFeatureCardDescription(index: number): Promise<string | null> {
    const card = await this.getFeatureCardByIndex(index);
    const description = card.locator("p");
    return await description.textContent();
  }
}
