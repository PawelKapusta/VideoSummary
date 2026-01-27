import React, { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw, FileText, Youtube, TrendingUp } from "lucide-react";
import type { UserProfile, SummaryWithVideo } from "@/types";
import SubscriptionSection from "./SubscriptionSection";
import QueryProvider from "../providers/QueryProvider";
import { useProfile } from "@/hooks/useProfile";
import { useUserChannels } from "@/hooks/useUserChannels";
import { useSummaries } from "@/hooks/useSummaries";
import { ApiClientError } from "@/lib/api";
import { useRemoveChannel } from "@/hooks/useRemoveChannel";
import AddChannelForm from "./AddChannelForm";
import AppLoader from "@/components/ui/AppLoader";

interface UserHeaderProps {
  profile: Partial<UserProfile>;
}

function UserHeader({ profile }: UserHeaderProps) {
  const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A";
  const displayName = profile.username || profile.email || "Loading...";
  const subtitle = profile.username ? profile.email : null;

  return (
    <Card data-testid="user-header" className="mb-6 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-100 dark:to-gray-100 border-slate-200 dark:border-slate-300 shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 ring-4 ring-slate-300 dark:ring-slate-400 shadow-xl">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`} />
            <AvatarFallback className="text-xl bg-slate-200 dark:bg-slate-300 text-slate-800 dark:text-slate-900 font-bold">
              {displayName.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-900">Your Insights</CardTitle>
            <CardDescription className="text-lg font-semibold text-slate-700 dark:text-slate-800">
              {displayName}
            </CardDescription>
            {subtitle && (
              <p className="text-sm text-slate-600 dark:text-slate-700 mt-1">
                {subtitle}
              </p>
            )}
            <p className="text-base font-medium text-slate-600 dark:text-slate-700 mt-1">Member since {joinDate}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function StatsSection({
  totalSummaries,
  totalChannels,
  thisMonthSummaries,
}: {
  totalSummaries: number;
  totalChannels: number;
  thisMonthSummaries: number;
}) {
  return (
    <div data-testid="stats-section" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center mb-2">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalSummaries}</div>
          <p className="text-sm text-muted-foreground">Summaries Generated</p>
        </CardContent>
      </Card>

      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center mb-2">
            <Youtube className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{totalChannels}</div>
          <p className="text-sm text-muted-foreground">Channels Subscribed</p>
        </CardContent>
      </Card>

      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">{thisMonthSummaries}</div>
          <p className="text-sm text-muted-foreground">This Month</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileContent() {
  const { profile, isLoading, error, refetch } = useProfile();
  const { data: channels } = useUserChannels();
  const { data: summariesData } = useSummaries({ include_hidden: true, limit: 100 });
  const { mutate: removeChannel } = useRemoveChannel();
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  const totalSummaries = summariesData?.pages?.[0]?.pagination?.total || 0;
  const totalChannels = channels?.length || 0;

  // Calculate summaries from this month
  const thisMonthSummaries =
    summariesData?.pages?.reduce((acc, page) => {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      return (
        acc +
        page.data.filter((summary: SummaryWithVideo) => {
          if (!summary.generated_at) return false;
          const summaryDate = new Date(summary.generated_at);
          return summaryDate.getMonth() === thisMonth && summaryDate.getFullYear() === thisYear;
        }).length
      );
    }, 0) || 0;

  const handleRemoveChannel = (subscriptionId: string) => {
    removeChannel(subscriptionId);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <AppLoader loadingText="Loading profile..." />
      </div>
    );
  }

  if (error) {
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof ApiClientError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 text-center">
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
      <div className="container max-w-4xl mx-auto p-4 md:p-6 text-center">
        <p>No profile data found.</p>
      </div>
    );
  }

  return (
    <div data-testid="profile-view" className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <UserHeader profile={profile} />

      <StatsSection
        totalSummaries={totalSummaries}
        totalChannels={totalChannels}
        thisMonthSummaries={thisMonthSummaries}
      />

      <SubscriptionSection
        profile={profile}
        onRemoveChannel={handleRemoveChannel}
        onAddClick={() => setAddModalOpen(true)}
      />

      <AddChannelForm isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
}

export function ProfileView() {
  return (
    <QueryProvider>
      <ProfileContent />
    </QueryProvider>
  );
}

export default ProfileView;
