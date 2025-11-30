import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmResetPasswordForm } from '@/hooks/useConfirmResetPasswordForm';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { ConfirmPasswordInput } from '@/components/auth/ConfirmPasswordInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { ConfirmResetFormState } from '@/types';
import type { ApiSuccess } from '@/types';

const ResetPasswordForm: React.FC<{
  formState: ConfirmResetFormState;
  handleInputChange: (field: keyof ConfirmResetFormState['data'], value: string) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => Promise<ApiSuccess<void> | null>;
  isSubmitting: boolean;
}> = ({ formState, handleInputChange, handleSubmit, isSubmitting }) => (
  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
    <PasswordInput
      value={formState.data.password}
      onChange={(value) => handleInputChange('password', value)}
      error={formState.errors.password}
      disabled={isSubmitting}
      showStrength={true}
      showToggle={true}
      label="New Password"
    />
    <ConfirmPasswordInput
      value={formState.data.confirmPassword}
      onChange={(value) => handleInputChange('confirmPassword', value)}
      password={formState.data.password}
      error={formState.errors.confirmPassword}
      disabled={isSubmitting}
      showToggle={true}
    />
    <Button 
      type="submit" 
      variant="outline"
      className="w-full border-2 border-ring hover:border-primary focus-visible:border-primary" 
      disabled={!formState.isValid || isSubmitting}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Resetting Password...
        </>
      ) : (
        'Reset Password'
      )}
    </Button>
  </form>
);

export const ResetPasswordConfirmView: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { formState, handleInputChange, handleSubmit: hookHandleSubmit } = useConfirmResetPasswordForm(token);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (!tokenParam) {
      toast.error('No reset link provided. Please check your email or request a new one.');
      window.location.href = '/reset-password';
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
      // Success
      toast.success('Password reset successfully! Redirecting to login...');
      setShowSuccess(true);
    } else if (formState.errors.form) {
      // Error already set in hook, add toast if specific
      if (formState.errors.form.includes('INVALID_TOKEN')) {
        toast.error('Invalid or expired reset link. Please request a new one.');
        window.location.href = '/reset-password';
      } else {
        toast.error(formState.errors.form);
      }
    }

    return result;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Reset Your Password</CardTitle>
          <CardDescription>
            {showSuccess ? 'Your password has been reset successfully.' : 'Enter your new password below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showSuccess ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Password Reset Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated. Redirecting to login...
                </p>
              </div>
            </div>
          ) : token ? (
            <ResetPasswordForm
              formState={formState}
              handleInputChange={handleInputChange}
              handleSubmit={handleFormSubmit}
              isSubmitting={formState.isSubmitting}
            />
          ) : (
            <div className="text-center text-muted-foreground">Loading...</div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm">
          {!showSuccess && (
            <a 
              href="/login" 
              className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm cursor-pointer"
            >
              Back to Login
            </a>
          )}
        </CardFooter>
      </Card>
      <Toaster position="top-right" richColors />
    </div>
  );
};
