import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddChannel } from "@/hooks/useAddChannel";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { X, Plus } from "lucide-react";

interface AddChannelFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const urlSchema = z
  .string()
  .url()
  .regex(
    /^https?:\/\/(www\.)?youtube\.com\/(channel\/|user\/|@|c\/)[^/?#]+$/,
    "Invalid YouTube channel URL. Use format: youtube.com/channel/UC... or youtube.com/@channelname"
  );

export default function AddChannelForm({ isOpen, onClose }: AddChannelFormProps) {
  const [channelUrl, setChannelUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate: addChannel, isPending } = useAddChannel();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationResult = urlSchema.safeParse(channelUrl);
    if (!validationResult.success) {
      setError(validationResult.error.errors[0].message);
      return;
    }

    addChannel(
      { channel_url: validationResult.data },
      {
        onSuccess: () => {
          setChannelUrl("");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog data-testid="add-channel-dialog" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] [&>button]:hover:bg-destructive/10 [&>button]:hover:text-destructive [&>button]:transition-all [&>button]:duration-200 [&>button]:rounded-md [&>button]:p-1">
        <DialogHeader>
          <DialogTitle>Add a new YouTube Channel</DialogTitle>
          <DialogDescription>
            Enter the URL of the YouTube channel you want to subscribe to. You can subscribe to a maximum of 10
            channels.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="channel-url" className="text-sm font-medium">
                Channel URL
              </Label>
              <Input
                id="channel-url"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className="w-full"
                placeholder="https://www.youtube.com/channel/..."
                disabled={isPending}
              />
            </div>
            {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
              className="w-full sm:w-auto hover:bg-secondary/80 shadow-sm hover:shadow-md transition-all duration-200 px-6 py-2 rounded-lg font-medium"
              size="lg"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full sm:w-auto transition-all duration-300 px-6 py-2 rounded-lg font-semibold shadow-sm border-2",
                isPending
                  ? "bg-muted text-muted-foreground shadow-none border-muted"
                  : "bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 shadow-lg hover:shadow-xl text-white border-red-300/50"
              )}
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isPending ? "Subscribing..." : "Subscribe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
