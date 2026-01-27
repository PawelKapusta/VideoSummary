import { useEffect, useRef, useMemo } from "react";
import React from "react";
import type { AuthResponse, ApiError } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { EmailInput } from "./EmailInput";
import { PasswordInput } from "./PasswordInput";
import { ConfirmPasswordInput } from "./ConfirmPasswordInput";
import { FormErrorMessage } from "./FormErrorMessage";
import { useSignupForm } from "@/hooks/useSignupForm";
import { motion } from "framer-motion";

export interface SignupFormProps {
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: ApiError) => void;
}

export function SignupForm({ onSuccess, onError }: SignupFormProps) {
  const {
    state: { data, errors, isSubmitting },
    handleInputChange,
    handleBlur,
    handleSubmit,
    hasSubmitted,
    clearFormError,
    isDisabled,
  } = useSignupForm({ onSuccess, onError });

  const formRef = useRef<HTMLFormElement>(null);
  const focusedOnceRef = useRef(false);

  useEffect(() => {
    if (hasSubmitted && Object.values(errors).some((e) => e) && !isSubmitting && !focusedOnceRef.current) {
      focusedOnceRef.current = true;
      const firstErrorInput = formRef.current?.querySelector('[aria-invalid="true"]') as HTMLInputElement;
      if (firstErrorInput) {
        firstErrorInput.focus();
        firstErrorInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [hasSubmitted, errors, isSubmitting]);

  useEffect(() => {
    if (isSubmitting) {
      focusedOnceRef.current = false;
    }
  }, [isSubmitting]);

  const computedIsValid = useMemo(
    () =>
      Object.values(errors).every((e) => !e) &&
      data.email.trim() &&
      data.password.trim() &&
      data.confirmPassword.trim() &&
      data.confirmPassword === data.password,
    [errors, data]
  );

  const apiError = errors.form
    ? ({ error: { code: "FORM_ERROR" as const, message: errors.form, details: {} } } as ApiError)
    : null;

  return (
    <form
      data-testid="signup-form"
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      noValidate
      className="space-y-4"
    >
      <FormErrorMessage error={apiError} onDismiss={clearFormError} />

      <div className="space-y-3">
        <EmailInput
          value={data.email}
          onChange={(value) => handleInputChange("email", value)}
          onBlur={() => handleBlur("email")}
          error={errors.email}
          disabled={isSubmitting}
        />

        <PasswordInput
          value={data.password}
          onChange={(value) => handleInputChange("password", value)}
          onBlur={() => handleBlur("password")}
          error={errors.password}
          disabled={isSubmitting}
          showToggle={true}
          showStrength={true}
        />

        <ConfirmPasswordInput
          value={data.confirmPassword}
          onChange={(value) => handleInputChange("confirmPassword", value)}
          onBlur={() => handleBlur("confirmPassword")}
          error={errors.confirmPassword}
          disabled={isSubmitting}
          showToggle={true}
        />
      </div>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/25 py-6 text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isDisabled || !computedIsValid}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Sign Up"
          )}
        </Button>
      </motion.div>
    </form>
  );
}
