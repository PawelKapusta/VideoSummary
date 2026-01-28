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

async function checkUser() {
  console.log(`\n🔍 Checking user: ${email}...`);

  // Try to login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.log("❌ Login failed:", loginError.message);
    console.log("   Status:", loginError.status);
    console.log("   Code:", loginError.code);

    // If user doesn't exist, try to register
    if (
      loginError.message.includes("Invalid login credentials") ||
      loginError.message.includes("User not found") ||
      loginError.message.includes("Invalid") ||
      loginError.status === 400
    ) {
      console.log("\n📝 User not found. Attempting registration...");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error("\n❌ Registration failed!");
        console.error("   Error:", signUpError.message);
        console.error("   Status:", signUpError.status);
        console.error("   Code:", signUpError.code);
        console.error("\n💡 Possible issues:");
        console.error("   - Email confirmation may be required in Supabase Auth settings");
        console.error("   - Rate limiting may be active");
        console.error("   - Invalid Supabase credentials");
        process.exit(1);
      } else {
        console.log("\n✅ Registration successful!");
        console.log("   User ID:", signUpData.user?.id);
        console.log("   Email:", signUpData.user?.email);
        if (signUpData.session) {
          console.log("   ✓ Session created - Email confirmation is DISABLED (Good for testing!)");
        } else {
          console.log("   ⚠ No session - Email confirmation is REQUIRED");
          console.log("   💡 To fix: Disable email confirmation in Supabase Dashboard:");
          console.log("      Authentication → Providers → Email → Disable 'Confirm email'");
        }

        // Try to login again to verify
        console.log("\n🔄 Verifying login with new credentials...");
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (verifyError) {
          console.log("⚠ Login verification failed:", verifyError.message);
          console.log("   This might be OK if email confirmation is required.");
        } else {
          console.log("✅ Login verification successful!");
        }

        process.exit(0);
      }
    } else {
      console.error("\n❌ Unexpected login error!");
      console.error("   Message:", loginError.message);
      console.error("   Status:", loginError.status);
      console.error("   Code:", loginError.code);
      console.error("\n💡 Check:");
      console.error("   - Supabase project URL and key are correct");
      console.error("   - Supabase project is accessible");
      console.error("   - Password requirements are met");
      process.exit(1);
    }
  } else {
    console.log("\n✅ Login successful!");
    console.log("   User ID:", loginData.user?.id);
    console.log("   Email:", loginData.user?.email);
    console.log("   Has access token:", !!loginData.session?.access_token);
    console.log("   Has refresh token:", !!loginData.session?.refresh_token);
    
    if (loginData.session?.expires_at) {
      console.log("   Session expires at (raw):", loginData.session.expires_at);
      console.log("   Session expires at (type):", typeof loginData.session.expires_at);
      
      const expiresDate = new Date(loginData.session.expires_at);
      console.log("   Session expires at (parsed):", expiresDate.toISOString());
      
      // Check if session is valid (not expired)
      const now = new Date();
      const timeUntilExpiry = expiresDate.getTime() - now.getTime();
      const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
      
      if (expiresDate > now) {
        console.log(`   ✓ Session is valid! Expires in ~${hoursUntilExpiry} hours`);
      } else {
        console.log("   ⚠ WARNING: Session appears to be expired!");
        console.log("   💡 This might indicate email confirmation is required.");
      }
    } else {
      console.log("   ⚠ WARNING: No session expiration time!");
      console.log("   💡 This usually means email confirmation is required.");
    }
    
    console.log("   ✓ Test user is ready for E2E tests!");
    process.exit(0);
  }
}

checkUser().catch((error) => {
  console.error("Failed to check/register user:", error);
  process.exit(1);
});
