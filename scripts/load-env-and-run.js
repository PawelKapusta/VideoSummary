#!/usr/bin/env node

/**
 * Script to run Astro dev server for E2E tests.
 *
 * In LOCAL development:
 *   - Temporarily copies .env.test to .env so Astro loads test credentials
 *   - Backs up original .env and restores it on exit
 *
 * In CI/CD:
 *   - Copies .env.test to .env so Astro loads test credentials
 *   - Cleans up .env on exit
 *   - Note: CI workflow creates .env.test from GitHub Secrets before running tests
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync, renameSync, copyFileSync, unlinkSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const envPath = resolve(projectRoot, ".env");
const envBackupPath = resolve(projectRoot, ".env.e2e-backup");
const envTestPath = resolve(projectRoot, ".env.test");

// Detect CI environment
const isCI = process.env.CI === "true" || process.env.CI === true;

let envWasRenamed = false;

if (isCI) {
  // CI/CD mode: Create .env from .env.test for Astro to load
  console.log("🤖 CI environment detected - creating .env from .env.test");
  
  if (!existsSync(envTestPath)) {
    console.error("❌ .env.test file not found in CI!");
    console.error("   The CI workflow should create .env.test before running tests.");
    process.exit(1);
  }
  
  // Copy .env.test to .env so Astro loads it
  console.log("📋 Copying .env.test to .env for Astro to load");
  copyFileSync(envTestPath, envPath);
} else {
  // Local development mode: Use .env.test
  if (!existsSync(envTestPath)) {
    console.error("❌ .env.test file not found!");
    console.error("   Please create .env.test with your E2E Supabase credentials.");
    process.exit(1);
  }

  // Temporarily rename .env to prevent Astro from loading it
  if (existsSync(envPath)) {
    console.log("📦 Temporarily backing up .env to .env.e2e-backup");
    renameSync(envPath, envBackupPath);
    envWasRenamed = true;
  }

  // Copy .env.test to .env so Astro loads it
  console.log("📋 Copying .env.test to .env for Astro to load");
  copyFileSync(envTestPath, envPath);
}

// Cleanup function to restore .env
function cleanup() {
  try {
    if (isCI) {
      // CI: Remove the .env file that was created from .env.test
      console.log("\n🧹 CI cleanup - removing temporary .env");
      if (existsSync(envPath)) {
        unlinkSync(envPath);
      }
    } else {
      // Local: Remove the temporary .env (which is a copy of .env.test)
      if (existsSync(envPath)) {
        unlinkSync(envPath);
      }
      // Restore original .env
      if (envWasRenamed && existsSync(envBackupPath)) {
        console.log("\n🔄 Restoring original .env from backup");
        renameSync(envBackupPath, envPath);
      }
    }
  } catch (err) {
    console.error("Warning: Failed to cleanup:", err.message);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

console.log("✅ E2E environment configured");
console.log("🚀 Starting Astro dev server on port 3001...\n");

// In CI, explicitly pass environment variables to ensure Astro has access
// This is critical because child process env inheritance can be unreliable
const astroEnv = {
  ...process.env,
  // Explicitly set critical variables (they might come from CI secrets or .env.test)
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  E2E_USERNAME: process.env.E2E_USERNAME,
  E2E_PASSWORD: process.env.E2E_PASSWORD,
};

if (isCI) {
  console.log("🔑 Passing environment variables to Astro process:");
  console.log("   SUPABASE_URL:", astroEnv.SUPABASE_URL ? "✓ set" : "✗ missing");
  console.log("   SUPABASE_KEY:", astroEnv.SUPABASE_KEY ? "✓ set" : "✗ missing");
}

// Run Astro dev server with explicit env
const astro = spawn("npx", ["astro", "dev", "--port", "3001"], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
  env: astroEnv,
});

astro.on("error", (err) => {
  console.error("Failed to start Astro:", err);
  cleanup();
  process.exit(1);
});

astro.on("close", (code) => {
  cleanup();
  process.exit(code || 0);
});
