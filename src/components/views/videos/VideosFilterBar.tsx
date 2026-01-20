import React from "react";
import type { Channel, VideosFilterState } from "@/types";
import FilterBar from "@/components/shared/FilterBar";

interface VideosFilterBarProps {
  channels: Channel[];
  activeFilters: VideosFilterState;
  onFiltersChange: (filters: Partial<VideosFilterState>) => void;
  disabled: boolean;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "with", label: "Summary Available" },
  { value: "without", label: "No Summary" },
];

const VideosFilterBar: React.FC<VideosFilterBarProps> = ({ channels, activeFilters, onFiltersChange, disabled }) => {
  return (
    <FilterBar
      searchQuery={activeFilters.searchQuery || ""}
      onSearchChange={(query) => onFiltersChange({ searchQuery: query })}
      statusValue={activeFilters.summaryStatus}
      onStatusChange={(status) => onFiltersChange({ summaryStatus: status as VideosFilterState["summaryStatus"] })}
      statusOptions={statusOptions}
      channelValue={activeFilters.channelId}
      onChannelChange={(channelId) => onFiltersChange({ channelId })}
      channels={channels}
      onClear={() =>
        onFiltersChange({
          channelId: "all",
          summaryStatus: "all",
          searchQuery: "",
        })
      }
      disabled={disabled}
    />
  );
};

export default VideosFilterBar;
