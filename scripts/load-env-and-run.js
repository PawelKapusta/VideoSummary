#!/usr/bin/env node

/**
 * Script to run Astro dev server for E2E tests.
 *
 * In LOCAL development:
 *   - Temporarily copies .env.test to .env so Astro loads test credentials
 *   - Backs up original .env and restores it on exit
 *
 * In CI/CD:
 *   - Environment variables are available directly (no .env file needed)
 *   - Astro reads variables from process.env automatically
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
  // CI/CD mode: Environment variables are available directly, no .env file needed
  console.log("🤖 CI environment detected - using environment variables directly");
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
      // CI: No cleanup needed - no .env file was created
      console.log("\n🧹 CI cleanup - no files to clean");
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

// Run Astro dev server
const astro = spawn("npx", ["astro", "dev", "--port", "3001"], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
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
