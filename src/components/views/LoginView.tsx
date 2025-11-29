import { toast } from 'sonner';
import type { AuthResponse, ApiError } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { NavigationLinks } from '@/components/auth/NavigationLinks';
import { storeSession } from '@/lib/auth';

export default function LoginView() {
  const handleLoginSuccess = (response: AuthResponse) => {
    // Store session tokens
    storeSession(response.session);

    // Show success toast
    toast.success('Successfully signed in!', {
      description: 'Redirecting to dashboard...',
    });

    // Redirect to dashboard after short delay
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  };

  const handleLoginError = (error: ApiError) => {
    // Show error toast
    toast.error('Login failed', {
      description: error.error.message,
      duration: 5000,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sign in to YTInsights
          </CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm 
            onSuccess={handleLoginSuccess} 
            onError={handleLoginError} 
          />
        </CardContent>
        <CardFooter>
          <NavigationLinks />
        </CardFooter>
      </Card>
    </div>
  );
}

