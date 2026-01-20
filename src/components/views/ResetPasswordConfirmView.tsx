import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useConfirmResetPasswordForm } from "@/hooks/useConfirmResetPasswordForm";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { ConfirmPasswordInput } from "@/components/auth/ConfirmPasswordInput";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import type { ConfirmResetFormState } from "@/types";
import type { ApiSuccess } from "@/types";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { motion } from "framer-motion";

const ResetPasswordForm: React.FC<{
  formState: ConfirmResetFormState;
  handleInputChange: (field: keyof ConfirmResetFormState["data"], value: string) => void;
  handleBlur: (field: keyof ConfirmResetFormState["data"]) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => Promise<ApiSuccess<void> | null>;
  isSubmitting: boolean;
}> = ({ formState, handleInputChange, handleBlur, handleSubmit, isSubmitting }) => (
  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
    <div className="space-y-4">
      <PasswordInput
        value={formState.data.password}
        onChange={(value) => handleInputChange("password", value)}
        onBlur={() => handleBlur("password")}
        error={formState.errors.password}
        disabled={isSubmitting}
        showStrength={true}
        showToggle={true}
        label="New Password"
      />
      <ConfirmPasswordInput
        value={formState.data.confirmPassword}
        onChange={(value) => handleInputChange("confirmPassword", value)}
        onBlur={() => handleBlur("confirmPassword")}
        error={formState.errors.confirmPassword}
        disabled={isSubmitting}
        showToggle={true}
      />
    </div>

    {formState.errors.form && (
      <p
        className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg border border-red-100"
        role="alert"
      >
        {formState.errors.form}
      </p>
    )}

    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/25 py-6 text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!formState.isValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Resetting Password...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </motion.div>
  </form>
);

export const ResetPasswordConfirmView: React.FC = () => {
  const [token, setToken] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    formState,
    handleInputChange,
    handleBlur,
    handleSubmit: hookHandleSubmit,
  } = useConfirmResetPasswordForm(token);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    if (!tokenParam) {
      toast.error("No reset link provided. Please check your email or request a new one.");
      window.location.href = "/reset-password";
      return;
    }
    setToken(tokenParam);
  }, []);

  const handleFormSubmit = async (e?: React.FormEvent<HTMLFormElement>): Promise<ApiSuccess<void> | null> => {
    if (e) {
      e.preventDefault();
    }

    const result = await hookHandleSubmit(e);
    if (result) {
      toast.success("Password reset successfully! Redirecting to login...");
      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } else if (formState.errors.form) {
      if (formState.errors.form.includes("INVALID_TOKEN")) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        window.location.href = "/reset-password";
      } else {
        toast.error(formState.errors.form);
      }
    }

    return result;
  };

  return (
    <AuthLayout
      title={showSuccess ? "Success!" : "Set New Password"}
      description={showSuccess ? "Your password has been reset" : "Create a secure password for your account"}
      footer={
        !showSuccess && (
          <div className="text-center">
            <a
              href="/login"
              className="font-semibold text-slate-600 hover:text-blue-600 transition-colors underline-offset-4 hover:underline"
            >
              ← Back to Login
            </a>
          </div>
        )
      }
    >
      {showSuccess ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6 py-4 text-center"
        >
          <div className="rounded-full bg-green-500/10 p-5 ring-1 ring-green-500/20">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <p className="text-base text-slate-600 font-medium">Your password has been updated.</p>
            <p className="text-sm text-slate-400">Redirecting you to login...</p>
          </div>
        </motion.div>
      ) : token ? (
        <ResetPasswordForm
          formState={formState}
          handleInputChange={handleInputChange}
          handleBlur={handleBlur}
          handleSubmit={handleFormSubmit}
          isSubmitting={formState.isSubmitting}
        />
      ) : (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
    </AuthLayout>
  );
};
