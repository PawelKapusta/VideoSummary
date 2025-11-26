import React from 'react';
import useSummaries from '@/hooks/useSummaries';
import SummaryList from '@/components/summaries/SummaryList';
import SummaryCardSkeleton from '@/components/summaries/SummaryCardSkeleton';
import EmptyState from '@/components/shared/EmptyState';

const DashboardView = () => {
  const { summaries, status, error, hasMore, loadMore } = useSummaries();

  const isInitialLoading = status === 'loading' && summaries.length === 0;
  const isListEmpty = status === 'success' && summaries.length === 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {isInitialLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SummaryCardSkeleton key={index} />
          ))}
        </div>
      )}

      {isListEmpty && <EmptyState />}

      {!isInitialLoading && !isListEmpty && (
        <SummaryList
          summaries={summaries}
          isLoading={status === 'loading'}
          hasMore={hasMore}
          error={error}
          onLoadMore={loadMore}
        />
      )}

      {status === 'error' && !isInitialLoading && (
        <div className="text-center text-destructive mt-4">
          <p>Error: {error?.message || 'An unknown error occurred.'}</p>
          <p>Please try refreshing the page.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
