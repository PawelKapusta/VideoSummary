import { test, expect } from "@playwright/test";

test.describe("Registration Page - Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("should navigate to login page when clicking login link", async ({ page }) => {
    const loginLink = page.locator("a").filter({ hasText: /Log in|Sign in/i });
    await loginLink.click();

    await expect(page).toHaveURL(/\/login/);
  });
});
