import React, { useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import type { SummaryWithVideo } from '@/types';
import SummaryCard from './SummaryCard';
import SummaryCardSkeleton from './SummaryCardSkeleton';

interface SummaryListProps {
  summaries: SummaryWithVideo[];
  isLoading: boolean;
  hasMore: boolean;
  error: Error | null;
  onLoadMore: () => void;
}

const SummaryList: React.FC<SummaryListProps> = ({
  summaries,
  isLoading,
  hasMore,
  error,
  onLoadMore,
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const handleLoadMore = useCallback(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore]);

  useEffect(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  return (
    <div 
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      role="feed"
      aria-busy={isLoading}
      aria-label="Video summaries feed"
    >
      {summaries.map((summary) => (
        <SummaryCard key={summary.id} summary={summary} />
      ))}

      {isLoading && Array.from({ length: 6 }).map((_, index) => <SummaryCardSkeleton key={`skeleton-${index}`} />)}

      {!isLoading && hasMore && (
        <div 
          ref={ref} 
          style={{ height: '1px' }} 
          aria-hidden="true"
        />
      )}

      {error && (
        <div 
          className="text-destructive text-center md:col-span-2 lg:col-span-3"
          role="alert"
          aria-live="assertive"
        >
          <p>{error.message}</p>
        </div>
      )}
    </div>
  );
};

export default SummaryList;
