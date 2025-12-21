import { useState, useCallback } from 'react';
import { z } from 'zod';
import type { RegisterFormData, RegisterFormErrors, RegisterFormState, AuthResponse, ApiError } from '@/types';
import { RegisterRequestSchema } from '@/lib/validation/schemas';
import { toast } from 'sonner';

const SignupFormSchema = RegisterRequestSchema.extend({
  confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
});

export function useSignupForm({
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

  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

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
        SignupFormSchema.pick({ email: true }).parse({ email: value });
      } else if (field === 'password') {
        SignupFormSchema.pick({ password: true }).parse({ password: value });
      } else if (field === 'confirmPassword') {
        SignupFormSchema.pick({ confirmPassword: true }).parse({ confirmPassword: value });
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
    setState(prev => {
      const newData = { ...prev.data, [field]: value };
      const newErrors = { ...prev.errors };
      
      if (newErrors[field as keyof RegisterFormErrors]) {
        delete newErrors[field as keyof RegisterFormErrors];
      }
      
      if (newErrors.form) {
        delete newErrors.form;
      }
      
      const isValid = Object.values(newErrors).every(e => !e) && 
                     newData.email.trim() !== '' && 
                     newData.password.trim() !== '' && 
                     newData.confirmPassword.trim() !== '' &&
                     newData.confirmPassword === newData.password;
      
      return {
        ...prev,
        data: newData,
        errors: newErrors,
        isValid,
      };
    });
  }, []);

  const handleBlur = useCallback((field: keyof RegisterFormData) => {
    const error = validateField(field, state.data[field]);
    if (error) {
      setFieldError(field as keyof RegisterFormErrors, error);
    } else {
      setFieldError(field as keyof RegisterFormErrors, undefined);
    }
  }, [validateField, state.data, setFieldError]);

  const handleSubmit = useCallback(async () => {
    setHasSubmitted(true);
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

      if (!response.session) {
        toast.info('Verification Required', {
          description: 'Please check your email to confirm your account before logging in.',
          duration: 10000,
        });
      } else {
        toast.success('Account created successfully!', {
          description: 'Redirecting to dashboard...',
          duration: 2000,
        });
      }
      
      onSuccess?.(response);
    } catch (error) {
      const apiErr = error as ApiError;
      const code = apiErr.error.code;

      if (code === 'EMAIL_ALREADY_EXISTS') {
        setFieldError('form' as any, 'An account with this email already exists. Please login.');
      } else if (code === 'INVALID_INPUT' || code === 'VALIDATION_ERROR') {
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
        setRateLimitCooldown(60);
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
