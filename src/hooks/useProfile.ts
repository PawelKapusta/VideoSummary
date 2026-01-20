import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api";
import type { UserProfile } from "@/types";
import { useEffect } from "react";
import { toast } from "sonner";

async function fetchProfile(): Promise<UserProfile> {
  // This function now expects the apiClient to correctly handle errors.
  return apiClient.get<UserProfile>("/api/profile");
}

export function useProfile() {
  const { data, isLoading, error, ...rest } = useQuery<UserProfile, Error>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    retry: 1, // Retry once on failure
  });

  useEffect(() => {
    if (error) {
      // The ApiClientError will have a code property we can check
      if (error instanceof ApiClientError && error.code === "UNAUTHORIZED") {
        toast.error("Your session has expired. Please log in again.");
        // Redirect to login after a short delay to allow toast to be seen
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        // Generic error for other cases
        toast.error(`Failed to load profile: ${error.message}`);
      }
    }
  }, [error]);

  return {
    profile: data,
    isLoading,
    error,
    ...rest,
  };
}
