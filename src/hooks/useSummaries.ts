import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { apiClient as api } from "../lib/api"; // Named import with alias
import type { PaginatedResponse, SummaryWithVideo, FilterOptions } from "../types";

interface PageParam {
  offset: number;
}

export function useSummaries(filters: FilterOptions) {
  return useInfiniteQuery<
    PaginatedResponse<SummaryWithVideo>,
    Error,
    InfiniteData<PaginatedResponse<SummaryWithVideo>, PageParam>,
    (string | FilterOptions)[],
    PageParam
  >({
    queryKey: ["summaries", filters],
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      const params: Record<string, string | number | boolean> = {
        limit: filters.limit ?? 20,
        offset: pageParam.offset,
        include_hidden: filters.include_hidden ?? false,
        hidden_only: filters.hidden_only ?? false,
        sort: filters.sort ?? "generated_at_desc",
      };

      // Add optional filters only if they have values
      if (filters.search) params.search = filters.search;
      if (filters.channel_id) params.channel_id = filters.channel_id;
      if (filters.status) params.status = filters.status;
      if (filters.generated_at_from) params.generated_at_from = filters.generated_at_from;
      if (filters.generated_at_to) params.generated_at_to = filters.generated_at_to;

      const response = await api.get<PaginatedResponse<SummaryWithVideo>>("/api/summaries", { params });
      // API returns PaginatedResponse<SummaryWithVideo> which has { data: [], pagination: {} }
      // We need to return the full response for React Query infinite query
      return response;
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
    refetchInterval: (query) => {
      // Poll every 30 seconds if there are pending/in_progress summaries
      const data = query.state.data;
      const hasActiveSummaries = data?.pages?.some((page) =>
        page.data?.some((summary: SummaryWithVideo) => summary.status === "pending" || summary.status === "in_progress")
      );
      return hasActiveSummaries ? 30 * 1000 : false; // 30s polling for active summaries
    },
    retry: (failureCount, error) => failureCount < 3 && !error.message.includes("401"), // No retry on auth
  });
}
