import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ChannelRow from './ChannelRow';
import type { SubscriptionWithChannel } from '@/types';

interface SubscriptionTableProps {
  channels: SubscriptionWithChannel[];
  onRemove: (id: string) => void;
}

export default function SubscriptionTable({ channels, onRemove }: SubscriptionTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Channel Name</TableHead>
            <TableHead>Subscribed Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                No channels subscribed yet.
              </TableCell>
            </TableRow>
          ) : (
            channels.map((channel) => (
              <ChannelRow
                key={channel.subscription_id}
                channel={channel}
                onRemove={onRemove}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
