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
    <div data-testid="videos-filter-bar">
      <FilterBar
      searchQuery={activeFilters.searchQuery || ""}
      onSearchChange={(query) => onFiltersChange({ searchQuery: query })}
      statusValue={activeFilters.summaryStatus}
      onStatusChange={(status) => onFiltersChange({ summaryStatus: status as VideosFilterState["summaryStatus"] })}
      statusOptions={statusOptions}
      channelValue={activeFilters.channelId}
      onChannelChange={(channelId) => onFiltersChange({ channelId })}
      channels={channels}
      dateRangeLabel="Publication Date"
      fromDate={activeFilters.published_at_from}
      toDate={activeFilters.published_at_to}
      onFromDateChange={(date) => onFiltersChange({ published_at_from: date })}
      onToDateChange={(date) => onFiltersChange({ published_at_to: date })}
      onClear={() =>
        onFiltersChange({
          channelId: "all",
          summaryStatus: "all",
          searchQuery: "",
          published_at_from: undefined,
          published_at_to: undefined,
        })
      }
      disabled={disabled}
    />
    </div>
  );
};

export default VideosFilterBar;
