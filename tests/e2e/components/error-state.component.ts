import { type Page, type Locator, expect } from "@playwright/test";

export class ErrorStateComponent {
  readonly page: Page;
  readonly container: Locator;

  // Content elements
  readonly icon: Locator;
  readonly title: Locator;
  readonly message: Locator;
  readonly retryButton: Locator;
  readonly backToDashboardButton: Locator;

  // Specific error types
  readonly serverErrorIcon: Locator;
  readonly networkErrorIcon: Locator;
  readonly genericErrorIcon: Locator;

  // Background elements
  readonly backgroundGradient1: Locator;
  readonly backgroundGradient2: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="error-state"]');

    // Content elements
    this.icon = this.container.locator("[data-icon]");
    this.title = this.container.locator("h1");
    this.message = this.container.locator("p");
    this.retryButton = this.container.locator("button").filter({ hasText: "Try Again" });
    this.backToDashboardButton = this.container.locator("button").filter({ hasText: "Back to Dashboard" });

    // Specific error types
    this.serverErrorIcon = this.container.locator('[data-icon="server"]');
    this.networkErrorIcon = this.container.locator('[data-icon="network"]');
    this.genericErrorIcon = this.container.locator('[data-icon="alert"]');

    // Background elements (these are decorative)
    this.backgroundGradient1 = this.container.locator("[data-bg-gradient-1]");
    this.backgroundGradient2 = this.container.locator("[data-bg-gradient-2]");
  }

  async expectVisible() {
    await expect(this.container).toBeVisible();
  }

  async expectHidden() {
    await expect(this.container).not.toBeVisible();
  }

  async expectErrorType(type: "server" | "network" | "generic") {
    switch (type) {
      case "server":
        await expect(this.serverErrorIcon).toBeVisible();
        await expect(this.title).toContainText("Server Error");
        break;
      case "network":
        await expect(this.networkErrorIcon).toBeVisible();
        await expect(this.title).toContainText("Connection Error");
        break;
      case "generic":
        await expect(this.genericErrorIcon).toBeVisible();
        await expect(this.title).toContainText("Something went wrong");
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

  async expectRetryButtonVisible() {
    await expect(this.retryButton).toBeVisible();
  }

  async expectRetryButtonHidden() {
    await expect(this.retryButton).not.toBeVisible();
  }

  async expectBackToDashboardButtonVisible() {
    await expect(this.backToDashboardButton).toBeVisible();
  }

  async clickRetryButton() {
    await this.retryButton.click();
  }

  async clickBackToDashboardButton() {
    await this.backToDashboardButton.click();
  }

  async expectRetryButtonEnabled() {
    await expect(this.retryButton).toBeEnabled();
  }

  async expectRetryButtonDisabled() {
    await expect(this.retryButton).toBeDisabled();
  }

  async expectCompactMode() {
    await expect(this.container).toHaveClass(/compact/);
    await expect(this.title).toHaveClass(/text-sm/);
  }

  async expectFullMode() {
    await expect(this.container).not.toHaveClass(/compact/);
    await expect(this.title).toHaveClass(/text-4xl|text-5xl/);
  }

  async expectIconVisible() {
    await expect(this.icon).toBeVisible();
  }

  async expectIconColor(color: "red" | "orange" | "yellow") {
    switch (color) {
      case "red":
        await expect(this.icon).toHaveClass(/text-red/);
        break;
      case "orange":
        await expect(this.icon).toHaveClass(/text-orange/);
        break;
      case "yellow":
        await expect(this.icon).toHaveClass(/text-yellow/);
        break;
    }
  }

  async expectLayoutCentered() {
    await expect(this.container).toHaveClass(/flex/);
    await expect(this.container).toHaveClass(/items-center/);
    await expect(this.container).toHaveClass(/justify-center/);
    await expect(this.container).toHaveClass(/min-h-\[60vh\]/);
  }

  async expectFullHeightLayout() {
    const containerBox = await this.container.boundingBox();
    expect(containerBox?.height).toBeGreaterThanOrEqual(600); // min-h-[60vh] equivalent
  }

  async expectGradientBackground() {
    await expect(this.backgroundGradient1).toBeVisible();
    await expect(this.backgroundGradient2).toBeVisible();
  }

  async expectAccessibility() {
    // Check for proper ARIA attributes
    await expect(this.container).toHaveAttribute("role", "alert");
    await expect(this.container).toHaveAttribute("aria-live", "assertive");

    // Check for proper heading hierarchy
    await expect(this.title).toHaveRole("heading");
    await expect(this.title).toHaveAttribute("aria-level", "1");

    // Check button accessibility
    await expect(this.retryButton).toHaveAttribute("aria-label", "Retry the failed operation");
    await expect(this.backToDashboardButton).toHaveAttribute("aria-label", "Navigate back to dashboard");
  }

  async expectVisualHierarchy() {
    // Title should be largest, then message, then buttons
    const titleFontSize = await this.title.evaluate((el) => getComputedStyle(el).fontSize);
    const messageFontSize = await this.message.evaluate((el) => getComputedStyle(el).fontSize);
    const buttonFontSize = await this.retryButton.evaluate((el) => getComputedStyle(el).fontSize);

    expect(parseInt(titleFontSize)).toBeGreaterThan(parseInt(messageFontSize));
    expect(parseInt(messageFontSize)).toBeGreaterThan(parseInt(buttonFontSize));
  }

  async expectButtonStyling() {
    await expect(this.retryButton).toHaveClass(/bg-red/);
    await expect(this.retryButton).toHaveClass(/hover:bg-red/);
    await expect(this.backToDashboardButton).toHaveClass(/border/);
    await expect(this.backToDashboardButton).toHaveClass(/hover:bg-red/);
  }

  async expectSupportContact() {
    const supportText = this.container.locator("p").filter({ hasText: "If this problem persists" });
    await expect(supportText).toBeVisible();

    const supportLink = this.container.locator("a").filter({ hasText: "contact support" });
    await expect(supportLink).toBeVisible();
    await expect(supportLink).toHaveAttribute("href", /^mailto:/);
  }

  async expectErrorBoundary() {
    // Check that error state is properly contained
    await expect(this.container).toHaveClass(/relative/);
    await expect(this.container).toHaveClass(/z-10/);
  }

  async expectAnimation() {
    // Check for entrance animations and effects
    await expect(this.icon).toHaveClass(/animate/);
    await expect(this.title).toHaveClass(/animate/);
  }

  async expectResponsiveDesign() {
    // Check responsive text sizes
    await expect(this.title).toHaveClass(/text-4xl|sm:text-5xl/);
    await expect(this.message).toHaveClass(/text-xl/);
  }

  async expectErrorCode(errorCode: string) {
    const errorCodeElement = this.container.locator("[data-error-code]");
    await expect(errorCodeElement).toContainText(errorCode);
  }

  async expectTimestamp() {
    const timestampElement = this.container.locator("[data-timestamp]");
    await expect(timestampElement).toBeVisible();
    // Could validate timestamp format if needed
  }

  async expectErrorId() {
    const errorIdElement = this.container.locator("[data-error-id]");
    await expect(errorIdElement).toBeVisible();
    // Error ID should be a UUID or similar
    const errorId = await errorIdElement.textContent();
    expect(errorId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
  }
}
