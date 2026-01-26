import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api";
import type { UserProfile, ApiSuccess } from "@/types";
import { useEffect } from "react";
import { toast } from "sonner";

async function fetchProfile(): Promise<UserProfile> {
  // This function now expects the apiClient to correctly handle errors.
  return apiClient.get<UserProfile>("/api/profile");
}

export function useProfile() {
  const queryClient = useQueryClient();

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

  const updateProfileMutation = useMutation<
    UserProfile,
    ApiClientError,
    { username?: string }
  >({
    mutationFn: async (updates) => {
      const response = await apiClient.put<ApiSuccess<UserProfile>>("/api/profile", updates);
      return response.data!;
    },
    onSuccess: (updatedProfile) => {
      // Update the cached profile data immediately
      queryClient.setQueryData(["profile"], updatedProfile);
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      if (error.code === "USERNAME_TAKEN") {
        toast.error("Username is already taken. Please choose a different one.");
      } else if (error.code === "INVALID_INPUT") {
        toast.error("Invalid username format. Use only letters, numbers, underscores, and dashes (3-30 characters).");
      } else {
        toast.error(`Failed to update profile: ${error.message}`);
      }
    },
  });

  return {
    profile: data,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    ...rest,
  };
}
