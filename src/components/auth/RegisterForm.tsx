import { useState, useEffect, useRef, useMemo } from 'react';
import React from 'react';
import type { AuthResponse, ApiError } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { EmailInput } from './EmailInput';
import { PasswordInput } from './PasswordInput';
import { ConfirmPasswordInput } from './ConfirmPasswordInput';
import { FormErrorMessage } from './FormErrorMessage';
import { useRegisterForm } from '@/hooks/useRegisterForm';

interface RegisterFormProps {
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: ApiError) => void;
}

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const { 
    state: { data, errors, isSubmitting, isValid }, 
    handleInputChange, 
    handleBlur, 
    handleSubmit,
    hasSubmitted, // New from hook
    clearFormError, 
    rateLimitCooldown,
    isDisabled
  } = useRegisterForm({ onSuccess, onError });
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const focusedOnceRef = useRef(false); // Prevent multiple auto-focuses per submit

  // Refined focus effect: only after submit, once per cycle
  useEffect(() => {
    if (hasSubmitted && Object.values(errors).some(e => e) && !isSubmitting && !focusedOnceRef.current) {
      focusedOnceRef.current = true;
      const firstErrorInput = formRef.current?.querySelector('[aria-invalid="true"]') as HTMLInputElement;
      if (firstErrorInput) {
        firstErrorInput.focus();
        // Optional: Scroll into view for long forms
        firstErrorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [hasSubmitted, errors, isSubmitting]);

  // Reset focusedOnce on successful submit or clear
  useEffect(() => {
    if (isSubmitting) {
      focusedOnceRef.current = false; // Reset for next cycle
    }
  }, [isSubmitting]);

  const apiError = errors.form ? 
    ({ error: { code: 'FORM_ERROR' as const, message: errors.form, details: {} } } as ApiError) : 
    null;

  const computedIsValid = useMemo(() => 
    Object.values(errors).every(e => !e) && 
    data.email.trim() && 
    data.password.trim() && 
    data.confirmPassword.trim() && 
    data.confirmPassword === data.password, 
  [errors, data]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <form 
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }} 
      noValidate 
      className="space-y-4" 
      role="form" 
      aria-labelledby="register-title"
    >
      {/* Error container with live region */}
      {apiError && (
        <div ref={errorRef} role="alert" aria-live="polite" className="sr-only">Error occurred</div>
      )}
      <FormErrorMessage 
        error={apiError} 
        onDismiss={clearFormError} 
      />

      {/* Inputs already have aria-invalid and aria-describedby; ensure aria-required */}
      <EmailInput
        value={data.email}
        onChange={(value) => handleInputChange('email', value)}
        onBlur={() => handleBlur('email')}
        error={errors.email}
        disabled={isSubmitting}
        aria-required="true"
      />

      {/* Similar for others */}
      <PasswordInput
        value={data.password}
        onChange={(value) => handleInputChange('password', value)}
        onBlur={() => handleBlur('password')}
        error={errors.password}
        disabled={isSubmitting}
        showToggle={true}
        aria-required="true"
      />

      <ConfirmPasswordInput
        value={data.confirmPassword}
        onChange={(value) => handleInputChange('confirmPassword', value)}
        onBlur={() => handleBlur('confirmPassword')}
        error={errors.confirmPassword}
        passwordValue={data.password}
        disabled={isSubmitting}
        aria-required="true"
      />

      {/* Button */}
      <Button
        type="submit"
        variant="outline"
        className="w-full border-2 border-ring hover:border-primary focus-visible:border-primary"
        disabled={isDisabled}
        aria-describedby={apiError ? errorRef.current?.id : undefined}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Sign Up'
        )}
      </Button>
    </form>
  );
}
