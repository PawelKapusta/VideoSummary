import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Disable parallel execution for database-dependent tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 3, // Limit workers for database stability
  reporter: "html",
  use: {
    trace: "on-first-retry",
    baseURL: "http://localhost:3001",
    storageState: undefined, // Will be set per project
  },
  projects: [
    // ===== Public Pages (No Auth Required) =====
    {
      name: "landing page",
      testMatch: /landing-.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // No storageState - public page
      },
    },
    {
      name: "landing page mobile",
      testMatch: /landing-.*\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        // No storageState - public page
      },
    },

    // ===== Auth Tests (Login/Registration - No Session) =====
    // These tests start with a clean slate (no authenticated session)
    // as recommended by Playwright best practices
    {
      name: "auth tests",
      testMatch: /auth\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: undefined, // Fresh session - not logged in
      },
      dependencies: ["setup db"],
      teardown: "teardown db",
    },
    {
      name: "auth tests mobile",
      testMatch: /auth\/.*\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        storageState: undefined, // Fresh session - not logged in
      },
      dependencies: ["setup db"],
      teardown: "teardown db",
    },

    // ===== Setup & Teardown =====
    {
      name: "setup db",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "teardown db",
      testMatch: /global\.teardown\.ts/,
    },

    // ===== Auth Setup (for authenticated tests) =====
    {
      name: "setup auth ui",
      testMatch: /auth\.setup\.ts/,
      grep: /authenticate desktop/,
      dependencies: ["setup db"],
    },
    {
      name: "setup auth ui mobile",
      testMatch: /auth\.setup\.ts/,
      grep: /authenticate mobile/,
      dependencies: ["setup db"],
    },
    {
      name: "setup auth api",
      testMatch: /auth-api\.setup\.ts/,
      grep: /authenticate via api/,
      dependencies: ["setup db"],
    },
    {
      name: "setup auth api mobile",
      testMatch: /auth-api\.setup\.ts/,
      grep: /authenticate mobile via api/,
      dependencies: ["setup db"],
    },

    // ===== Authenticated Tests (Videos) =====
    {
      name: "videos e2e ui",
      testMatch: /videos\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "test-results/.auth/user.json",
      },
      dependencies: ["setup auth ui"],
      teardown: "teardown db",
    },
    {
      name: "videos e2e api",
      testMatch: /videos\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "test-results/.auth/user-api.json",
      },
      dependencies: ["setup auth api"],
      teardown: "teardown db",
    },
    {
      name: "videos mobile ui",
      testMatch: /videos\/.*\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        storageState: "test-results/.auth/user-mobile.json",
      },
      dependencies: ["setup auth ui mobile"],
      teardown: "teardown db",
    },
    {
      name: "videos mobile api",
      testMatch: /videos\/.*\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        storageState: "test-results/.auth/user-mobile-api.json",
      },
      dependencies: ["setup auth api mobile"],
      teardown: "teardown db",
    },

    // ===== Authenticated Tests (Dashboard) =====
    {
      name: "dashboard e2e",
      testMatch: /dashboard\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "test-results/.auth/user-api.json",
      },
      dependencies: ["setup auth api"],
      teardown: "teardown db",
    },
  ],
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3001",
    reuseExistingServer: true, // Always reuse server in local dev
    timeout: 120 * 1000,
    // Note: dev:e2e script loads .env.test automatically via dotenv
    // These are just fallbacks/overrides if needed
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_KEY: process.env.SUPABASE_KEY || "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      E2E_USERNAME: process.env.E2E_USERNAME || "",
      E2E_PASSWORD: process.env.E2E_PASSWORD || "",
    },
  },
});
