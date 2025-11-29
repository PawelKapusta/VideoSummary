import { useInfiniteQuery } from '@tanstack/react-query';
import type { SummaryWithVideo, PaginatedResponse } from '@/types';
import { apiClient } from '@/lib/api';

const LIMIT = 20;

const fetchSummaries = async ({ pageParam = 0 }: { pageParam?: number }) => {
  const data = await apiClient.get<PaginatedResponse<SummaryWithVideo>>(
    `/api/summaries?limit=${LIMIT}&offset=${pageParam}`,
  );
  return data;
};

const useSummaries = () => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['summaries'],
    queryFn: fetchSummaries,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.pagination.offset + lastPage.data.length;
      const hasMore = nextOffset < lastPage.pagination.total;
      console.log('getNextPageParam:', { nextOffset, total: lastPage.pagination.total, hasMore });
      return hasMore ? nextOffset : undefined;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const summaries = data?.pages.flatMap((page) => page.data) ?? [];

  // Determine status for backward compatibility
  const status = isLoading ? 'loading' : isError ? 'error' : 'success';

  console.log('useSummaries hook:', {
    isLoading,
    isError,
    status,
    summariesCount: summaries.length,
    pagesCount: data?.pages.length,
    error,
  });

  return {
    summaries,
    status,
    error,
    hasMore: hasNextPage,
    loadMore: fetchNextPage,
    isLoadingMore: isFetchingNextPage,
  };
};

export default useSummaries;
