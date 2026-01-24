import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSummaries } from "../../src/hooks/useSummaries";
import { apiClient } from "../../src/lib/api";

// Mock the API client
vi.mock("../../src/lib/api", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("useSummaries", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.mocked(apiClient.get).mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it("should use generated_at_desc as default sort when no filters provided", async () => {
    const mockResponse = {
      data: [],
      pagination: { total: 0, limit: 20, offset: 0 },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSummaries({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith("/api/summaries", {
      params: expect.objectContaining({
        sort: "generated_at_desc",
        limit: 20,
        offset: 0,
        include_hidden: false,
        hidden_only: false,
      }),
    });
  });

  it("should use provided sort parameter when specified", async () => {
    const mockResponse = {
      data: [],
      pagination: { total: 0, limit: 20, offset: 0 },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useSummaries({ sort: "published_at_desc" }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith("/api/summaries", {
      params: expect.objectContaining({
        sort: "published_at_desc",
        limit: 20,
        offset: 0,
        include_hidden: false,
        hidden_only: false,
      }),
    });
  });

  it("should include optional filters when provided", async () => {
    const mockResponse = {
      data: [],
      pagination: { total: 0, limit: 20, offset: 0 },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () =>
        useSummaries({
          search: "test query",
          channel_id: "test-channel-id",
          status: "completed",
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith("/api/summaries", {
      params: expect.objectContaining({
        sort: "generated_at_desc",
        limit: 20,
        offset: 0,
        include_hidden: false,
        hidden_only: false,
        search: "test query",
        channel_id: "test-channel-id",
        status: "completed",
      }),
    });
  });
});