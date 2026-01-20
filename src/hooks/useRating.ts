import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import type { RatingResponse, RateSummaryRequest } from "@/types";

async function rateSummaryAPI(summaryId: string, rating: boolean): Promise<RatingResponse> {
  const request: RateSummaryRequest = { rating };
  return apiClient.post<RatingResponse>(`/api/summaries/${summaryId}/ratings`, request);
}

async function removeRatingAPI(summaryId: string): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/api/summaries/${summaryId}/ratings`);
}

export function useRating(summaryId: string) {
  const queryClient = useQueryClient();

  const { mutate: rateSummaryMutation, isPending: isRating } = useMutation<RatingResponse, Error, boolean>({
    mutationFn: (rating: boolean) => rateSummaryAPI(summaryId, rating),
    onSuccess: (data) => {
      // Invalidate and refetch summary details to update rating stats
      queryClient.invalidateQueries({ queryKey: ["summaryDetails", summaryId] });
      toast.success(data.rating ? "Upvoted!" : "Downvoted!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to rate summary");
    },
  });

  const { mutate: removeRatingMutation, isPending: isRemoving } = useMutation<{ message: string }, Error, void>({
    mutationFn: () => removeRatingAPI(summaryId),
    onSuccess: () => {
      // Invalidate and refetch summary details to update rating stats
      queryClient.invalidateQueries({ queryKey: ["summaryDetails", summaryId] });
      toast.success("Rating removed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove rating");
    },
  });

  return {
    rateSummary: rateSummaryMutation,
    removeRating: removeRatingMutation,
    isRating,
    isRemoving,
  };
}
