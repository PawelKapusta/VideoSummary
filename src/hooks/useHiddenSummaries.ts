import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { apiClient as api } from "../lib/api";
import type { PaginatedResponse, SummaryWithVideo, FilterOptions } from "../types";

interface PageParam {
  offset: number;
}

export function useHiddenSummaries(filters: FilterOptions = {}) {
  return useInfiniteQuery<
    PaginatedResponse<SummaryWithVideo>,
    Error,
    InfiniteData<PaginatedResponse<SummaryWithVideo>>,
    string[],
    PageParam
  >({
    queryKey: ["hiddenSummaries", JSON.stringify(filters)],
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      const params = {
        limit: 20,
        offset: pageParam.offset,
        hidden_only: true, // Show only hidden summaries
        sort: "published_at_desc",
        ...filters, // Spread filters into params
      };

      // Remove undefined values
      const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== ""));

      const response = await api.get<PaginatedResponse<SummaryWithVideo>>("/api/summaries", { params: cleanParams });
      return response;
    },
    initialPageParam: { offset: 0 },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (!lastPage?.pagination) return undefined;
      const offset = lastPage.pagination.offset;
      const limit = lastPage.pagination.limit;
      const total = lastPage.pagination.total;

      if (offset + limit < total) {
        return { offset: offset + limit };
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: (failureCount, error) => failureCount < 3 && !error.message.includes("401"),
  });
}
