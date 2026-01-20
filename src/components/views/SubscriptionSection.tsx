import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SubscriptionTable from "./SubscriptionTable";
import type { UserProfile } from "@/types";

interface SubscriptionSectionProps {
  profile: UserProfile;
  onRemoveChannel: (id: string) => void;
  onAddClick: () => void;
}

export default function SubscriptionSection({ profile, onRemoveChannel, onAddClick }: SubscriptionSectionProps) {
  const canAdd = profile.subscription_count < 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <span>Subscribed Channels ({profile.subscription_count}/10)</span>
          {canAdd ? (
            <Button onClick={onAddClick} variant="outline" className="w-full sm:w-auto">
              Add Channel
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Maximum 10 channels reached</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SubscriptionTable channels={profile.subscribed_channels} onRemove={onRemoveChannel} />
      </CardContent>
    </Card>
  );
}
