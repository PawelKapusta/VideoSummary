import React, { useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, RefreshCw } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';
import type { UserProfile } from '@/types';
import SubscriptionSection from './SubscriptionSection';
import QueryProvider from '../providers/QueryProvider';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiClientError } from '@/lib/api';
import { useRemoveChannel } from '@/hooks/useRemoveChannel';
import AddChannelForm from './AddChannelForm';

interface UserHeaderProps {
  profile: Partial<UserProfile>;
}

function UserHeader({ profile }: UserHeaderProps) {
  const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A';

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center space-x-4">
        <Avatar>
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`} />
          <AvatarFallback>{profile.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{profile.email || 'Loading...'}</CardTitle>
          <CardDescription>Joined on {joinDate}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function LogoutButton() {
  const { logout, isLoading } = useLogout();

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full md:w-auto"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}

function ProfileContent() {
  const { profile, isLoading, error, refetch } = useProfile();
  const { mutate: removeChannel } = useRemoveChannel();
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  const handleRemoveChannel = (subscriptionId: string) => {
    removeChannel(subscriptionId);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </CardHeader>
        </Card>
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof ApiClientError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return (
      <div className="container max-w-4xl mx-auto p-6 text-center">
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
          <p className="font-semibold mb-2">Could not load your profile.</p>
          <p className="text-sm mb-4">{errorMessage}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
        <div className="container max-w-4xl mx-auto p-6 text-center">
            <p>No profile data found.</p>
        </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <UserHeader 
        profile={profile} 
      />
      
      <SubscriptionSection
        profile={profile}
        onRemoveChannel={handleRemoveChannel}
        onAddClick={() => setAddModalOpen(true)}
      />
      
      <div className="flex justify-end">
        <LogoutButton />
      </div>

      <AddChannelForm 
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}

export function ProfileView() {
  return (
    <QueryProvider>
      <ProfileContent />
    </QueryProvider>
  )
}

export default ProfileView;
