import { useState, useCallback } from 'react';
import { z } from 'zod';
import type { RegisterFormData, RegisterFormErrors, RegisterFormState, AuthResponse, ApiError } from '@/types';
import { RegisterRequestSchema, PasswordSchema } from '@/lib/validation/schemas';
import { toast } from 'sonner';

const RegisterFormSchema = RegisterRequestSchema.extend({
  confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
});

export function useRegisterForm({
  onSuccess,
  onError,
}: {
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: ApiError) => void;
} = {}) {
  const [state, setState] = useState<RegisterFormState>({
    data: { email: '', password: '', confirmPassword: '' },
    errors: {},
    isSubmitting: false,
    isValid: false,
  });

  const updateData = useCallback((updates: Partial<RegisterFormData>) => {
    setState(prev => ({ 
      ...prev, 
      data: { ...prev.data, ...updates }
    }));
  }, []);

  const setFieldError = useCallback((field: keyof RegisterFormErrors, error?: string) => {
    setState(prev => ({ 
      ...prev, 
      errors: { 
        ...prev.errors, 
        [field]: error 
      }
    }));
  }, []);

  const clearFormError = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      errors: { ...prev.errors, form: undefined }
    }));
  }, []);

  const validateField = useCallback((field: keyof RegisterFormData, value: string): string | undefined => {
    try {
      if (field === 'email') {
        RegisterFormSchema.pick({ email: true }).parse({ email: value });
      } else if (field === 'password') {
        RegisterFormSchema.pick({ password: true }).parse({ password: value });
      } else if (field === 'confirmPassword') {
        RegisterFormSchema.pick({ confirmPassword: true }).parse({ confirmPassword: value });
        if (value !== state.data.password) {
          return 'Passwords do not match';
        }
      }
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0].message;
      }
      return 'Invalid input';
    }
  }, [state.data.password]);

  const validateForm = useCallback((): boolean => {
    const newErrors: RegisterFormErrors = {};
    let hasError = false;

    const emailError = validateField('email', state.data.email);
    if (emailError) {
      newErrors.email = emailError;
      hasError = true;
    }

    const passwordError = validateField('password', state.data.password);
    if (passwordError) {
      newErrors.password = passwordError;
      hasError = true;
    }

    const confirmError = validateField('confirmPassword', state.data.confirmPassword);
    if (confirmError) {
      newErrors.confirmPassword = confirmError;
      hasError = true;
    }

    setState(prev => ({ 
      ...prev, 
      errors: { ...prev.errors, ...newErrors },
      isValid: !hasError
    }));

    return !hasError;
  }, [validateField, state.data]);

  const handleInputChange = useCallback((field: keyof RegisterFormData, value: string) => {
    updateData({ [field]: value });

    // Clear field error on change
    if (state.errors[field as keyof RegisterFormErrors]) {
      setFieldError(field as keyof RegisterFormErrors, undefined);
    }

    // Clear form error on change
    if (state.errors.form) {
      clearFormError();
    }

    // Update isValid if previously invalid
    if (!state.isValid) {
      // Revalidate to update isValid
      validateForm();
    }
  }, [updateData, state.errors, setFieldError, clearFormError, validateForm, state.isValid]);

  const handleBlur = useCallback((field: keyof RegisterFormData) => {
    const error = validateField(field, state.data[field]);
    if (error) {
      setFieldError(field as keyof RegisterFormErrors, error);
    } else {
      setFieldError(field as keyof RegisterFormErrors, undefined);
    }
  }, [validateField, state.data, setFieldError]);

  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = useCallback(async () => {
    setHasSubmitted(true); // Mark as submitted
    if (!validateForm()) {
      return;
    }

    if (rateLimitCooldown > 0) {
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const { registerUser } = await import('@/lib/api');
      const response = await registerUser({ 
        email: state.data.email, 
        password: state.data.password 
      });

      toast.success('Account created successfully!', {
        description: 'Redirecting to dashboard...',
        duration: 2000,
      });
      onSuccess?.(response);
    } catch (error) {
      const apiErr = error as ApiError;
      const code = apiErr.error.code;

      if (code === 'EMAIL_ALREADY_EXISTS') {
        setFieldError('form' as any, 'An account with this email already exists. Please login.');
      } else if (code === 'INVALID_INPUT' || code === 'VALIDATION_ERROR') {
        // Map to field errors if details available
        if (apiErr.error.details) {
          const details = apiErr.error.details;
          if (details.email) {
            setFieldError('email', details.email as string);
          }
          if (details.password) {
            setFieldError('password', details.password as string);
          }
        } else {
          setFieldError('form' as any, apiErr.error.message);
        }
      } else if (code === 'RATE_LIMIT_EXCEEDED') {
        toast.error('Too many attempts. Please wait before trying again.', {
          duration: 5000,
        });
        setRateLimitCooldown(60); // 60 seconds cooldown
        const timer = setInterval(() => {
          setRateLimitCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (code === 'INTERNAL_ERROR') {
        setFieldError('form' as any, 'Registration failed. Please try again later.');
      } else {
        toast.error('Registration error', {
          description: apiErr.error.message,
          duration: 5000,
        });
      }

      onError?.(apiErr);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [validateForm, state.data, onSuccess, onError, setFieldError, rateLimitCooldown]);

  const calculateIsValid = useCallback((errors: RegisterFormErrors, data: RegisterFormData) => {
    return Object.values(errors).every(e => !e) && 
           data.email.trim() !== '' && 
           data.password.trim() !== '' && 
           data.confirmPassword.trim() !== '';
  }, []);

  // Update isValid when data or errors change
  // But since setState, it's sync, but for now, call in places

  return {
    state,
    handleInputChange,
    handleBlur,
    handleSubmit,
    clearFormError,
    validateForm,
    rateLimitCooldown,
    isDisabled: state.isSubmitting || rateLimitCooldown > 0 || !state.isValid,
    hasSubmitted,
  };
}
