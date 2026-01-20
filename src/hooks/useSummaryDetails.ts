import { useQuery } from "@tanstack/react-query";
import { apiClient as api } from "@/lib/api";
import type { DetailedSummary } from "@/types";

export function useSummaryDetails(summaryId: string) {
  const query = useQuery<DetailedSummary, Error>({
    queryKey: ["summaryDetails", summaryId],
    queryFn: async () => {
      const response = await api.get<DetailedSummary>(`/api/summaries/${summaryId}`);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => failureCount < 3 && !error.message.includes("401"),
    enabled: !!summaryId, // Only run the query if summaryId is available
    refetchInterval: (query) => {
      // Check if we have data and it's still processing
      if (query.state.data?.status === "pending" || query.state.data?.status === "in_progress") {
        return 3000; // 3 seconds - very frequent updates during processing
      }
      return false; // Stop polling for completed/failed summaries
    },
    refetchIntervalInBackground: true, // Continue polling even when window is not focused
  });

  return query;
}
