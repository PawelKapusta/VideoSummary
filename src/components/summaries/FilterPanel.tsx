import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Filter, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import type { FilterOptions, SummaryStatus, Channel } from '../../types';

interface Props {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  channels: Channel[];
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
] as const;

const FilterPanel: React.FC<Props> = ({ filters, onFiltersChange, channels }) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [localStatus, setLocalStatus] = useState(filters.status || '');
  const [localChannelId, setLocalChannelId] = useState(filters.channel_id || '');
  const [isOpen, setIsOpen] = useState(false);

  const debouncedSearch = useDebounce(localSearch, 300);
  const debouncedStatus = useDebounce(localStatus, 300);
  const debouncedChannelId = useDebounce(localChannelId, 300);

  useEffect(() => {
    const newFilters: FilterOptions = {
      search: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
      status: debouncedStatus ? (debouncedStatus as SummaryStatus) : undefined,
      channel_id: debouncedChannelId || undefined,
    };

    // Clean object by removing undefined/null keys
    const cleanedFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key as keyof FilterOptions] = value as any;
      }
      return acc;
    }, {} as FilterOptions);

    onFiltersChange(cleanedFilters);
  }, [debouncedSearch, debouncedStatus, debouncedChannelId, onFiltersChange]);

  useEffect(() => {
    // Sync local state if filters prop changes from parent (e.g., clear)
    if (!filters.search) setLocalSearch('');
    if (!filters.status) setLocalStatus('');
    if (!filters.channel_id) setLocalChannelId('');
  }, [filters]);

  const handleClear = () => {
    setLocalSearch('');
    setLocalStatus('');
    setLocalChannelId('');
    const newFilters: FilterOptions = {};
    onFiltersChange(newFilters);
    setIsOpen(false);
  };

  const channelOptions = [
    { value: 'all', label: 'All Channels' },
    ...channels.map((channel) => ({ value: channel.id, label: channel.name })),
  ];

  return (
    <>
      <div className="hidden md:flex flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {/* Desktop layout */}
        <div className="flex-1 min-w-0">
          <Label htmlFor="search" className="block text-sm font-medium mb-1">
            Search by title or channel
          </Label>
          <Input
            id="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Enter keywords..."
            className="w-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </Label>
          <Select
            value={localStatus || ''}
            onValueChange={(value) => setLocalStatus(value === 'all' ? '' : value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-0">
          <Label htmlFor="channel" className="block text-sm font-medium mb-1">
            Channel
          </Label>
          <Select
            value={localChannelId || ''}
            onValueChange={(value) => setLocalChannelId(value === 'all' ? '' : value)}
          >
            <SelectTrigger id="channel">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              {channelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={handleClear} variant="outline" className="w-full md:w-auto">
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="md:hidden mb-6">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="top" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Adjust your filters to find specific summaries.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="search-mobile" className="block text-sm font-medium mb-1">
                Search by title or channel
              </Label>
              <Input
                id="search-mobile"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Enter keywords..."
              />
            </div>
            <div>
              <Label htmlFor="status-mobile" className="block text-sm font-medium mb-1">
                Status
              </Label>
              <Select
                value={localStatus || ''}
                onValueChange={(value) => setLocalStatus(value === 'all' ? '' : value)}
              >
                <SelectTrigger id="status-mobile">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="channel-mobile" className="block text-sm font-medium mb-1">
                Channel
              </Label>
              <Select
                value={localChannelId || ''}
                onValueChange={(value) => setLocalChannelId(value === 'all' ? '' : value)}
              >
                <SelectTrigger id="channel-mobile">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  {channelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleClear} variant="outline" className="w-full">
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FilterPanel;
