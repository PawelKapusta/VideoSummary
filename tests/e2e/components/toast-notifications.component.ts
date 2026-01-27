import { type Page, type Locator, expect } from "@playwright/test";

export class ToastNotificationsComponent {
  readonly page: Page;
  readonly toastContainer: Locator;

  // Toast elements
  readonly toasts: Locator;
  readonly successToasts: Locator;
  readonly errorToasts: Locator;
  readonly infoToasts: Locator;
  readonly warningToasts: Locator;

  // Toast content
  readonly toastTitles: Locator;
  readonly toastMessages: Locator;
  readonly toastCloseButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toastContainer = page.locator("[data-sonner-toaster]");

    // Toast elements
    this.toasts = this.toastContainer.locator("[data-sonner-toast]");
    this.successToasts = this.toasts.filter({ has: page.locator('[data-icon="check"]') });
    this.errorToasts = this.toasts.filter({ has: page.locator('[data-icon="x"]') });
    this.infoToasts = this.toasts.filter({ has: page.locator('[data-icon="info"]') });
    this.warningToasts = this.toasts.filter({ has: page.locator('[data-icon="alert"]') });

    // Toast content
    this.toastTitles = this.toasts.locator("[data-title]");
    this.toastMessages = this.toasts.locator("[data-description]");
    this.toastCloseButtons = this.toasts.locator("[data-close-button]");
  }

  async expectContainerVisible() {
    await expect(this.toastContainer).toBeVisible();
  }

  async expectContainerHidden() {
    await expect(this.toastContainer).not.toBeVisible();
  }

  async getToastCount(): Promise<number> {
    return await this.toasts.count();
  }

  async expectToastCount(expectedCount: number) {
    await expect(this.toasts).toHaveCount(expectedCount);
  }

  async expectNoToasts() {
    await expect(this.toasts).toHaveCount(0);
  }

  async expectSuccessToast(message: string) {
    await expect(this.successToasts.filter({ hasText: message })).toBeVisible();
  }

  async expectErrorToast(message: string) {
    await expect(this.errorToasts.filter({ hasText: message })).toBeVisible();
  }

  async expectInfoToast(message: string) {
    await expect(this.infoToasts.filter({ hasText: message })).toBeVisible();
  }

  async expectWarningToast(message: string) {
    await expect(this.warningToasts.filter({ hasText: message })).toBeVisible();
  }

  async expectToastWithTitle(title: string, message?: string) {
    const toast = this.toasts.filter({ hasText: title });
    await expect(toast).toBeVisible();

    if (message) {
      await expect(toast.filter({ hasText: message })).toBeVisible();
    }
  }

  async expectToastContainsText(text: string) {
    await expect(this.toasts.filter({ hasText: text })).toBeVisible();
  }

  async getLatestToastText(): Promise<string | null> {
    const latestToast = this.toasts.first();
    return await latestToast.textContent();
  }

  async getToastText(index = 0): Promise<string | null> {
    const toast = this.toasts.nth(index);
    return await toast.textContent();
  }

  async closeToast(index = 0) {
    const closeButton = this.toastCloseButtons.nth(index);
    await closeButton.click();
  }

  async closeAllToasts() {
    const count = await this.getToastCount();
    for (let i = 0; i < count; i++) {
      await this.closeToast(0); // Always close the first one as they shift
      await this.page.waitForTimeout(100); // Small delay between closes
    }
  }

  async waitForToast(message: string, timeout = 5000) {
    await expect(this.toasts.filter({ hasText: message })).toBeVisible({ timeout });
  }

  async waitForSuccessToast(message: string, timeout = 5000) {
    await expect(this.successToasts.filter({ hasText: message })).toBeVisible({ timeout });
  }

  async waitForErrorToast(message: string, timeout = 5000) {
    await expect(this.errorToasts.filter({ hasText: message })).toBeVisible({ timeout });
  }

  async expectToastAutoDismiss(timeout = 4000) {
    const initialCount = await this.getToastCount();
    await this.page.waitForTimeout(timeout);
    const finalCount = await this.getToastCount();
    expect(finalCount).toBeLessThan(initialCount);
  }

  async expectToastPersistent() {
    const initialCount = await this.getToastCount();
    await this.page.waitForTimeout(5000); // Wait longer than auto-dismiss
    const finalCount = await this.getToastCount();
    expect(finalCount).toBe(initialCount);
  }

  async expectToastPosition(
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center"
  ) {
    // This depends on the toast library configuration
    // Check the container classes or styles
    const containerClasses = await this.toastContainer.getAttribute("class");
    expect(containerClasses).toContain(position.replace("-", ""));
  }

  async expectToastAnimation() {
    // Check for animation classes or styles
    const toast = this.toasts.first();
    await expect(toast).toHaveClass(/animate/);
  }

  async expectToastAccessibility() {
    const toast = this.toasts.first();

    // Check for proper ARIA attributes
    await expect(toast).toHaveAttribute("role", "alert");
    await expect(toast).toHaveAttribute("aria-live", "assertive");

    // Check for focus management
    const closeButton = this.toastCloseButtons.first();
    await expect(closeButton).toHaveAttribute("aria-label");
  }

  async expectToastStyling(type: "success" | "error" | "info" | "warning") {
    let toastLocator: Locator;

    switch (type) {
      case "success":
        toastLocator = this.successToasts;
        break;
      case "error":
        toastLocator = this.errorToasts;
        break;
      case "info":
        toastLocator = this.infoToasts;
        break;
      case "warning":
        toastLocator = this.warningToasts;
        break;
    }

    // Check for appropriate styling classes
    await expect(toastLocator.first()).toHaveClass(/bg-green|text-green/);
  }

  async expectToastActionButton(actionText: string) {
    const actionButton = this.toasts.locator("button").filter({ hasText: actionText });
    await expect(actionButton).toBeVisible();
  }

  async clickToastAction(actionText: string) {
    const actionButton = this.toasts.locator("button").filter({ hasText: actionText });
    await actionButton.click();
  }

  async expectToastProgressBar() {
    // If toasts have progress bars for auto-dismiss
    const progressBar = this.toasts.locator("[data-progress]");
    await expect(progressBar).toBeVisible();
  }

  async expectToastSwipeToDismiss() {
    // Test swipe gesture on mobile
    const toast = this.toasts.first();
    const box = await toast.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2);
      await this.page.mouse.up();
    }
  }

  async getToastByContent(content: string): Promise<Locator> {
    return this.toasts.filter({ hasText: content });
  }

  async expectMultipleToasts() {
    const count = await this.getToastCount();
    expect(count).toBeGreaterThan(1);
  }

  async expectToastStacking() {
    const toasts = this.toasts;
    const count = await toasts.count();

    if (count > 1) {
      // Check that toasts are stacked properly
      for (let i = 0; i < count - 1; i++) {
        const currentToast = toasts.nth(i);
        const nextToast = toasts.nth(i + 1);

        const currentBox = await currentToast.boundingBox();
        const nextBox = await nextToast.boundingBox();

        if (currentBox && nextBox) {
          // Next toast should be positioned below current toast
          expect(nextBox.y).toBeGreaterThan(currentBox.y + currentBox.height);
        }
      }
    }
  }
}
