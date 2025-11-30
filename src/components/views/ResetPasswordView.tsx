import { useState } from 'react';
import ResetPasswordForm from '../auth/ResetPasswordForm';
import { NavigationLinks } from '../auth/NavigationLinks';
import { Toaster } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordView() {
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {showSuccess ? 'Password Reset Requested' : 'Reset Your Password'}
          </CardTitle>
          <CardDescription>
            {showSuccess ? 'Check your email for the reset link' : "Enter your email address and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>
        <CardContent className={showSuccess ? "flex flex-col items-center gap-4 p-6" : ""}>
          {showSuccess ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Reset Link Sent!</h3>
                <p className="text-sm text-muted-foreground">
                  Check your email for the password reset link. Click it to set your new password.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Dev note: The link will direct to /reset-password/confirm?token=...
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/reset-password/confirm?token=mock-dev-token'}
                className="w-full"
              >
                Test Confirm Page (Dev Only)
              </Button>
            </>
          ) : (
            <ResetPasswordForm onSuccess={() => setShowSuccess(true)} />
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!showSuccess ? (
            <a 
              href="/login" 
              className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm cursor-pointer"
            >
              Back to Login
            </a>
          ) : (
            <NavigationLinks />
          )}
        </CardFooter>
        <Toaster position="top-right" richColors />
      </Card>
    </div>
  );
}
