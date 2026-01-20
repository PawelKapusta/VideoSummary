#!/usr/bin/env node

/**
 * Development script to check and reset bulk generation status
 * Useful when bulk generation gets stuck in "in_progress"
 *
 * Environment variables (can be set in .env file):
 * SUPABASE_URL=your_supabase_url
 * SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 * APP_URL=http://localhost:3000 (optional)
 */

// Load environment variables from .env file
try {
  const dotenv = await import("dotenv");
  dotenv.config();
  console.log("✅ Loaded environment variables from .env file");
} catch {
  console.warn("⚠️  dotenv not available, trying to load .env manually...");

  // Fallback: try to read .env file manually
  try {
    const fs = await import("fs");
    const path = await import("path");

    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const envLines = envContent.split("\n");

      for (const line of envLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            const value = valueParts.join("=").replace(/^["']|["']$/g, ""); // Remove quotes
            process.env[key] = value;
          }
        }
      }
      console.log("✅ Loaded environment variables from .env file (manual)");
    } else {
      console.warn("⚠️  .env file not found");
    }
  } catch {
    console.warn("⚠️  Could not read .env file manually");
  }
}

const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Supabase configuration for direct database access
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Try to load Supabase client dynamically
let createClient = null;
try {
  const supabaseModule = await import("@supabase/supabase-js");
  createClient = supabaseModule.createClient;
} catch {
  // Supabase not available, will fall back to manual SQL
}

async function checkBulkStatus() {
  try {
    console.log("🔍 Checking bulk generation status...");

    // This would require authentication, so we'll need to handle that
    // For now, let's create a simple script that can be run to check

    console.log("📋 Bulk generation status check would go here");
    console.log("💡 To properly check status, you need to be authenticated");
    console.log(`🔗 API Endpoint: ${APP_URL}/api/summaries/bulk-status`);
  } catch (error) {
    console.error("❌ Error checking bulk status:", error.message);
  }
}

// Show how to reset stuck bulk generations
async function resetStuckBulkGenerations() {
  console.log("🔄 Resetting stuck bulk generations...");
  console.log("");
  console.log("📋 Run this SQL in your Supabase SQL Editor:");
  console.log("");
  console.log("--------------------------------------------------------------------------------");
  console.log('-- Reset bulk generations stuck in "in_progress" for more than 1 hour');
  console.log("UPDATE bulk_generation_status");
  console.log("SET");
  console.log("  status = 'failed',");
  console.log("  error_message = 'Manually reset - stuck in in_progress',");
  console.log("  completed_at = NOW()");
  console.log("WHERE");
  console.log("  status = 'in_progress'");
  console.log("  AND started_at < NOW() - INTERVAL '1 hour';");
  console.log("");
  console.log("-- Check what was reset");
  console.log("SELECT id, status, started_at, completed_at, error_message");
  console.log("FROM bulk_generation_status");
  console.log("WHERE status = 'failed'");
  console.log("  AND error_message LIKE '%stuck in in_progress%'");
  console.log("ORDER BY completed_at DESC;");
  console.log("--------------------------------------------------------------------------------");
  console.log("");
  console.log("💡 Or use the SQL file: scripts/reset-bulk-status.sql");
}

// Reset stuck bulk generations via direct database access
async function resetViaDatabase() {
  if (!createClient) {
    console.log("ℹ️  Supabase client not available, using manual SQL...");
    resetStuckBulkGenerations();
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase environment variables:");
    console.error("   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    console.error("   Falling back to manual SQL...");
    resetStuckBulkGenerations();
    return;
  }

  try {
    console.log("🔄 Resetting stuck bulk generations via database...");

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Call the database function
    const { data: result, error } = await supabase.rpc("reset_stuck_bulk_generations");

    if (error) {
      throw error;
    }

    const resetCount = result?.[0]?.reset_count || 0;
    const updatedIds = result?.[0]?.updated_ids || [];

    console.log("✅ Reset completed successfully!");
    console.log(`   📊 Reset count: ${resetCount}`);
    console.log(`   🆔 Updated IDs: ${updatedIds.join(", ") || "none"}`);

    if (resetCount > 0) {
      console.log("   🎉 Bulk generation status has been reset!");
    } else {
      console.log("   ℹ️  No stuck bulk generations found to reset.");
    }
  } catch (error) {
    console.error("❌ Database reset failed:", error.message);
    console.error("   Falling back to manual SQL...");
    resetStuckBulkGenerations();
  }
}

// Check current bulk generation status
async function checkStatus() {
  if (!createClient) {
    console.log("ℹ️  Supabase client not available, cannot check status automatically");
    console.log("   Run SQL manually in Supabase Dashboard:");
    console.log("");
    console.log("SELECT id, status, started_at, completed_at, error_message");
    console.log("FROM bulk_generation_status");
    console.log("ORDER BY created_at DESC;");
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase environment variables");
    console.error("   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  try {
    console.log("🔍 Checking bulk generation status...");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from("bulk_generation_status")
      .select("id, status, started_at, completed_at, error_message, total_channels, processed_channels")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log("ℹ️  No bulk generations found");
      return;
    }

    console.log("📊 Recent bulk generations:");
    data.forEach((item, index) => {
      const status = item.status;
      const started = item.started_at ? new Date(item.started_at).toLocaleString() : "N/A";
      const completed = item.completed_at ? new Date(item.completed_at).toLocaleString() : "N/A";

      console.log(`   ${index + 1}. ${item.id.slice(0, 8)}... - ${status}`);
      console.log(`      Started: ${started}`);
      if (status === "completed" || status === "failed") {
        console.log(`      Completed: ${completed}`);
      }
      if (item.error_message) {
        console.log(`      Error: ${item.error_message}`);
      }
      console.log(`      Progress: ${item.processed_channels}/${item.total_channels} channels`);
      console.log("");
    });

    // Check for stuck generations
    const stuck = data.filter(
      (item) =>
        item.status === "in_progress" && item.started_at && new Date() - new Date(item.started_at) > 60 * 60 * 1000 // 1 hour
    );

    if (stuck.length > 0) {
      console.log("⚠️  Found stuck bulk generations (in_progress > 1 hour):");
      stuck.forEach((item) => {
        console.log(`   - ${item.id.slice(0, 8)}... started ${new Date(item.started_at).toLocaleString()}`);
      });
      console.log('💡 Run "npm run check-bulk-status reset" to fix these');
    }
  } catch (error) {
    console.error("❌ Failed to check status:", error.message);
  }
}

// If run directly, show help
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🚀 Bulk Generation Status Management\n");

  if (process.argv[2] === "reset") {
    resetViaDatabase();
  } else if (process.argv[2] === "status" || process.argv[2] === "check") {
    checkStatus();
  } else {
    console.log("Usage:");
    console.log("  npm run check-bulk-status             # Show this help");
    console.log("  npm run check-bulk-status status      # Check current bulk generation status");
    console.log("  npm run check-bulk-status reset       # Reset stuck generations");
    console.log("");

    // Check if environment variables are set
    const hasSupabaseVars = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY;
    const hasSupabaseClient = !!createClient;

    if (hasSupabaseVars && hasSupabaseClient) {
      console.log("✅ Environment configured for direct database access");
    } else {
      console.log("⚠️  Environment not fully configured");
      if (!hasSupabaseVars) {
        console.log("   Missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
        console.log("");
        console.log("   Quick fix - export manually:");
        console.log('   export SUPABASE_URL="your-supabase-url"');
        console.log('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
        console.log("");
        console.log("   Or check your .env file has these variables set.");
      }
      if (!hasSupabaseClient) {
        console.log("   Missing: @supabase/supabase-js package");
        console.log("   Install with: npm install @supabase/supabase-js");
      }
      console.log("");
      console.log("Alternative (recommended):");
      console.log("Run SQL manually in Supabase Dashboard");
      console.log("See: scripts/reset-bulk-status.sql");
    }

    console.log("");
    console.log("💡 Get credentials from Supabase project settings > API");
    console.log("");
  }
}

export { checkBulkStatus, resetStuckBulkGenerations };
