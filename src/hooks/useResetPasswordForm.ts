import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { ResetFormState, ResetFormData, ResetFormErrors } from "@/types";
import { resetPassword, ApiClientError } from "@/lib/api";
import { ResetPasswordRequestSchema } from "@/lib/validation/schemas";

const resetSchema = ResetPasswordRequestSchema.refine((val) => val.email.trim() !== "", {
  message: "Email is required",
  path: ["email"],
}).refine((val) => val.email.length >= 5 && val.email.length <= 254, {
  message: "Email must be between 5 and 254 characters",
  path: ["email"],
});

export function useResetPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, setState] = useState<Omit<ResetFormState, "isRateLimited"> & { isRateLimited: boolean }>({
    data: { email: "" },
    errors: {},
    isSubmitting: false,
    isValid: false,
    isRateLimited: false,
  });

  // Cooldown timer
  useEffect(() => {
    if (!state.isRateLimited) return;

    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, isRateLimited: false }));
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [state.isRateLimited]);

  const validateForm = useCallback((data: ResetFormData) => {
    const result = resetSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: ResetFormErrors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") {
          fieldErrors.email = err.message;
        } else {
          fieldErrors.form = "Invalid form data";
        }
      });
      return { errors: fieldErrors, isValid: false };
    }
    return { errors: {}, isValid: true };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (state.isRateLimited) return; // Block input during cooldown

      const email = e.target.value;
      const { errors, isValid } = validateForm({ email });

      setState((prev) => ({
        ...prev,
        data: { ...prev.data, email },
        errors: { ...prev.errors, ...errors },
        isValid,
      }));
    },
    [validateForm, state.isRateLimited]
  );

  const handleSubmit = useCallback(async () => {
    if (!state.isValid || state.isSubmitting || state.isRateLimited) return;

    setState((prev) => ({ ...prev, isSubmitting: true, errors: { ...prev.errors, form: undefined } }));

    try {
      await resetPassword({ email: state.data.email });

      toast.success("Password reset email sent. Check your inbox (and spam folder).", { duration: 5000 });
      setState((prev) => ({ ...prev, isSubmitting: false }));
      onSuccess?.();
    } catch (error) {
      setState((prev) => ({ ...prev, isSubmitting: false }));
      if (error instanceof ApiClientError) {
        const apiError = error;
        if (apiError.code === "RATE_LIMIT_EXCEEDED") {
          toast.error("Too many reset requests. Please wait 30 seconds before trying again.", { duration: 5000 });
          setState((prev) => ({ ...prev, isRateLimited: true }));
          return;
        } else if (apiError.code === "INVALID_INPUT") {
          setState((prev) => ({
            ...prev,
            errors: { ...prev.errors, email: "Please enter a valid email" },
          }));
          return;
        } else {
          toast.error(apiError.message || "Failed to send reset email. Please try again.", { duration: 4000 });
          return;
        }
      } else {
        console.error("Reset password error:", error);
        toast.error("Connection error. Please check your internet and try again.", { duration: 4000 });
      }
    }
  }, [state.isValid, state.isSubmitting, state.isRateLimited, state.data.email, onSuccess]);

  return {
    formState: state,
    handleChange,
    handleSubmit,
  };
}
