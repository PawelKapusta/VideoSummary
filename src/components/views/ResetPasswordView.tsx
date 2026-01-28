import { useState } from "react";
import ResetPasswordForm from "../auth/ResetPasswordForm";
import { NavigationLinks } from "../auth/NavigationLinks";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { motion } from "framer-motion";

export default function ResetPasswordView() {
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div data-testid="reset-password-view">
      <AuthLayout
        title={showSuccess ? "Link Sent" : "Reset Password"}
        description={showSuccess ? "Check your email for instructions" : "Enter your email to receive a reset link"}
        footer={
          !showSuccess ? (
            <div className="text-center">
              <a
                href="/login"
                className="font-semibold text-slate-600 hover:text-blue-600 transition-colors underline-offset-4 hover:underline"
              >
                ← Back to Login
              </a>
            </div>
          ) : (
            <NavigationLinks />
          )
        }
      >
        {showSuccess ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6 py-4"
          >
            <div className="rounded-full bg-green-500/10 p-4 ring-1 ring-green-500/20">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold text-white">Reset Link Sent!</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We&apos;ve sent a password reset link to your email address. Please click it to set your new password.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/reset-password/confirm?token=mock-dev-token")}
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              Test Confirm Page (Dev Only)
            </Button>
          </motion.div>
        ) : (
          <ResetPasswordForm onSuccess={() => setShowSuccess(true)} />
        )}
      </AuthLayout>
    </div>
  );
}
