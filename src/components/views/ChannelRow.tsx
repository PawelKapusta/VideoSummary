import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, MoreHorizontal, Youtube, ExternalLink } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SubscriptionWithChannel } from "@/types";
import { constructYouTubeChannelUrl } from "@/lib/youtube.utils";

interface ChannelRowProps {
  channel: SubscriptionWithChannel;
  onRemove: (id: string) => void;
}

export default function ChannelRow({ channel, onRemove }: ChannelRowProps) {
  const subscribedDate = new Date(channel.subscribed_at).toLocaleDateString();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const youtubeUrl = constructYouTubeChannelUrl(channel.channel.youtube_channel_id || channel.channel.name);

  const handleRemove = () => {
    if (
      confirm(
        `Are you sure you want to unsubscribe from ${channel.channel.name}? This will stop generating summaries for this channel.`
      )
    ) {
      onRemove(channel.subscription_id);
    }
  };

  const handleRemoveFromDialog = () => {
    setIsDetailsOpen(false);
    handleRemove();
  };

  return (
    <TableRow className="hover:bg-slate-50 transition-colors">
      <TableCell className="font-medium text-slate-900 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Youtube className="h-4 w-4 text-red-500" />
          </div>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-slate-900 hover:text-red-600 hover:underline flex items-center gap-1 transition-colors"
            title={`Visit ${channel.channel.name} on YouTube`}
          >
            {channel.channel.name}
            <ExternalLink className="h-3 w-3 opacity-50 flex-shrink-0" />
          </a>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell text-slate-600 py-3">{subscribedDate}</TableCell>
      <TableCell className="text-right py-3">
        <div className="hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove subscription for ${channel.channel.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="md:hidden">
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-sm"
                aria-label="Open channel options"
              >
                <MoreHorizontal className="h-4 w-4 text-slate-700" />
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
                <div className="grid grid-cols-3 gap-4 items-start">
                  <span className="font-medium text-sm">YouTube:</span>
                  <div className="col-span-2">
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 text-sm transition-colors"
                    >
                      Visit Channel
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                {channel.channel.youtube_channel_id && (
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <span className="font-medium text-sm">Channel ID:</span>
                    <span className="col-span-2 text-sm font-mono break-all">{channel.channel.youtube_channel_id}</span>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemoveFromDialog}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
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
