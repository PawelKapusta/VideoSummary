import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Youtube } from "lucide-react";
import ChannelRow from "./ChannelRow";
import type { SubscriptionWithChannel } from "@/types";

interface SubscriptionTableProps {
  channels: SubscriptionWithChannel[];
  onRemove: (id: string) => void;
}

export default function SubscriptionTable({ channels, onRemove }: SubscriptionTableProps) {
  return (
    <div
      data-testid="subscription-table"
      className="rounded-lg border border-slate-200 shadow-sm overflow-x-auto bg-white"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold text-slate-900 py-3">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                Channel Name
              </div>
            </TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-slate-900 py-3">Subscribed Date</TableHead>
            <TableHead className="text-right font-semibold text-slate-900 py-3 w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.length === 0 ? (
            <TableRow className="hover:bg-slate-50">
              <TableCell colSpan={3} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <div className="p-3 rounded-full bg-slate-100">
                    <Youtube className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">No channels subscribed yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Add your first YouTube channel to start receiving summaries
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            channels.map((channel) => (
              <ChannelRow key={channel.subscription_id} channel={channel} onRemove={onRemove} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
