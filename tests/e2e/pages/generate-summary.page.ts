import { type Page, type Locator, expect } from "@playwright/test";

export class GenerateSummaryPage {
  readonly page: Page;

  // Main containers
  readonly generateSummaryView: Locator;

  // Header elements
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // AI Disclaimer
  readonly aiDisclaimer: Locator;

  // Form elements
  readonly videoUrlForm: Locator;
  readonly videoUrlInput: Locator;
  readonly generateButton: Locator;

  // Validation status
  readonly validationStatus: Locator;

  // Video preview
  readonly videoPreview: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly appLoader: Locator;

  // Error states
  readonly errorState: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main containers
    this.generateSummaryView = page.locator('[data-testid="generate-summary-view"]');

    // Header elements
    this.pageTitle = page.locator('[data-testid="generate-summary-view"] h1').filter({ hasText: /Generate|Summary/i });
    this.pageDescription = page
      .locator('[data-testid="generate-summary-view"] p')
      .filter({ hasText: /Enter|video|URL/i });

    // AI Disclaimer
    this.aiDisclaimer = page
      .locator('[data-testid="generate-summary-view"]')
      .locator("text=/AI.*content|content.*AI/i")
      .locator("..");

    // Form elements
    this.videoUrlForm = page.locator('[data-testid="video-url-form"]');
    this.videoUrlInput = page.locator(
      '[data-testid="generate-summary-view"] input[type="url"], [data-testid="generate-summary-view"] input[placeholder*="youtube"]'
    );
    this.generateButton = page
      .locator(
        '[data-testid="generate-summary-view"] button[type="submit"], [data-testid="generate-summary-view"] button'
      )
      .filter({ hasText: /generate|Generate/i });

    // Validation status
    this.validationStatus = page.locator('[data-testid="validation-status"]');

    // Video preview
    this.videoPreview = page.locator('[data-testid="video-preview"]');

    // Loading states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.appLoader = page.locator('[data-testid="app-loader"]');

    // Error states
    this.errorState = page.locator('[data-testid="error-state"]');
  }

  async goto() {
    await this.page.goto("/generate");
  }

  async expectGenerateSummaryPageLoaded() {
    await expect(this.generateSummaryView).toBeVisible();
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageDescription).toBeVisible();
  }

  async expectAiDisclaimerVisible() {
    await expect(this.aiDisclaimer).toBeVisible();
  }

  async expectVideoUrlFormVisible() {
    await expect(this.videoUrlForm).toBeVisible();
  }

  async fillVideoUrl(url: string) {
    await expect(this.videoUrlInput).toBeVisible();
    await this.videoUrlInput.fill(url);
  }

  async expectGenerateButtonVisible() {
    await expect(this.generateButton).toBeVisible();
  }

  async expectGenerateButtonDisabled() {
    await expect(this.generateButton).toBeDisabled();
  }

  async expectGenerateButtonEnabled() {
    await expect(this.generateButton).toBeEnabled();
  }

  async clickGenerateButton() {
    await expect(this.generateButton).toBeEnabled();
    await this.generateButton.click();
  }

  async submitVideoUrl(url: string) {
    await this.fillVideoUrl(url);
    await this.clickGenerateButton();
  }

  async expectValidationStatusVisible() {
    await expect(this.validationStatus).toBeVisible();
  }

  async expectVideoPreviewVisible() {
    await expect(this.videoPreview).toBeVisible();
  }

  async expectUrlValidationError(message?: string) {
    const errorLocator = this.page.locator('[data-testid="generate-summary-view"]').locator("text=/invalid|error/i");
    await expect(errorLocator).toBeVisible();
    if (message) {
      await expect(errorLocator).toContainText(message);
    }
  }

  async expectUrlValidationSuccess() {
    const successLocator = this.page
      .locator('[data-testid="generate-summary-view"]')
      .locator("text=/valid|success|ready/i");
    await expect(successLocator).toBeVisible();
  }

  async expectLoadingState() {
    await expect(this.appLoader).toBeVisible();
  }

  async waitForLoadingToComplete() {
    await expect(this.appLoader).not.toBeVisible();
  }

  async expectErrorStateVisible() {
    await expect(this.errorState).toBeVisible();
  }

  async expectOnGenerateSummaryPage() {
    await expect(this.page).toHaveURL(/\/generate/);
    await this.expectGenerateSummaryPageLoaded();
  }

  async expectOnPage() {
    await this.expectOnGenerateSummaryPage();
  }

  // Helper methods for validation steps
  async expectValidationStep(stepText: string, status: "checking" | "success" | "error") {
    const stepLocator = this.validationStatus.locator(`text=${stepText}`).locator("..");
    await expect(stepLocator).toBeVisible();

    if (status === "checking") {
      await expect(stepLocator.locator('[data-testid*="loading"], .animate-spin')).toBeVisible();
    } else if (status === "success") {
      await expect(stepLocator.locator('[data-testid*="success"], .text-green-600')).toBeVisible();
    } else if (status === "error") {
      await expect(stepLocator.locator('[data-testid*="error"], .text-red-600')).toBeVisible();
    }
  }

  async expectValidationComplete() {
    await expect(this.validationStatus.locator("text=/ready|complete/i")).toBeVisible();
  }
}
