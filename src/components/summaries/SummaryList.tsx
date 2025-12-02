import React, { useRef, useEffect, useCallback, memo } from 'react';
import SummaryCard from './SummaryCard';
import SummaryCardSkeleton from './SummaryCardSkeleton';
import type { SummaryWithVideo, FilterOptions } from '../../types';

interface Props {
  data?: any; // InfiniteData<PaginatedResponse<SummaryWithVideo>>
  isLoading: boolean;
  isFetching: boolean; // Add for refetch skeletons
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: Error | null;
  refetch: () => void;
  filters: FilterOptions;
  onHide: (id: string) => void;
  onRate: (id: string, boolean: boolean) => void;
}

const SummaryList: React.FC<Props> = memo(({
  data,
  isLoading,
  isFetching,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  error,
  refetch,
  filters,
  onHide,
  onRate,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const flattenedData = data?.pages.flatMap((page: any) => page.data) || [];

  const handleObserve = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    observer.current = new IntersectionObserver(handleObserve, { threshold: 1.0 });
    if (sentinelRef.current) {
      observer.current.observe(sentinelRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserve]);

  if (error && !flattenedData.length) { // Only show global error if no data
    return (
      <div className="flex flex-col items-center py-12">
        <p className="text-red-500 mb-4">
          {error.message.includes('401') ? 'Authentication failed. Please log in.' : 
           error.message.includes('429') ? 'Rate limited. Please wait.' : 
           `Error loading summaries: ${error.message}`}
        </p>
        <button 
          onClick={() => refetch()} 
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={!refetch}
        >
          Retry
        </button>
      </div>
    );
  }

  const showSkeletons = isLoading || (isFetching && flattenedData.length === 0);
  const skeletonCount = isFetching ? 3 : 5; // Fewer on refetch

  if (showSkeletons) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (flattenedData.length === 0) {
    return null;
  }

  // For refetch overlay, could add a spinner, but for now, show partial data + skeletons if needed
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {flattenedData.map((summary: SummaryWithVideo) => {
          if (!summary || !summary.id) return null; // Skip invalid summaries
          return (
            <SummaryCard
              key={summary.id}
              summary={summary}
              onHide={onHide}
              onRate={onRate}
              onClick={(id) => window.location.href = `/summaries/${id}`}
            />
          );
        })}
      </div>
      <div ref={sentinelRef} className="h-10 flex justify-center items-center">
        {isFetchingNextPage && <SummaryCardSkeleton />}
        {!hasNextPage && flattenedData.length > 0 && (
          <p className="text-gray-500 text-center">No more summaries</p>
        )}
        {error && flattenedData.length > 0 && ( // Infinite error
          <div className="text-center py-4">
            <p className="text-red-500 mb-2">Failed to load more summaries</p>
            <button onClick={fetchNextPage} className="text-blue-500 underline">Retry</button>
          </div>
        )}
      </div>
    </>
  );
});

SummaryList.displayName = 'SummaryList';

export default SummaryList;
