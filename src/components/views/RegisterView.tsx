import { toast } from 'sonner';
import type { AuthResponse, ApiError } from '@/types';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { storeSession } from '@/lib/auth';
import { RegisterNavigationLinks } from '@/components/auth/RegisterNavigationLinks';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function RegisterView() {
  const handleRegisterSuccess = (response: AuthResponse) => {
    storeSession(response.session);

    toast.success('Successfully registered!', {
      description: 'Redirecting to dashboard...',
    });

    try {
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
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
    toast.error('Registration failed', {
      description: error.error.message,
      duration: 5000,
    });
  };

  return (
    <AuthLayout
      title="Create Account"
      description="Start generating insights from your favorite videos"
      footer={<RegisterNavigationLinks />}
    >
      <RegisterForm
        onSuccess={handleRegisterSuccess}
        onError={handleRegisterError}
      />
    </AuthLayout>
  );
}
