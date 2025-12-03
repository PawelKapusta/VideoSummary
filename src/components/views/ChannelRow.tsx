import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import type { SubscriptionWithChannel } from '@/types';

interface ChannelRowProps {
  channel: SubscriptionWithChannel;
  onRemove: (id: string) => void;
}

export default function ChannelRow({ channel, onRemove }: ChannelRowProps) {
  const subscribedDate = new Date(channel.subscribed_at).toLocaleDateString();

  const handleRemove = () => {
    if (confirm(`Are you sure you want to unsubscribe from ${channel.channel.name}? This will stop generating summaries for this channel.`)) {
      onRemove(channel.subscription_id);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{channel.channel.name}</TableCell>
      <TableCell>{subscribedDate}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          className="h-8 w-8"
          aria-label={`Remove subscription for ${channel.channel.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
