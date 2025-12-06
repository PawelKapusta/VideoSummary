import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, MoreHorizontal } from 'lucide-react';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { SubscriptionWithChannel } from '@/types';

interface ChannelRowProps {
  channel: SubscriptionWithChannel;
  onRemove: (id: string) => void;
}

export default function ChannelRow({ channel, onRemove }: ChannelRowProps) {
  const subscribedDate = new Date(channel.subscribed_at).toLocaleDateString();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleRemove = () => {
    if (confirm(`Are you sure you want to unsubscribe from ${channel.channel.name}? This will stop generating summaries for this channel.`)) {
      onRemove(channel.subscription_id);
    }
  };

  const handleRemoveFromDialog = () => {
    setIsDetailsOpen(false);
    handleRemove();
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{channel.channel.name}</TableCell>
      <TableCell className="hidden md:table-cell">{subscribedDate}</TableCell>
      <TableCell className="text-right">
        <div className="hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="h-8 w-8"
            aria-label={`Remove subscription for ${channel.channel.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="md:hidden">
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open details</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{channel.channel.name}</DialogTitle>
                <DialogDescription>Subscription Details</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <span className="font-medium text-sm">Subscribed:</span>
                  <span className="col-span-2 text-sm">{subscribedDate}</span>
                </div>
                {channel.channel.youtube_channel_id && (
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <span className="font-medium text-sm">Channel ID:</span>
                    <span className="col-span-2 text-sm font-mono break-all">{channel.channel.youtube_channel_id}</span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveFromDialog}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Unsubscribe
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
