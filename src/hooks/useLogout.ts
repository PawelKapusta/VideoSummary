import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearSession } from "@/lib/auth";
import { toast } from "sonner";
import { authApiClient } from "@/lib/api";

export function useLogout() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      // Use the new authenticated client
      return await authApiClient.post("/api/auth/logout");
    },
    onError: (error) => {
      console.error("Logout API call failed", error);
      // Fallback to clearing session locally
      toast.error("Logout failed on server, clearing session locally.");
    },
    onSettled: () => {
      // This will run on both success and error
      clearSession();
      queryClient.clear();

      toast.success("Logged out successfully");

      // eslint-disable-next-line react-compiler/react-compiler
      window.location.href = "/login"; // Redirect to login
    },
  });

  return {
    logout: () => mutation.mutate(),
    isLoading: mutation.isPending,
  };
}
