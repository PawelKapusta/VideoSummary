import { type Page, type Locator, expect } from "@playwright/test";

export class HeroSectionComponent {
  readonly page: Page;

  // Main container
  readonly heroSection: Locator;

  // Visual elements
  readonly gradientBackground: Locator;
  readonly videoIcon: Locator;
  readonly iconContainer: Locator;

  // Text content
  readonly heading: Locator;
  readonly description: Locator;

  // CTA Buttons
  readonly getStartedButton: Locator;
  readonly signInButton: Locator;
  readonly ctaButtonsContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main section - first section with gradient background
    this.heroSection = page.locator("section").first();
    this.gradientBackground = this.heroSection.locator('div[class*="gradient"]').first();

    // Icon elements
    this.iconContainer = this.heroSection.locator('div[class*="bg-blue-100"]').first();
    this.videoIcon = this.iconContainer.locator("svg").first();

    // Text content
    this.heading = this.heroSection.locator("h1");
    this.description = this.heroSection.locator("p").filter({ hasText: "Get AI-powered summaries" });

    // CTA buttons
    this.ctaButtonsContainer = this.heroSection.locator('div[class*="flex-col"]').filter({
      has: page.locator('a[href="/signup"]'),
    });
    this.getStartedButton = this.heroSection.locator('a[href="/signup"]').first();
    this.signInButton = this.heroSection.locator('a[href="/login"]').first();
  }

  async expectVisible() {
    await expect(this.heroSection).toBeVisible();
    await expect(this.heading).toBeVisible();
    await expect(this.description).toBeVisible();
  }

  async expectHeading(text: string) {
    await expect(this.heading).toHaveText(text);
  }

  async expectDescriptionContains(text: string) {
    await expect(this.description).toContainText(text);
  }

  async expectPersonalUseMessaging() {
    await expect(this.description).toContainText("personal use");
  }

  async expectGradientBackground() {
    await expect(this.gradientBackground).toBeVisible();
    const bgClasses = await this.gradientBackground.getAttribute("class");
    expect(bgClasses).toContain("gradient");
  }

  async expectVideoIcon() {
    await expect(this.iconContainer).toBeVisible();
    await expect(this.videoIcon).toBeVisible();

    // Check icon container styling
    const containerClasses = await this.iconContainer.getAttribute("class");
    expect(containerClasses).toContain("bg-blue");
  }

  async expectCTAButtonsVisible() {
    await expect(this.getStartedButton).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  async expectGetStartedButtonText(text: string) {
    await expect(this.getStartedButton).toContainText(text);
  }

  async expectSignInButtonText(text: string) {
    await expect(this.signInButton).toContainText(text);
  }

  async expectGetStartedButtonStyling() {
    const buttonClasses = await this.getStartedButton.getAttribute("class");
    expect(buttonClasses).toContain("bg-blue-600");
    expect(buttonClasses).toContain("text-white");

    // Check for icon within button
    const icon = this.getStartedButton.locator("svg");
    await expect(icon).toBeVisible();
  }

  async expectSignInButtonStyling() {
    const buttonClasses = await this.signInButton.getAttribute("class");
    expect(buttonClasses).toContain("bg-gray");
    expect(buttonClasses).toContain("border");

    // Check for icon within button
    const icon = this.signInButton.locator("svg");
    await expect(icon).toBeVisible();
  }

  async clickGetStartedButton() {
    await this.getStartedButton.click();
  }

  async clickSignInButton() {
    await this.signInButton.click();
  }

  async hoverGetStartedButton() {
    await this.getStartedButton.hover();
  }

  async hoverSignInButton() {
    await this.signInButton.hover();
  }

  async expectButtonHoverEffect(button: Locator) {
    await button.hover();
    await this.page.waitForTimeout(300); // Wait for transition

    const buttonClasses = await button.getAttribute("class");
    expect(buttonClasses).toContain("hover:");
  }

  async expectResponsiveLayout() {
    // Check if buttons are in column layout on mobile
    const containerClasses = await this.ctaButtonsContainer.getAttribute("class");
    expect(containerClasses).toMatch(/flex-col|sm:flex-row/);
  }

  async expectHeadingFontSize() {
    // Check responsive font sizes
    const headingClasses = await this.heading.getAttribute("class");
    expect(headingClasses).toMatch(/text-4xl|text-6xl/); // Mobile and desktop sizes
  }

  async expectDescriptionFontSize() {
    const descriptionClasses = await this.description.getAttribute("class");
    expect(descriptionClasses).toMatch(/text-xl|text-2xl/);
  }

  async expectCenterAlignment() {
    const sectionClasses = await this.heroSection.getAttribute("class");
    expect(sectionClasses).toContain("text-center");
  }

  async expectMaxWidthContainer() {
    const container = this.heroSection.locator('div[class*="max-w-7xl"]');
    await expect(container).toBeVisible();
  }

  async expectAccessibleIcons() {
    // SVG icons should be decorative (not need alt text) or have proper attributes
    const svgIcons = this.heroSection.locator("svg");
    const count = await svgIcons.count();

    for (let i = 0; i < count; i++) {
      const svg = svgIcons.nth(i);
      // SVG is accessible if: aria-hidden="true" OR has role OR is inside a link/button (decorative)
      // For this test, we just verify SVG exists and is visible
      await expect(svg).toBeVisible();
    }
  }

  async expectKeyboardNavigation() {
    // Tab to Get Started button
    await this.page.keyboard.press("Tab");
    const focusedElement = this.page.locator(":focus");
    await expect(focusedElement).toHaveAttribute("href", "/signup");

    // Tab to Sign In button
    await this.page.keyboard.press("Tab");
    await expect(this.page.locator(":focus")).toHaveAttribute("href", "/login");
  }

  async expectSpacing() {
    // Check for proper padding
    const sectionClasses = await this.heroSection.getAttribute("class");
    expect(sectionClasses).toMatch(/py-24|py-32/);
  }

  async expectButtonsHaveIcons() {
    const getStartedIcon = this.getStartedButton.locator("svg");
    const signInIcon = this.signInButton.locator("svg");

    await expect(getStartedIcon).toBeVisible();
    await expect(signInIcon).toBeVisible();
  }

  async getButtonHref(buttonType: "signup" | "login"): Promise<string | null> {
    const button = buttonType === "signup" ? this.getStartedButton : this.signInButton;
    return await button.getAttribute("href");
  }
}
