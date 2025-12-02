import React, { useCallback, useMemo } from 'react';
import { useSummaries } from '../../hooks/useSummaries';
import SummaryList from '../summaries/SummaryList';
import SummaryCardSkeleton from '@/components/summaries/SummaryCardSkeleton';
import EmptyState from '../summaries/EmptyState';
import { ApiClientError } from '../../lib/api';
import type { FilterOptions } from '../../types';
import QueryProvider from '../providers/QueryProvider';

const DashboardContent = () => {
  const filters: FilterOptions = useMemo(() => ({}), []); 
  const { 
    data, 
    isLoading, 
    isFetching,
    error, 
    hasNextPage, 
    fetchNextPage, 
    isFetchingNextPage 
  } = useSummaries(filters);

  const summaries = data?.pages.flatMap((page: any) => page.data) || [];
  const status = isLoading ? 'loading' : (error ? 'error' : (summaries.length > 0 ? 'success' : 'empty'));
  const isInitialLoading = isLoading && summaries.length === 0;
  const isListEmpty = status === 'empty';

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const getErrorMessage = (error: any): string => {
    if (error instanceof ApiClientError) {
      if (error.code === 'UNAUTHORIZED') {
        return 'Your session has expired. Please log in again.';
      }
      return error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again later.';
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {isInitialLoading && (
        <div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          aria-label="Loading summaries"
          aria-busy="true"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <SummaryCardSkeleton key={index} />
          ))}
        </div>
      )}

      {isListEmpty && <EmptyState />}

      {!isInitialLoading && !isListEmpty && (
        <SummaryList
          data={data}
          isLoading={isLoading}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          error={error}
          refetch={() => {}} // Placeholder; add refetch if needed
          filters={filters}
          onHide={() => {}} // Placeholder for dashboard; implement if needed
          onRate={() => {}} // Placeholder
        />
      )}

      {status === 'error' && !isInitialLoading && (
        <div 
          className="text-center text-destructive mt-4 p-4 border border-destructive/50 rounded-lg bg-destructive/10"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-semibold mb-2">Error loading summaries</p>
          <p className="text-sm">{getErrorMessage(error)}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm underline hover:no-underline"
          >
            Refresh page
          </button>
        </div>
      )}
    </div>
  );
};

export const DashboardView = () => (
  <QueryProvider>
    <DashboardContent />
  </QueryProvider>
);

export default DashboardView;
