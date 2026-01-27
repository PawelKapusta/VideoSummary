import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function debugLogin() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  try {
    console.log("Navigating to login...");
    await page.goto("http://localhost:3000/login");

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    console.log("Clicking login...");
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    const url = page.url();
    console.log("Current URL:", url);

    const errorText = await page
      .locator(".text-red-600, .text-destructive, [role='alert']")
      .innerText()
      .catch(() => "No error text found");
    console.log("Error text on page:", errorText);

    await page.screenshot({ path: "login-debug.png" });
    console.log("Screenshot saved to login-debug.png");
  } catch (e) {
    console.error("Debug script failed:", e);
  } finally {
    await browser.close();
  }
}

debugLogin();
