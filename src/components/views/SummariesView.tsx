import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import FilterPanel from '../summaries/FilterPanel';
import SummaryList from '../summaries/SummaryList';
import EmptyState from '../summaries/EmptyState';
import { useSummaries } from '../../hooks/useSummaries';
import { useUserChannels } from '../../hooks/useUserChannels';
import type { FilterOptions, SummaryWithVideo } from '../../types';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // TODO: Log to service like Sentry
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">An unexpected error occurred while rendering the summaries.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Reload Page
          </button>
          {this.state.error && <p className="mt-4 text-sm text-red-500">{this.state.error.message}</p>}
        </div>
      );
    }

    return this.props.children;
  }
}

const SummariesContent: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isRefetchDisabled, setIsRefetchDisabled] = useState(false);
  const [disableUntil, setDisableUntil] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, error, refetch } = useSummaries(filters);
  const { data: channelsData, isLoading: channelsLoading } = useUserChannels();

  const flattenedData = data?.pages.flatMap((page: any) => page.data) || [];
  const firstPage = data?.pages[0] as any;
  const totalCount = firstPage?.pagination?.total || 0; 

  // Handle auth errors - redirect to login
  useEffect(() => {
    if (error?.message.includes('401') || error?.message.includes('UNAUTHORIZED')) {
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login'; // Replace navigate('/login');
    }
  }, [error]);

  // Rate limiting - disable refetch for 30s on 429
  useEffect(() => {
    if (error?.message.includes('429') || error?.message.includes('RATE_LIMIT')) {
      const now = Date.now();
      setDisableUntil(now + 30000);
      setIsRefetchDisabled(true);
      toast.warning('Too many requests. Please wait 30 seconds before trying again.', { duration: 5000 });
      const timer = setTimeout(() => {
        setIsRefetchDisabled(false);
        setDisableUntil(null);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters((prevFilters) => {
      // Avoid unnecessary updates if filters haven't changed
      if (JSON.stringify(prevFilters) === JSON.stringify(newFilters)) {
        return prevFilters;
      }
      return newFilters;
    });
  }, []);

  const handleHide = useCallback(async (id: string) => {
    try {
      // Optimistic update can be added here
      await queryClient.invalidateQueries({ queryKey: ['summaries', filters] });
      toast.success('Summary hidden successfully');
    } catch (err) {
      toast.error('Failed to hide summary');
    }
  }, [queryClient, filters]);

  const handleRate = useCallback(async (id: string, rating: boolean) => {
    try {
      // Optimistic update can be added here
      await queryClient.invalidateQueries({ queryKey: ['summaries', filters] });
      toast.success(rating ? 'Upvoted!' : 'Downvoted!');
    } catch (err) {
      toast.error('Failed to submit rating');
    }
  }, [queryClient, filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const emptyMessage = flattenedData.length === 0 && Object.keys(filters).length > 0 
    ? `No summaries match your current filters.` 
    : 'No summaries available. Subscribe to channels to get started.';

  if (channelsLoading) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <Toaster position="top-right" richColors />
        <div className="flex justify-center items-center min-h-[400px]">
          <p>Loading your channels...</p> {/* TODO: Add spinner skeleton */}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 max-w-7xl">
        <Toaster position="top-right" richColors />
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Your Summaries</h1>
          <p className="text-gray-600 mt-1">
            {totalCount > 0 ? `${totalCount} summaries found` : 'No summaries yet'}
          </p>
        </header>
        <FilterPanel 
          filters={filters} 
          onFiltersChange={handleFiltersChange} 
          channels={channelsData || []} 
        />
        {flattenedData.length === 0 && !isLoading ? (
          <EmptyState 
            message={emptyMessage} 
            onClearFilters={handleClearFilters} 
          />
        ) : (
          <SummaryList
            data={data}
            isLoading={isLoading || isFetching}
            isFetching={isFetching}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            error={error}
            refetch={() => !isRefetchDisabled && refetch()}
            filters={filters}
            onHide={handleHide}
            onRate={handleRate}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

import QueryProvider from '../providers/QueryProvider';

const SummariesView = () => (
  <QueryProvider>
    <SummariesContent />
  </QueryProvider>
);

export default SummariesView;
