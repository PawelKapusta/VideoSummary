import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const email = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

// Validate environment variables
if (!supabaseUrl || !supabaseKey || !email || !password) {
  console.error("❌ Missing required environment variables:");
  console.error("   SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_KEY:", supabaseKey ? "✓" : "✗");
  console.error("   E2E_USERNAME:", email ? "✓" : "✗");
  console.error("   E2E_PASSWORD:", password ? "✓" : "✗");
  process.exit(1);
}

console.log("📋 Test user configuration:");
console.log("   Email:", email);
console.log("   Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUser() {
  console.log(`\n🔍 Verifying test user: ${email}...`);

  // Try to login to verify the user exists and credentials are correct
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.error("\n❌ Test user verification failed!");
    console.error("   Error:", loginError.message);
    console.error("   Status:", loginError.status);
    console.error("   Code:", loginError.code);
    console.error("\n💡 Possible issues:");
    console.error("   - Test user does not exist in Supabase");
    console.error("   - Incorrect E2E_USERNAME or E2E_PASSWORD in secrets");
    console.error("   - Supabase project URL or key is incorrect");
    process.exit(1);
  }

  console.log("\n✅ Test user verified successfully!");
  console.log("   User ID:", loginData.user?.id);
  console.log("   Email:", loginData.user?.email);
  console.log("   Has access token:", !!loginData.session?.access_token);
  console.log("   Has refresh token:", !!loginData.session?.refresh_token);

  if (loginData.session?.expires_at) {
    // Supabase returns expires_at as Unix timestamp in SECONDS, but Date() expects milliseconds
    const expiresDate = new Date(loginData.session.expires_at * 1000);
    const now = new Date();
    const hoursUntilExpiry = Math.floor((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log(`   Session valid for ~${hoursUntilExpiry} hours`);
  }

  console.log("\n✓ Test user is ready for E2E tests!");
  process.exit(0);
}

verifyUser().catch((error) => {
  console.error("Failed to verify test user:", error);
  process.exit(1);
});
