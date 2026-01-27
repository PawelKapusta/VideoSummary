import { type Page, type Locator, expect } from "@playwright/test";

export class GenerateSummaryDialogComponent {
  readonly page: Page;
  readonly dialog: Locator;

  // Dialog structure
  readonly dialogOverlay: Locator;
  readonly dialogContent: Locator;
  readonly dialogHeader: Locator;
  readonly dialogTitle: Locator;
  readonly dialogDescription: Locator;
  readonly dialogBody: Locator;
  readonly dialogFooter: Locator;

  // Video information section
  readonly videoCard: Locator;
  readonly videoThumbnail: Locator;
  readonly videoTitle: Locator;
  readonly videoChannel: Locator;
  readonly videoDate: Locator;

  // Validation section
  readonly validationCard: Locator;
  readonly validationSteps: Locator;
  readonly validationStatusBadge: Locator;

  // Individual validation steps
  readonly urlValidationStep: Locator;
  readonly subscriptionValidationStep: Locator;
  readonly limitValidationStep: Locator;
  readonly durationValidationStep: Locator;
  readonly generationValidationStep: Locator;

  // Action buttons
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  // Loading states
  readonly loadingSpinner: Locator;
  readonly generatingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('[data-testid="generate-summary-dialog"]');

    // Dialog structure
    this.dialogOverlay = this.dialog.locator("..").locator("[data-overlay]");
    this.dialogContent = this.dialog.locator("[data-radix-dialog-content]");
    this.dialogHeader = this.dialog.locator("[data-radix-dialog-header]");
    this.dialogTitle = this.dialog.locator("h2").filter({ hasText: "Generate Summary" });
    this.dialogDescription = this.dialog.locator("p").filter({ hasText: "Review the pre-generate checks below" });
    this.dialogBody = this.dialog.locator("[data-radix-dialog-body]");
    this.dialogFooter = this.dialog.locator("[data-radix-dialog-footer]");

    // Video information section
    this.videoCard = this.dialog.locator('[data-testid="video-info-card"]');
    this.videoThumbnail = this.videoCard.locator("img, [data-thumbnail]");
    this.videoTitle = this.videoCard.locator("h3");
    this.videoChannel = this.videoCard.locator("span").filter({ hasText: /Channel:/ });
    this.videoDate = this.videoCard.locator("span").filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}/ });

    // Validation section
    this.validationCard = this.dialog.locator('[data-testid="validation-card"]');
    this.validationSteps = this.validationCard.locator('[data-testid="validation-step"]');
    this.validationStatusBadge = this.validationCard.locator('[data-testid="validation-status"]');

    // Individual validation steps
    this.urlValidationStep = this.validationSteps.filter({ hasText: "Video URL" });
    this.subscriptionValidationStep = this.validationSteps.filter({ hasText: "Channel subscription" });
    this.limitValidationStep = this.validationSteps.filter({ hasText: "Daily limit" });
    this.durationValidationStep = this.validationSteps.filter({ hasText: "Video duration" });
    this.generationValidationStep = this.validationSteps.filter({ hasText: "Generation status" });

    // Action buttons
    this.cancelButton = this.dialog.locator("button").filter({ hasText: "Cancel" });
    this.confirmButton = this.dialog.locator("button").filter({ hasText: "Confirm & Generate" });
    this.generatingButton = this.dialog.locator("button").filter({ hasText: "Generating Summary..." });

    // Loading states
    this.loadingSpinner = this.dialog.locator("[data-loading-spinner]");
  }

  async expectVisible() {
    await expect(this.dialog).toBeVisible();
    await expect(this.dialogOverlay).toBeVisible();
  }

  async expectHidden() {
    await expect(this.dialog).not.toBeVisible();
  }

  async expectDialogStructure() {
    await expect(this.dialogTitle).toBeVisible();
    await expect(this.dialogDescription).toBeVisible();
    await expect(this.videoCard).toBeVisible();
    await expect(this.validationCard).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
    await expect(this.confirmButton).toBeVisible();
  }

  async getVideoTitle(): Promise<string | null> {
    return await this.videoTitle.textContent();
  }

  async getVideoChannel(): Promise<string | null> {
    return await this.videoChannel.textContent();
  }

  async expectVideoTitle(expectedTitle: string) {
    await expect(this.videoTitle).toContainText(expectedTitle);
  }

  async expectVideoChannel(expectedChannel: string) {
    await expect(this.videoChannel).toContainText(expectedChannel);
  }

  async expectVideoThumbnailVisible() {
    await expect(this.videoThumbnail).toBeVisible();
  }

  async expectVideoDateVisible() {
    await expect(this.videoDate).toBeVisible();
  }

  async getValidationStepsCount(): Promise<number> {
    return await this.validationSteps.count();
  }

  async expectValidationStepsCount(expectedCount: number) {
    await expect(this.validationSteps).toHaveCount(expectedCount);
  }

  async expectValidationStepStatus(stepIndex: number, expectedStatus: "checking" | "success" | "error" | "pending") {
    const step = this.validationSteps.nth(stepIndex);
    const statusIcon = step.locator("[data-status-icon]");

    switch (expectedStatus) {
      case "checking":
        await expect(statusIcon).toHaveClass(/animate-spin/);
        break;
      case "success":
        await expect(statusIcon).toHaveClass(/text-green/);
        break;
      case "error":
        await expect(statusIcon).toHaveClass(/text-red/);
        break;
      case "pending":
        await expect(statusIcon).toHaveClass(/text-muted/);
        break;
    }
  }

  async expectAllValidationStepsSuccess() {
    const stepsCount = await this.getValidationStepsCount();
    for (let i = 0; i < stepsCount; i++) {
      await this.expectValidationStepStatus(i, "success");
    }
  }

  async expectValidationStepError(stepIndex: number, errorMessage?: string) {
    await this.expectValidationStepStatus(stepIndex, "error");

    if (errorMessage) {
      const step = this.validationSteps.nth(stepIndex);
      await expect(step.locator("[data-error-message]")).toContainText(errorMessage);
    }
  }

  async getValidationStatus(): Promise<"ready" | "issues" | "checking"> {
    const badgeText = await this.validationStatusBadge.textContent();

    if (badgeText?.includes("Ready")) {
      return "ready";
    } else if (badgeText?.includes("Issues")) {
      return "issues";
    } else {
      return "checking";
    }
  }

  async expectValidationStatus(expectedStatus: "ready" | "issues" | "checking") {
    const status = await this.getValidationStatus();
    expect(status).toBe(expectedStatus);
  }

  async expectConfirmButtonEnabled() {
    await expect(this.confirmButton).toBeEnabled();
  }

  async expectConfirmButtonDisabled() {
    await expect(this.confirmButton).toBeDisabled();
  }

  async clickConfirm() {
    await this.confirmButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async expectGeneratingState() {
    await expect(this.generatingButton).toBeVisible();
    await expect(this.generatingButton).toBeDisabled();
    await expect(this.cancelButton).toBeDisabled();
  }

  async expectLoadingSpinner() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async waitForValidationComplete(timeout = 10000) {
    await expect(this.validationStatusBadge).not.toContainText("checking", { timeout });
  }

  async expectErrorMessage(errorType: "url" | "subscription" | "limit" | "duration" | "generation", message: string) {
    let stepLocator: Locator;

    switch (errorType) {
      case "url":
        stepLocator = this.urlValidationStep;
        break;
      case "subscription":
        stepLocator = this.subscriptionValidationStep;
        break;
      case "limit":
        stepLocator = this.limitValidationStep;
        break;
      case "duration":
        stepLocator = this.durationValidationStep;
        break;
      case "generation":
        stepLocator = this.generationValidationStep;
        break;
    }

    await expect(stepLocator.locator("[data-error-message]")).toContainText(message);
  }

  async expectSuccessMessage(stepType: "url" | "subscription" | "limit" | "duration" | "generation") {
    let stepLocator: Locator;

    switch (stepType) {
      case "url":
        stepLocator = this.urlValidationStep;
        break;
      case "subscription":
        stepLocator = this.subscriptionValidationStep;
        break;
      case "limit":
        stepLocator = this.limitValidationStep;
        break;
      case "duration":
        stepLocator = this.durationValidationStep;
        break;
      case "generation":
        stepLocator = this.generationValidationStep;
        break;
    }

    await expect(stepLocator).toHaveClass(/text-green/);
  }

  async expectAccessible() {
    await this.expectDialogAccessible();
  }

  async expectDialogAccessible() {
    // Check for proper ARIA attributes
    await expect(this.dialog).toHaveAttribute("role", "dialog");
    await expect(this.dialog).toHaveAttribute("aria-modal", "true");
    await expect(this.dialogTitle).toHaveAttribute("id");
    await expect(this.dialog).toHaveAttribute("aria-labelledby");
  }

  async expectKeyboardNavigation() {
    // Test that dialog can be closed with Escape
    await this.page.keyboard.press("Escape");
    await this.expectHidden();
  }

  async expectFocusManagement() {
    // Check that focus is trapped within dialog
    const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
    expect(["BUTTON", "INPUT", "SELECT", "TEXTAREA"]).toContain(focusedElement);
  }

  async expectResponsiveDesign() {
    // Check dialog sizing on different screen sizes
    const dialogContentBox = await this.dialogContent.boundingBox();
    expect(dialogContentBox?.width).toBeLessThanOrEqual(800); // max-w-2xl equivalent
  }

  async waitForDialogAnimation(timeout = 500) {
    // Wait for dialog entrance animation
    await this.page.waitForTimeout(timeout);
  }
}
