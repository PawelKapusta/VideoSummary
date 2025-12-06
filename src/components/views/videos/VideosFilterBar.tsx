import React from 'react';
import type { Channel, VideosFilterState } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface VideosFilterBarProps {
  channels: Channel[];
  activeFilters: VideosFilterState;
  onFiltersChange: (filters: Partial<VideosFilterState>) => void;
  disabled: boolean;
}

const VideosFilterBar: React.FC<VideosFilterBarProps> = ({
  channels,
  activeFilters,
  onFiltersChange,
  disabled,
}) => {
  const handleChannelChange = (channelId: string) => {
    onFiltersChange({ channelId });
  };

  const handleSummaryStatusChange = (status: 'all' | 'with' | 'without' | '') => {
    if (status) {
      onFiltersChange({ summaryStatus: status });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8 mt-2">
      <div className="flex-1">
        <Select
          value={activeFilters.channelId}
          onValueChange={handleChannelChange}
          disabled={disabled || channels.length === 0}
        >
          <SelectTrigger className="w-full sm:w-[280px] cursor-pointer">
            <SelectValue placeholder="Filter by channel..." />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] z-[100] bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <SelectItem value="all" className="cursor-pointer focus:bg-zinc-200 dark:focus:bg-zinc-800">All Channels</SelectItem>
            {channels.map(channel => (
              <SelectItem key={channel.id} value={channel.id} className="cursor-pointer focus:bg-zinc-200 dark:focus:bg-zinc-800">
                {channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <ToggleGroup
          type="single"
          value={activeFilters.summaryStatus}
          onValueChange={handleSummaryStatusChange}
          disabled={disabled}
          defaultValue="all"
          className="bg-background border rounded-md overflow-hidden"
        >
          <ToggleGroupItem value="all" className="cursor-pointer rounded-none border-r last:border-r-0 data-[state=on]:bg-muted">All</ToggleGroupItem>
          <ToggleGroupItem value="with" className="cursor-pointer rounded-none border-r last:border-r-0 data-[state=on]:bg-muted">With Summary</ToggleGroupItem>
          <ToggleGroupItem value="without" className="cursor-pointer rounded-none border-r last:border-r-0 data-[state=on]:bg-muted">Without Summary</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

export default VideosFilterBar;
