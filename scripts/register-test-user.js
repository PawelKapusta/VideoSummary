import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const email = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  console.log(`Checking user: ${email}...`);

  // Try to login
  const { data: _loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.log("Login failed:", loginError.message);

    // If user doesn't exist, try to register
    if (loginError.message.includes("Invalid login credentials") || loginError.message.includes("User not found")) {
      console.log("User not found. Registering...");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error("SignUp failed:", signUpError.message);
      } else {
        console.log("SignUp successful! User ID:", signUpData.user?.id);
        if (signUpData.session) {
          console.log("Session created - Email confirmation is DISABLED.");
        } else {
          console.log("No session - Email confirmation is REQUIRED.");
        }
      }
    }
  } else {
    console.log("Login successful! Session established.");
  }
}

checkUser();
