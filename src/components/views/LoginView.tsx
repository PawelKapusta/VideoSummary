import { toast } from 'sonner';
import type { AuthResponse, ApiError } from '@/types';
import { LoginForm } from '@/components/auth/LoginForm';
import { NavigationLinks } from '@/components/auth/NavigationLinks';
import { storeSession } from '@/lib/auth';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function LoginView() {
  const handleLoginSuccess = (response: AuthResponse) => {
    storeSession(response.session);

    toast.success('Successfully signed in!', {
      description: 'Redirecting to dashboard...',
    });

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  };

  const handleLoginError = (error: ApiError) => {
    toast.error('Login failed', {
      description: error.error.message,
      duration: 5000,
    });
  };

  return (
    <AuthLayout
      title="Welcome Back"
      description="Enter your credentials to access your summaries"
      footer={<NavigationLinks />}
    >
      <LoginForm
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
      />
    </AuthLayout>
  );
}

