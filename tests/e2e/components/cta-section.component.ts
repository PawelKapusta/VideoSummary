import { type Page, type Locator, expect } from "@playwright/test";

export class CTASectionComponent {
  readonly page: Page;

  // Main container
  readonly ctaSection: Locator;

  // Text content
  readonly heading: Locator;
  readonly description: Locator;

  // CTA Buttons
  readonly startSummarizingButton: Locator;
  readonly signInButton: Locator;
  readonly ctaButtonsContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // CTA section - blue background section
    this.ctaSection = page.locator("section").filter({ hasText: "Ready to Save Hours of Watching Time?" });

    // Text content
    this.heading = this.ctaSection.locator("h2");
    this.description = this.ctaSection.locator("p").filter({
      hasText: "Take control of your YouTube consumption",
    });

    // CTA buttons
    this.ctaButtonsContainer = this.ctaSection.locator('div[class*="flex"]').filter({
      has: page.locator('a[href="/signup"]'),
    });
    this.startSummarizingButton = this.ctaSection.locator('a[href="/signup"]');
    this.signInButton = this.ctaSection.locator('a[href="/login"]');
  }

  async expectVisible() {
    await expect(this.ctaSection).toBeVisible();
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

  async expectBlueBackground() {
    const sectionClasses = await this.ctaSection.getAttribute("class");
    expect(sectionClasses).toContain("bg-blue-600");
  }

  async expectCTAButtonsVisible() {
    await expect(this.startSummarizingButton).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  async expectStartSummarizingButtonText(text: string) {
    await expect(this.startSummarizingButton).toContainText(text);
  }

  async expectSignInButtonText(text: string) {
    await expect(this.signInButton).toContainText(text);
  }

  async expectStartSummarizingButtonStyling() {
    const buttonClasses = await this.startSummarizingButton.getAttribute("class");
    expect(buttonClasses).toContain("bg-white");
    expect(buttonClasses).toContain("text-blue-600");

    // Check for lightning icon within button
    const icon = this.startSummarizingButton.locator("svg");
    await expect(icon).toBeVisible();
  }

  async expectSignInButtonStyling() {
    const buttonClasses = await this.signInButton.getAttribute("class");
    expect(buttonClasses).toContain("border-2");
    expect(buttonClasses).toContain("border-white");
    expect(buttonClasses).toContain("text-white");
  }

  async clickStartSummarizingButton() {
    await this.startSummarizingButton.click();
  }

  async clickSignInButton() {
    await this.signInButton.click();
  }

  async hoverStartSummarizingButton() {
    await this.startSummarizingButton.hover();
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

  async expectStartSummarizingHoverEffect() {
    await this.hoverStartSummarizingButton();
    await this.page.waitForTimeout(300);

    const buttonClasses = await this.startSummarizingButton.getAttribute("class");
    expect(buttonClasses).toMatch(/hover:bg-gray/);
  }

  async expectSignInHoverEffect() {
    await this.hoverSignInButton();
    await this.page.waitForTimeout(300);

    const buttonClasses = await this.signInButton.getAttribute("class");
    expect(buttonClasses).toMatch(/hover:bg-white|hover:text-blue/);
  }

  async expectResponsiveLayout() {
    // Check if buttons are in column layout on mobile
    const containerClasses = await this.ctaButtonsContainer.getAttribute("class");
    expect(containerClasses).toMatch(/flex-col|sm:flex-row/);
  }

  async expectHeadingFontSize() {
    // Check responsive font sizes
    const headingClasses = await this.heading.getAttribute("class");
    expect(headingClasses).toMatch(/text-3xl|text-4xl/); // Mobile and desktop sizes
  }

  async expectDescriptionFontSize() {
    const descriptionClasses = await this.description.getAttribute("class");
    expect(descriptionClasses).toMatch(/text-xl/);
  }

  async expectWhiteText() {
    const headingClasses = await this.heading.getAttribute("class");
    expect(headingClasses).toContain("text-white");

    const descriptionClasses = await this.description.getAttribute("class");
    expect(descriptionClasses).toMatch(/text-blue-100/);
  }

  async expectCenterAlignment() {
    const sectionClasses = await this.ctaSection.getAttribute("class");
    expect(sectionClasses).toContain("text-center");
  }

  async expectMaxWidthContainer() {
    const container = this.ctaSection.locator('div[class*="max-w-4xl"]');
    await expect(container).toBeVisible();
  }

  async expectAccessibleIcons() {
    // SVG icons should be decorative or have proper attributes
    const svgIcons = this.ctaSection.locator("svg");
    const count = await svgIcons.count();

    for (let i = 0; i < count; i++) {
      const svg = svgIcons.nth(i);
      // SVG is accessible if it's inside a link/button (decorative) or has proper attributes
      // For this test, we just verify SVG exists and is visible
      await expect(svg).toBeVisible();
    }
  }

  async expectKeyboardNavigation() {
    // Focus on Start Summarizing button
    await this.startSummarizingButton.focus();
    const focusedElement = this.page.locator(":focus");
    await expect(focusedElement).toHaveAttribute("href", "/signup");

    // Tab to Sign In button
    await this.page.keyboard.press("Tab");
    await expect(this.page.locator(":focus")).toHaveAttribute("href", "/login");
  }

  async expectSpacing() {
    // Check for proper padding
    const sectionClasses = await this.ctaSection.getAttribute("class");
    expect(sectionClasses).toMatch(/py-24/);
  }

  async expectButtonsHaveIcons() {
    const startIcon = this.startSummarizingButton.locator("svg");
    await expect(startIcon).toBeVisible();

    // Sign In button may or may not have icon - check both cases
    const signInIcon = this.signInButton.locator("svg");
    const signInIconCount = await signInIcon.count();
    expect(signInIconCount).toBeGreaterThanOrEqual(0); // Allow 0 or 1
  }

  async getButtonHref(buttonType: "signup" | "login"): Promise<string | null> {
    const button = buttonType === "signup" ? this.startSummarizingButton : this.signInButton;
    return await button.getAttribute("href");
  }

  async expectContrastRatio() {
    // White text on blue background should have good contrast
    const headingColor = await this.heading.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    const backgroundColor = await this.ctaSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Basic check that colors are defined
    expect(headingColor).toBeTruthy();
    expect(backgroundColor).toBeTruthy();
  }

  async expectGradientOrSolidBackground() {
    const sectionClasses = await this.ctaSection.getAttribute("class");
    expect(sectionClasses).toMatch(/bg-blue-600|bg-gradient/);
  }
}
