import { toast } from 'sonner';
import type { AuthResponse, ApiError } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { storeSession } from '@/lib/auth';
import { RegisterNavigationLinks } from '@/components/auth/RegisterNavigationLinks';

export default function RegisterView() {
  const handleRegisterSuccess = (response: AuthResponse) => {
    // Store session tokens
    storeSession(response.session);

    // Show success toast
    toast.success('Successfully registered!', {
      description: 'Redirecting to dashboard...',
    });

    // Enhanced redirect with fallback
    try {
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500); // Slightly longer delay for better UX
    } catch (error) {
      console.error('Redirect failed:', error);
      toast.error('Registration successful! Please click here to continue.', {
        action: {
          label: 'Go to Dashboard',
          onClick: () => window.location.href = '/dashboard',
        },
      });
    }
  };

  const handleRegisterError = (error: ApiError) => {
    // Error toast handled in form, but additional if needed
    toast.error('Registration failed', {
      description: error.error.message,
      duration: 5000,
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md shadow-lg dark:shadow-lg/50 border-border/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sign up for YTInsights
          </CardTitle>
          <CardDescription>
            Enter your email and password to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6 sm:p-8">
          <RegisterForm 
            onSuccess={handleRegisterSuccess} 
            onError={handleRegisterError} 
          />
        </CardContent>
        <CardFooter className="p-6 sm:p-8">
          <RegisterNavigationLinks />
        </CardFooter>
      </Card>
    </div>
  );
}
