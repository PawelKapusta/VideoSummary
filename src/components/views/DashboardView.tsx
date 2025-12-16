import React, { useCallback, useMemo } from 'react';
import { useSummaries } from '../../hooks/useSummaries';
import SummaryList from '../summaries/SummaryList';
import AppLoader from '../ui/AppLoader';
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
    <div className="container mx-auto p-4 pt-8">
      {!isListEmpty && (
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your video insights, manage subscriptions, and access your AI-generated summaries all in one place.
          </p>
        </div>
      )}

      {isInitialLoading && <AppLoader loadingText="Loading summaries..." />}

      {isListEmpty && (
        <EmptyState
          message="Welcome to your dashboard"
        />
      )}

      {!isInitialLoading && !isListEmpty && (
        <SummaryList
          data={data}
          isLoading={isLoading}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          error={error}
          refetch={() => { }} // Placeholder; add refetch if needed
          filters={filters}
          onHide={() => { }} // Placeholder for dashboard; implement if needed
          onRate={() => { }} // Placeholder
        />
      )}

      {status === 'error' && !isInitialLoading && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700 font-medium">{getErrorMessage(error)}</p>
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
