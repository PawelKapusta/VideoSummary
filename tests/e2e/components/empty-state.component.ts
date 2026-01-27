import { type Page, type Locator, expect } from "@playwright/test";

export class EmptyStateComponent {
  readonly page: Page;
  readonly container: Locator;

  // Content elements
  readonly icon: Locator;
  readonly title: Locator;
  readonly message: Locator;
  readonly actionButton: Locator;
  readonly secondaryButton: Locator;

  // Specific icons for different types
  readonly videoIcon: Locator;
  readonly youtubeIcon: Locator;
  readonly searchIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="empty-state"]');

    // Content elements
    this.icon = this.container.locator("[data-icon]");
    this.title = this.container.locator("h2");
    this.message = this.container.locator("p");
    this.actionButton = this.container.locator("button").first();
    this.secondaryButton = this.container.locator("button").nth(1);

    // Specific icons
    this.videoIcon = this.container.locator('[data-icon="video"]');
    this.youtubeIcon = this.container.locator('[data-icon="youtube"]');
    this.searchIcon = this.container.locator('[data-icon="search"]');
  }

  async expectVisible() {
    await expect(this.container).toBeVisible();
  }

  async expectHidden() {
    await expect(this.container).not.toBeVisible();
  }

  async expectType(type: "videos" | "summaries" | "search-results") {
    switch (type) {
      case "videos":
        await expect(this.videoIcon).toBeVisible();
        await expect(this.title).toContainText("No videos available");
        break;
      case "summaries":
        await expect(this.title).toContainText("No summaries yet");
        break;
      case "search-results":
        await expect(this.searchIcon).toBeVisible();
        await expect(this.title).toContainText("No videos match");
        break;
    }
  }

  async getTitle(): Promise<string | null> {
    return await this.title.textContent();
  }

  async getMessage(): Promise<string | null> {
    return await this.message.textContent();
  }

  async expectTitle(expectedTitle: string) {
    await expect(this.title).toContainText(expectedTitle);
  }

  async expectMessage(expectedMessage: string) {
    await expect(this.message).toContainText(expectedMessage);
  }

  async expectActionButtonVisible() {
    await expect(this.actionButton).toBeVisible();
  }

  async expectActionButtonText(expectedText: string) {
    await expect(this.actionButton).toContainText(expectedText);
  }

  async expectSecondaryButtonVisible() {
    await expect(this.secondaryButton).toBeVisible();
  }

  async expectSecondaryButtonText(expectedText: string) {
    await expect(this.secondaryButton).toContainText(expectedText);
  }

  async clickActionButton() {
    await this.actionButton.click();
  }

  async clickSecondaryButton() {
    await this.secondaryButton.click();
  }

  async expectActionButtonLinksTo(expectedUrl: string) {
    const href = await this.actionButton.getAttribute("href");
    expect(href).toBe(expectedUrl);
  }

  async expectSecondaryButtonLinksTo(expectedUrl: string) {
    const href = await this.secondaryButton.getAttribute("href");
    expect(href).toBe(expectedUrl);
  }

  async expectVideosEmptyState() {
    await this.expectType("videos");
    await this.expectMessage("Subscribe to YouTube channels to see their videos");
    await this.expectActionButtonText("Subscribe to Channels");
    await this.expectSecondaryButtonText("Generate Summary");
  }

  async expectSummariesEmptyState() {
    await this.expectType("summaries");
    await this.expectMessage("Subscribe to YouTube channels on your profile page");
    await this.expectActionButtonText("Subscribe to Channels");
    await this.expectSecondaryButtonText("Generate Summary Manually");
  }

  async expectSearchResultsEmptyState() {
    await this.expectType("search-results");
    await this.expectMessage("Try adjusting your search criteria");
    await expect(this.actionButton).not.toBeVisible(); // No action button for search results
  }

  async expectIconVisible() {
    await expect(this.icon).toBeVisible();
  }

  async expectIconType(expectedIcon: "video" | "youtube" | "search") {
    switch (expectedIcon) {
      case "video":
        await expect(this.videoIcon).toBeVisible();
        break;
      case "youtube":
        await expect(this.youtubeIcon).toBeVisible();
        break;
      case "search":
        await expect(this.searchIcon).toBeVisible();
        break;
    }
  }

  async expectLayoutCentered() {
    await expect(this.container).toHaveClass(/flex/);
    await expect(this.container).toHaveClass(/items-center/);
    await expect(this.container).toHaveClass(/justify-center/);
  }

  async expectResponsiveSpacing() {
    // Check for responsive padding/margin classes
    await expect(this.container).toHaveClass(/px-4|px-8/);
    await expect(this.container).toHaveClass(/py-16|py-12/);
  }

  async expectAccessibility() {
    // Check for proper ARIA attributes
    await expect(this.container).toHaveAttribute("role", "status");
    await expect(this.container).toHaveAttribute("aria-live", "polite");

    // Check for proper heading hierarchy
    await expect(this.title).toHaveRole("heading");
    await expect(this.title).toHaveAttribute("aria-level", "2");

    // Check button accessibility
    await expect(this.actionButton).toHaveAttribute("aria-label");
    if (await this.secondaryButton.isVisible()) {
      await expect(this.secondaryButton).toHaveAttribute("aria-label");
    }
  }

  async expectVisualHierarchy() {
    // Title should be larger than message
    const titleFontSize = await this.title.evaluate((el) => getComputedStyle(el).fontSize);
    const messageFontSize = await this.message.evaluate((el) => getComputedStyle(el).fontSize);

    expect(parseInt(titleFontSize)).toBeGreaterThan(parseInt(messageFontSize));
  }

  async expectColorScheme(theme: "light" | "dark") {
    // Check for appropriate color classes based on theme
    if (theme === "light") {
      await expect(this.title).toHaveClass(/text-gray-900/);
      await expect(this.message).toHaveClass(/text-gray-600/);
    } else {
      await expect(this.title).toHaveClass(/text-gray-100/);
      await expect(this.message).toHaveClass(/text-gray-400/);
    }
  }

  async expectAnimation() {
    // Check for entrance animations
    await expect(this.container).toHaveClass(/animate/);
  }

  async expectMaxWidth() {
    // Check for max width constraint
    const containerBox = await this.container.boundingBox();
    expect(containerBox?.width).toBeLessThanOrEqual(512); // max-w-2xl equivalent
  }

  async expectButtonStyling() {
    await expect(this.actionButton).toHaveClass(/bg-primary/);
    await expect(this.actionButton).toHaveClass(/text-white/);

    if (await this.secondaryButton.isVisible()) {
      await expect(this.secondaryButton).toHaveClass(/border/);
      await expect(this.secondaryButton).toHaveClass(/text-muted/);
    }
  }

  async expectHelpfulLinks() {
    // Check for additional helpful links in summaries empty state
    if (await this.secondaryButton.isVisible()) {
      const helpfulText = this.container.locator("p").filter({ hasText: "Need help getting started?" });
      await expect(helpfulText).toBeVisible();

      const videosLink = this.container.locator("a").filter({ hasText: "videos page" });
      const generateLink = this.container.locator("a").filter({ hasText: "generate a summary manually" });

      await expect(videosLink).toBeVisible();
      await expect(generateLink).toBeVisible();
    }
  }
}
