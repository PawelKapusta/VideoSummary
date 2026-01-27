import React from "react";
import type { FilterOptions, Channel, SummaryStatus } from "../../types";
import FilterBar from "../shared/FilterBar";

interface Props {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  channels: Channel[];
  disabled?: boolean;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const FilterPanel: React.FC<Props> = ({ filters, onFiltersChange, channels, disabled }) => {
  return (
    <div data-testid="filter-panel">
      <FilterBar
        searchQuery={filters.search || ""}
        onSearchChange={(query) => {
          const newFilters = { ...filters, search: query || undefined };
          // Clean undefined params
          const cleaned = Object.fromEntries(Object.entries(newFilters).filter(([, v]) => v !== undefined && v !== ""));
          onFiltersChange(cleaned);
        }}
        statusValue={filters.status || "all"}
        onStatusChange={(status) => {
          const newStatus = status === "all" ? undefined : (status as SummaryStatus);
          onFiltersChange({ ...filters, status: newStatus });
        }}
        statusOptions={statusOptions}
        channelValue={filters.channel_id || "all"}
        onChannelChange={(channelId) => {
          const newChannelId = channelId === "all" ? undefined : channelId;
          onFiltersChange({ ...filters, channel_id: newChannelId });
        }}
        channels={channels}
        dateRangeLabel="Generation Date"
        fromDate={filters.generated_at_from}
        toDate={filters.generated_at_to}
        onFromDateChange={(date) => onFiltersChange({ ...filters, generated_at_from: date })}
        onToDateChange={(date) => onFiltersChange({ ...filters, generated_at_to: date })}
        onClear={() => onFiltersChange({})}
        disabled={disabled}
      />
    </div>
  );
};

export default FilterPanel;
