import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddChannel } from '@/hooks/useAddChannel';
import { z } from 'zod';

interface AddChannelFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const urlSchema = z.string().url().regex(
  /^https:\/\/(www\.)?youtube\.com\/(channel\/|@)[\w-]+$/,
  "Please enter a valid YouTube channel URL (e.g., .../channel/UC... or .../@channelname)"
);

export default function AddChannelForm({ isOpen, onClose }: AddChannelFormProps) {
  const [channelUrl, setChannelUrl] = useState('');
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

    addChannel({ channel_url: validationResult.data }, {
      onSuccess: () => {
        setChannelUrl('');
        onClose();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a new YouTube Channel</DialogTitle>
          <DialogDescription>
            Enter the URL of the YouTube channel you want to subscribe to. You can subscribe to a maximum of 10 channels.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel-url" className="text-right">
                Channel URL
              </Label>
              <Input
                id="channel-url"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://www.youtube.com/channel/..."
                disabled={isPending}
              />
            </div>
            {error && <p className="col-span-4 text-sm text-destructive text-center">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
