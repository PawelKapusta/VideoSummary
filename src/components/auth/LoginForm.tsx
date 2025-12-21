import { useState, type FormEvent } from 'react';
import type { LoginFormData, LoginFormErrors, AuthResponse, ApiError } from '@/types';
import { Button } from '@/components/ui/button';
import { EmailInput } from './EmailInput';
import { PasswordInput } from './PasswordInput';
import { FormErrorMessage } from './FormErrorMessage';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export interface LoginFormProps {
  onSuccess: (response: AuthResponse) => void;
  onError: (error: ApiError) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const validateField = (field: keyof LoginFormData): string | undefined => {
    const value = formData[field];
    if (field === 'email') {
      if (!value) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
    }
    if (field === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 8) {
        return 'Password must be at least 8 characters';
      }
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {
      email: validateField('email'),
      password: validateField('password'),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const updateField = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const handleFieldBlur = (field: keyof LoginFormData) => {
    const error = validateField(field);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = errors.email ? 'email' : 'password';
      document.getElementById(firstError)?.focus();
      return;
    }
    setIsSubmitting(true);
    setApiError(null);
    try {
      const { loginUser } = await import('@/lib/api');
      const response = await loginUser(formData);
      onSuccess(response);
    } catch (error) {
      const apiErr = error as ApiError;
      setApiError(apiErr);
      onError(apiErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormErrorMessage
        error={apiError}
        onDismiss={() => setApiError(null)}
      />

      <div className="space-y-4">
        <EmailInput
          value={formData.email}
          onChange={(value) => updateField('email', value)}
          onBlur={() => handleFieldBlur('email')}
          error={errors.email}
          disabled={isSubmitting}
        />

        <PasswordInput
          value={formData.password}
          onChange={(value) => updateField('password', value)}
          onBlur={() => handleFieldBlur('password')}
          error={errors.password}
          disabled={isSubmitting}
          showToggle={true}
        />
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/25 py-6 text-lg font-semibold rounded-xl transition-all duration-300"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </motion.div>
    </form>
  );
}

