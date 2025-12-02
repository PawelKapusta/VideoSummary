import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient as api } from '../lib/api'; // Named import with alias
import type { PaginatedResponse, SummaryWithVideo, FilterOptions, SummaryStatus } from '../../types';

interface PageParam {
  offset: number;
}

export function useSummaries(filters: FilterOptions) {
  return useInfiniteQuery<
    PaginatedResponse<SummaryWithVideo>,
    Error
  >({
    queryKey: ['summaries', filters],
    queryFn: async ({ pageParam = { offset: 0 } }) => {
      const params = {
        ...filters,
        limit: 20,
        offset: pageParam.offset,
        include_hidden: filters.include_hidden ?? false,
        sort: filters.sort ?? 'published_at_desc',
      };
      const { data } = await api.get<PaginatedResponse<SummaryWithVideo>>('/api/summaries', { params });
      return data;
    },
    initialPageParam: { offset: 0 },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const offset = lastPageParam?.offset ?? 0;
      if (!lastPage?.pagination) return undefined;
      if (offset + 20 < lastPage.pagination.total) {
        return { offset: offset + 20 };
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: (failureCount, error) => failureCount < 3 && !error.message.includes('401'), // No retry on auth
    onError: (error) => {
      if (error.message.includes('offline')) {
        toast.info('Using cached data (offline)');
      } else if (!error.message.includes('401')) {
        toast.error(`Failed to load summaries: ${error.message}`);
      }
    },
  });
}
