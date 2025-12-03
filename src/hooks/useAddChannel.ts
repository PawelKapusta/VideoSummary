import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, ApiClientError } from '@/lib/api';
import type { SubscribeRequest, SubscriptionWithChannel } from '@/types';

async function addChannel(subscribeRequest: SubscribeRequest): Promise<SubscriptionWithChannel> {
  // Assuming the API returns the newly created subscription with channel info
  return apiClient.post<SubscriptionWithChannel>('/api/profile/channels', subscribeRequest);
}

export function useAddChannel() {
  const queryClient = useQueryClient();

  return useMutation<SubscriptionWithChannel, Error, SubscribeRequest>({
    mutationFn: addChannel,
    onSuccess: (data) => {
      toast.success(`Successfully subscribed to ${data.channel.name}!`);
      // Invalidate the profile query to refetch and show the new channel
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        toast.error(`Subscription failed: ${error.message}`);
      } else {
        toast.error('An unexpected error occurred while subscribing.');
      }
    },
  });
}
