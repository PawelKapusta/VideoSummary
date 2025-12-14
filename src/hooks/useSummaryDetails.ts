import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient as api } from '@/lib/api';
import type { DetailedSummary } from '@/types';

export function useSummaryDetails(summaryId: string) {
  const query = useQuery<DetailedSummary, Error>({
    queryKey: ['summaryDetails', summaryId],
    queryFn: async () => {
      const response = await api.get<DetailedSummary>(`/api/summaries/${summaryId}`);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => failureCount < 3 && !error.message.includes('401'),
    enabled: !!summaryId, // Only run the query if summaryId is available
    refetchInterval: (query) => {
      // Auto-refresh every 10 seconds if status is pending or in_progress
      if (query.state.data?.status === 'pending' || query.state.data?.status === 'in_progress') {
        return 10000; // 10 seconds
      }
      return false; // Stop auto-refresh for completed or failed statuses
    },
    refetchIntervalInBackground: false, // Don't refetch when window is not focused
  });

  return query;
}
