import { useState, type FormEvent } from 'react';
import type { LoginFormData, LoginFormErrors, AuthResponse, ApiError } from '@/types';
import { Button } from '@/components/ui/button';
import { EmailInput } from './EmailInput';
import { PasswordInput } from './PasswordInput';
import { FormErrorMessage } from './FormErrorMessage';
import { Loader2 } from 'lucide-react';

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

  // Validate individual field
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

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {
      email: validateField('email'),
      password: validateField('password'),
    };

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  // Update individual field
  const updateField = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    
    // Clear API error when user modifies form
    if (apiError) {
      setApiError(null);
    }
  };

  // Handle field blur for validation
  const handleFieldBlur = (field: keyof LoginFormData) => {
    const error = validateField(field);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      // Focus first invalid field
      const firstError = errors.email ? 'email' : 'password';
      document.getElementById(firstError)?.focus();
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Import loginUser dynamically to avoid issues
      const { loginUser } = await import('@/lib/api');
      const response = await loginUser(formData);

      // Call success callback
      onSuccess(response);
    } catch (error) {
      // Handle API errors
      const apiErr = error as ApiError;
      setApiError(apiErr);
      onError(apiErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* API Error Message */}
      <FormErrorMessage 
        error={apiError} 
        onDismiss={() => setApiError(null)} 
      />

      {/* Email Input */}
      <EmailInput
        value={formData.email}
        onChange={(value) => updateField('email', value)}
        onBlur={() => handleFieldBlur('email')}
        error={errors.email}
        disabled={isSubmitting}
      />

      {/* Password Input */}
      <PasswordInput
        value={formData.password}
        onChange={(value) => updateField('password', value)}
        onBlur={() => handleFieldBlur('password')}
        error={errors.password}
        disabled={isSubmitting}
        showToggle={true}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}

