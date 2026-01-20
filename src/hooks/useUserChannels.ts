import { useQuery } from "@tanstack/react-query";
import { apiClient as api } from "../lib/api";
import type { Channel } from "../types";

export function useUserChannels() {
  return useQuery({
    queryKey: ["userChannels"],
    queryFn: async () => {
      const response = await api.get<Channel[]>("/api/profile/channels");
      // @ts-expect-error - api.get returns the data directly according to updated api.ts
      return response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
