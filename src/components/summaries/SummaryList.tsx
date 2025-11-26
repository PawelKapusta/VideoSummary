import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import type { SummaryWithVideo } from '@/types';
import { ApiClientError } from '@/lib/api';
import SummaryCard from './SummaryCard';
import SummaryCardSkeleton from './SummaryCardSkeleton';

interface SummaryListProps {
  summaries: SummaryWithVideo[];
  isLoading: boolean;
  hasMore: boolean;
  error: ApiClientError | null;
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

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {summaries.map((summary) => (
        <SummaryCard key={summary.id} summary={summary} />
      ))}

      {isLoading && Array.from({ length: 6 }).map((_, index) => <SummaryCardSkeleton key={index} />)}

      {!isLoading && hasMore && <div ref={ref} style={{ height: '1px' }} />}

      {error && <p className="text-destructive text-center md:col-span-2 lg:col-span-3">{error.message}</p>}
    </div>
  );
};

export default SummaryList;
