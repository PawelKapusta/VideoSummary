import { type Page, type Locator, expect } from "@playwright/test";

export class VideoCardComponent {
  readonly page: Page;
  readonly card: Locator;

  // Card elements
  readonly thumbnail: Locator;
  readonly title: Locator;
  readonly channelName: Locator;
  readonly statusBadge: Locator;
  readonly actionText: Locator;
  readonly actionButton: Locator;

  // Status indicators
  readonly summaryAvailableBadge: Locator;
  readonly generatingBadge: Locator;
  readonly pendingBadge: Locator;
  readonly failedBadge: Locator;
  readonly noSummaryBadge: Locator;

  constructor(page: Page, cardLocator: Locator) {
    this.page = page;
    this.card = cardLocator;

    // Card elements
    this.thumbnail = this.card.locator("img");
    this.title = this.card.locator("h3");
    this.channelName = this.card.locator("p");
    this.statusBadge = this.card.locator('[class*="badge"]');
    this.actionText = this.card.locator("span").filter({
      hasText: /(See Summary|Try Again|Generate Summary|In Progress|Queued)/,
    });
    this.actionButton = this.actionText;

    // Status indicators
    this.summaryAvailableBadge = this.card.locator("span").filter({ hasText: "Summary Available" });
    this.generatingBadge = this.card.locator("span").filter({ hasText: "Generating" });
    this.pendingBadge = this.card.locator("span").filter({ hasText: "Pending" });
    this.failedBadge = this.card.locator("span").filter({ hasText: "Failed" });
    this.noSummaryBadge = this.card.locator("span").filter({ hasText: "No Summary" });
  }

  async expectVisible() {
    await expect(this.card).toBeVisible();
  }

  async expectHidden() {
    await expect(this.card).not.toBeVisible();
  }

  async getTitle(): Promise<string | null> {
    return await this.title.textContent();
  }

  async getChannelName(): Promise<string | null> {
    return await this.channelName.textContent();
  }

  async getStatus(): Promise<string | null> {
    return await this.statusBadge.textContent();
  }

  async getActionText(): Promise<string | null> {
    return await this.actionText.textContent();
  }

  async click() {
    await this.card.click();
  }

  async expectTitle(expectedTitle: string) {
    await expect(this.title).toContainText(expectedTitle);
  }

  async expectChannel(expectedChannel: string) {
    await expect(this.channelName).toContainText(expectedChannel);
  }

  async expectTitleContains(text: string) {
    await expect(this.title).toContainText(text);
  }

  async expectChannelContains(text: string) {
    await expect(this.channelName).toContainText(text);
  }

  async expectThumbnailVisible() {
    await expect(this.thumbnail).toBeVisible();
  }

  async expectThumbnailHidden() {
    await expect(this.thumbnail).not.toBeVisible();
  }

  async expectAction(expectedAction: "See Summary" | "Try Again" | "Generate Summary" | "In Progress" | "Queued") {
    await expect(this.actionText).toContainText(expectedAction);
  }

  async expectStatusBadge(expectedStatus: "Summary Available" | "Generating" | "Pending" | "Failed" | "No Summary") {
    const badgeLocator = this.card.locator("span").filter({ hasText: expectedStatus });
    await expect(badgeLocator).toBeVisible();
  }

  async expectSummaryAvailable() {
    await this.expectStatusBadge("Summary Available");
    await this.expectAction("See Summary");
  }

  async expectNoSummary() {
    await this.expectStatusBadge("No Summary");
    await this.expectAction("Generate Summary");
  }

  async expectGenerating() {
    await this.expectStatusBadge("Generating");
    await this.expectAction("In Progress");
  }

  async expectPending() {
    await this.expectStatusBadge("Pending");
    await this.expectAction("Queued");
  }

  async expectFailed() {
    await this.expectStatusBadge("Failed");
    await this.expectAction("Try Again");
  }

  async expectHoverEffects() {
    // Hover over the card
    await this.card.hover();

    // Check for hover classes (this depends on implementation)
    // These assertions might need adjustment based on actual CSS classes
    await expect(this.card).toHaveClass(/hover:shadow-xl/);
    await expect(this.card).toHaveClass(/transform/);
  }

  async expectClickable() {
    await expect(this.card).toHaveCSS("cursor", "pointer");
  }

  async expectNotClickable() {
    await expect(this.card).toHaveCSS("cursor", "not-allowed");
  }

  async getThumbnailSrc(): Promise<string | null> {
    return await this.thumbnail.getAttribute("src");
  }

  async getThumbnailAlt(): Promise<string | null> {
    return await this.thumbnail.getAttribute("alt");
  }

  async expectThumbnailAlt(expectedAlt: string) {
    await expect(this.thumbnail).toHaveAttribute("alt", expectedAlt);
  }

  async expectPublishedDateVisible() {
    // Check if date is displayed (implementation-dependent)
    const dateElement = this.card.locator("span").filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}/ });
    await expect(dateElement).toBeVisible();
  }

  async getPublishedDate(): Promise<string | null> {
    const dateElement = this.card.locator("span").filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}/ });
    return await dateElement.textContent();
  }

  async expectPublishedDate(expectedDate: string) {
    const dateElement = this.card.locator("span").filter({ hasText: expectedDate });
    await expect(dateElement).toBeVisible();
  }

  async expectCardStructure() {
    // Verify all required elements are present
    await expect(this.thumbnail).toBeVisible();
    await expect(this.title).toBeVisible();
    await expect(this.channelName).toBeVisible();
    await expect(this.statusBadge).toBeVisible();
    await expect(this.actionText).toBeVisible();
  }

  async expectAccessibility() {
    // Check for proper ARIA labels and roles
    await expect(this.card).toHaveRole("button");
    await expect(this.thumbnail).toHaveAttribute("alt");
  }

  async expectResponsiveLayout() {
    // Check card layout on different screen sizes
    // This might need to be implemented based on actual responsive behavior
    await expect(this.card).toHaveClass(/flex/);
  }

  async waitForStatusChange(expectedAction: string, timeout = 10000) {
    await expect(this.actionText).toContainText(expectedAction, { timeout });
  }

  async expectAnimationComplete() {
    // Wait for any animations to complete
    await this.page.waitForTimeout(500);
    // Check that no animation classes are active
    await expect(this.card).not.toHaveClass(/animate/);
  }
}
