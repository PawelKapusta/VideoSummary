import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import { confirmResetPassword, ApiClientError } from '@/lib/api';
import type {
  ConfirmResetFormState,
  ConfirmResetFormData,
  ConfirmResetFormErrors,
  ConfirmResetPasswordRequest,
  ApiSuccess,
} from '@/types';
import { PasswordSchema } from '@/lib/validation/schemas';

const formSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const validateForm = (data: ConfirmResetFormData): { errors: ConfirmResetFormErrors; isValid: boolean } => {
  const result = formSchema.safeParse(data);
  if (result.success) {
    return { errors: {}, isValid: true };
  }

  const fieldErrors: ConfirmResetFormErrors = {};
  result.error.errors.forEach((issue) => {
    const field = issue.path[0] as keyof ConfirmResetFormData;
    if (field === 'password' || field === 'confirmPassword') {
      fieldErrors[field] = issue.message;
    }
  });

  return { errors: fieldErrors, isValid: false };
};

export const useConfirmResetPasswordForm = (initialToken: string) => {
  const [token] = useState(initialToken);
  const [formState, setFormState] = useState<ConfirmResetFormState>({
    data: { password: '', confirmPassword: '' },
    errors: {},
    isSubmitting: false,
    isValid: false,
  });

  const handleInputChange = useCallback((field: keyof ConfirmResetFormData, value: string) => {
    setFormState((prev) => {
      const newData: ConfirmResetFormData = { ...prev.data, [field]: value };
      const { errors, isValid } = validateForm(newData);
      return {
        ...prev,
        data: newData,
        errors,
        isValid,
      };
    });
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>): Promise<ApiSuccess<void> | null> => {
      if (e) {
        e.preventDefault();
      }

      if (formState.isSubmitting || !formState.isValid) {
        return null;
      }

      if (!token) {
        setFormState((prev) => ({
          ...prev,
          errors: { ...prev.errors, form: 'No valid reset token provided' },
        }));
        return null;
      }

      setFormState((prev) => ({
        ...prev,
        isSubmitting: true,
        errors: { ...prev.errors, form: undefined },
      }));

      try {
        const request: ConfirmResetPasswordRequest = {
          token,
          password: formState.data.password,
        };

        const result = await confirmResetPassword(request);
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
        return result;
      } catch (error) {
        setFormState((prev) => ({ ...prev, isSubmitting: false }));

        if (error instanceof ApiClientError) {
          let formError = error.message;
          const newErrors: ConfirmResetFormErrors = { ...formState.errors };

          if (error.code === 'INVALID_TOKEN') {
            formError = 'Invalid or expired reset link. Please request a new one.';
          } else if (error.code === 'VALIDATION_ERROR') {
            // Preserve field errors, don't set form error for validation
            if (error.details && error.details.password) {
              const passwordError = Array.isArray(error.details.password)
                ? error.details.password[0]
                : error.details.password;
              setFormState((prev) => ({
                ...prev,
                errors: {
                  ...prev.errors,
                  password: passwordError as string,
                },
              }));
            }
            return null;
          }

          setFormState((prev) => ({
            ...prev,
            errors: { ...prev.errors, form: formError },
          }));
        } else {
          setFormState((prev) => ({
            ...prev,
            errors: { ...prev.errors, form: 'An unexpected error occurred. Please try again.' },
          }));
        }

        return null;
      }
    },
    [formState.isValid, formState.isSubmitting, formState.data.password, token, formState.errors]
  );

  return {
    formState,
    handleInputChange,
    handleSubmit,
  };
};
