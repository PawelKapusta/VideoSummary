import { useState } from "react";
import { toast } from "sonner";
import type { AuthResponse, ApiError } from "@/types";
import { SignupForm } from "@/components/auth/SignupForm";
import { storeSession } from "@/lib/auth";
import { SignupNavigationLinks } from "@/components/auth/SignupNavigationLinks";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { motion } from "framer-motion";

export default function SignupView() {
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSignupSuccess = (response: AuthResponse) => {
    if (response.session) {
      storeSession(response.session);
      toast.success("Successfully registered!", {
        description: "Redirecting to dashboard...",
      });

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } else {
      setIsEmailSent(true);
      toast.info("Verification Required", {
        description: "Please check your email to confirm your account before logging in.",
        duration: 10000,
      });
    }
  };

  const handleSignupError = (error: ApiError) => {
    toast.error("Registration failed", {
      description: error.error.message,
      duration: 5000,
    });
  };

  if (isEmailSent) {
    return (
      <AuthLayout title="Create an account" description="Sign up to start generating insights">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 py-8"
        >
          <div className="text-center space-y-6">
            <p className="text-emerald-600 font-medium text-lg leading-relaxed px-4">
              Please check your email for a verification link to complete your registration.
            </p>

            <div className="pt-4">
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                  } catch (e) {
                    console.error("Logout failed:", e);
                  }
                  window.location.href = "/login";
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 cursor-pointer"
              >
                Return to login
              </button>
            </div>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      description="Start generating insights from your favorite videos"
      footer={<SignupNavigationLinks />}
    >
      <SignupForm onSuccess={handleSignupSuccess} onError={handleSignupError} />
    </AuthLayout>
  );
}
