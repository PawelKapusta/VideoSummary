import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Loader2, CheckCircle, Clock, AlertCircle, PlayCircle, Youtube } from "lucide-react";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
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

  // Date Range (optional)
  dateRangeLabel?: string;
  fromDate?: string;
  toDate?: string;
  onFromDateChange?: (date: string | undefined) => void;
  onToDateChange?: (date: string | undefined) => void;

  // Actions
  onClear: () => void;
  disabled?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = (props) => {
  const {
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
    dateRangeLabel,
    fromDate,
    toDate,
    onFromDateChange,
    onToDateChange,
    onClear,
    disabled,
  } = props;
  const [localSearch, setLocalSearch] = useState(searchQuery || "");

  // Sync local search with external search query changes
  useEffect(() => {
    setLocalSearch(searchQuery || "");
  }, [searchQuery]);

  // Debounce search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (searchQuery || "")) {
        onSearchChange(localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  return (
    <div data-testid="filter-bar" className="bg-card w-full px-6 pt-4 pb-3 rounded-lg border shadow-sm mb-4">
      {/* Search Section */}
      <div className="mb-6">
        <div className="w-full space-y-2">
          <label htmlFor="search-input" className="text-base font-medium text-muted-foreground cursor-default mb-2">
            Search by title or channel
          </label>
          <div className="relative group mt-2">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {disabled ? (
              <Loader2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground animate-spin z-10" />
            ) : (
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-600 group-hover:text-slate-700 transition-colors z-10" />
            )}
            <Input
              id="search-input"
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-11 h-11 bg-background/80 hover:bg-background border-slate-200 hover:border-slate-300 focus:border-slate-400 transition-all duration-300 relative z-10 rounded-lg text-base"
            />
          </div>
        </div>
      </div>

      {/* Filters Layout - All filters in one row, Clear button separate */}
      <div className="space-y-6 mb-6">
        {/* Filters Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_350px_1fr] gap-8">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-base font-medium text-muted-foreground cursor-default mb-2">{statusLabel}</label>
            <div className="mt-2">
              <Select value={statusValue} onValueChange={onStatusChange}>
              <SelectTrigger className="h-11 w-[250px] bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 hover:from-blue-100 hover:via-indigo-100 hover:to-cyan-100 border-blue-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] rounded-lg relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
                <div className="flex items-center relative z-10">
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-blue-200 rounded-lg shadow-lg p-1">
                {statusOptions.map((option) => {
                  const getStatusIcon = (value: string) => {
                    switch (value) {
                      case "all": return <CheckCircle className="h-4 w-4 text-gray-500" />;
                      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
                      case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-500" />;
                      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
                      case "failed": return <AlertCircle className="h-4 w-4 text-red-500" />;
                      case "with": return <CheckCircle className="h-4 w-4 text-green-500" />;
                      case "without": return <AlertCircle className="h-4 w-4 text-gray-500" />;
                      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
                    }
                  };

                  return (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={`focus:bg-blue-100 !focus:text-blue-900 hover:bg-blue-50 hover:text-blue-900 text-gray-900 dark:text-gray-100 rounded-md cursor-pointer px-3 py-2.5 mx-1 mb-1 transition-colors duration-200 ${statusValue === option.value ? '!bg-blue-100 !text-blue-900 font-semibold' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(option.value)}
                        <span className="text-sm">{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Channel Filter */}
          <div className="space-y-2">
            <label className="text-base font-medium text-muted-foreground cursor-default mb-2">{channelLabel}</label>
            <div className="mt-2">
              <Select value={channelValue} onValueChange={onChannelChange} disabled={channels.length === 0}>
              <SelectTrigger className="h-11 w-[350px] bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 hover:from-green-100 hover:via-emerald-100 hover:to-teal-100 border-green-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] rounded-lg relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
                <div className="flex items-center relative z-10">
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-green-200 rounded-lg shadow-lg p-1">
                <SelectItem
                  value="all"
                  className={`focus:bg-green-100 !focus:text-green-900 hover:bg-green-50 hover:text-green-900 text-gray-900 dark:text-gray-100 rounded-md cursor-pointer px-3 py-2.5 mx-1 mb-1 transition-colors duration-200 ${channelValue === "all" ? '!bg-green-100 !text-green-900 font-semibold' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Youtube className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">All {channelLabel}s</span>
                  </div>
                </SelectItem>
                {channels.map((channel) => (
                  <SelectItem
                    key={channel.id}
                    value={channel.id}
                    className={`focus:bg-green-100 !focus:text-green-900 hover:bg-green-50 hover:text-green-900 text-gray-900 dark:text-gray-100 rounded-md cursor-pointer px-3 py-2.5 mx-1 mb-1 transition-colors duration-200 ${channelValue === channel.id ? '!bg-green-100 !text-green-900 font-semibold' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Youtube className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{channel.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            {dateRangeLabel && onFromDateChange && onToDateChange && (
              <DateRangeFilter
                label={dateRangeLabel}
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={onFromDateChange}
                onToDateChange={onToDateChange}
                disabled={disabled}
              />
            )}
          </div>
        </div>

        {/* Clear Button Row - Right aligned */}
        <div className="flex justify-end">
          <div className="w-auto">
            <Button
              variant="outline"
              onClick={onClear}
              className="h-10 px-6 w-full bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-200 hover:border-red-300 text-red-700 hover:text-red-800 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 rounded-lg"
            >
              Clear all filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
