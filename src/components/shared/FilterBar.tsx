import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import type { Channel } from "@/types";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;

  // Status
  statusValue: string;
  onStatusChange: (status: string) => void;
  statusOptions: FilterOption[];
  statusLabel?: string;

  // Channel
  channelValue: string;
  onChannelChange: (channelId: string) => void;
  channels: Channel[];
  channelLabel?: string;

  // Actions
  onClear: () => void;
  disabled?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Enter keywords...",
  statusValue,
  onStatusChange,
  statusOptions,
  statusLabel = "Status",
  channelValue,
  onChannelChange,
  channels,
  channelLabel = "Channel",
  onClear,
  disabled,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery || "");

  // Debounce search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (searchQuery || "")) {
        onSearchChange(localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  // Sync local state when external searchQuery changes (e.g. clear filters)
  useEffect(() => {
    setLocalSearch(searchQuery || "");
  }, [searchQuery]);

  return (
    <div className="bg-card w-full p-4 rounded-lg border shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Search Input */}
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">Search by title or channel</label>
          <div className="relative">
            {disabled ? (
              <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 w-full bg-background"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">{statusLabel}</label>
          <Select
            value={statusValue}
            // If value is missing or invalid for some reason, Radix select might warn, but we control it.
            onValueChange={onStatusChange}
          >
            <SelectTrigger className="w-full bg-background cursor-pointer">
              <SelectValue placeholder={`All ${statusLabel}`} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50">
              {statusOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-950 dark:focus:text-zinc-50"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Channel Filter */}
        <div className="w-full md:w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">{channelLabel}</label>
          <Select value={channelValue} onValueChange={onChannelChange} disabled={channels.length === 0}>
            <SelectTrigger className="w-full bg-background cursor-pointer">
              <SelectValue placeholder={`All ${channelLabel}s`} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50">
              <SelectItem
                value="all"
                className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-950 dark:focus:text-zinc-50"
              >
                All {channelLabel}s
              </SelectItem>
              {channels.map((channel) => (
                <SelectItem
                  key={channel.id}
                  value={channel.id}
                  className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-950 dark:focus:text-zinc-50"
                >
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        <Button variant="outline" onClick={onClear} className="whitespace-nowrap">
          Show All
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
