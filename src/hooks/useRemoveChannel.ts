import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiClientError } from "@/lib/api";

async function removeChannel(subscriptionId: string): Promise<undefined> {
  // Assuming a DELETE request to /api/profile/channels/:id
  await apiClient.delete(`/api/profile/channels/${subscriptionId}`);
}

export function useRemoveChannel() {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: removeChannel,
    onSuccess: () => {
      toast.success("Successfully unsubscribed from the channel.");
      // Invalidate queries to refetch and update the stats
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["userChannels"] });
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        toast.error(`Unsubscribe failed: ${error.message}`);
      } else {
        toast.error("An unexpected error occurred while unsubscribing.");
      }
    },
  });
}
