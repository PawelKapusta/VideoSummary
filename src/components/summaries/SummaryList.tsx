import React, { useEffect, memo } from "react";
import { useInView } from "react-intersection-observer";
import SummaryCard from "./SummaryCard";
import type { SummaryWithVideo, PaginatedResponse } from "../../types";
import type { InfiniteData } from "@tanstack/react-query";
import FuturisticSkeleton from "./FuturisticSkeleton";
import AppLoader from "../ui/AppLoader";

interface Props {
  data?: InfiniteData<PaginatedResponse<SummaryWithVideo>>;
  isLoading: boolean;
  isFetching: boolean; // Add for refetch skeletons
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: Error | null;
  refetch: () => void;
  onHide: (id: string) => void;
  onRate: (id: string, rating: boolean | null) => void;
  onRegenerate?: (summary: SummaryWithVideo) => void;
}

const SummaryList: React.FC<Props> = memo(
  ({
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
    onHide,
    onRate,
    onRegenerate,
  }) => {
    const { ref, inView } = useInView({
      threshold: 0,
    });

    const flattenedData = data?.pages.flatMap((page: PaginatedResponse<SummaryWithVideo>) => page.data) || [];

    useEffect(() => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]); // Re-run when handleObserve changes

    if (error && !flattenedData.length) {
      // Only show global error if no data
      return (
        <div className="flex flex-col items-center py-12">
          <p className="text-red-500 mb-4">
            {error.message.includes("401")
              ? "Authentication failed. Please log in."
              : error.message.includes("429")
                ? "Rate limited. Please wait."
                : `Error loading summaries: ${error.message}`}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            disabled={!refetch}
          >
            Retry
          </button>
        </div>
      );
    }

    const showSkeletons = isLoading || (isFetching && flattenedData.length === 0);

    if (showSkeletons) {
      return <AppLoader loadingText="Loading summaries..." />;
    }

    if (flattenedData.length === 0) {
      return null;
    }

    // For refetch overlay, could add a spinner, but for now, show partial data + skeletons if needed
    return (
      <>
        <div data-testid="summary-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {flattenedData.map((summary: SummaryWithVideo) => {
            if (!summary || !summary.id) return null; // Skip invalid summaries
            return (
              <SummaryCard
                key={summary.id}
                summary={summary}
                onHide={onHide}
                onRate={onRate}
                onRegenerate={onRegenerate}
                onClick={(id) => (window.location.href = `/summaries/${id}`)}
              />
            );
          })}
        </div>
        <div ref={ref} className="h-10" />
        {isFetchingNextPage && (
          <div className="text-center py-4">
            <FuturisticSkeleton />
          </div>
        )}
        {!hasNextPage && flattenedData.length > 10 && (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-12 h-px bg-gray-200 dark:bg-gray-700 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">You&apos;ve reached the end</p>
          </div>
        )}
        {error &&
          flattenedData.length > 0 && ( // Infinite error
            <div className="text-center py-4">
              <p className="text-red-500 mb-2">Failed to load more summaries</p>
              <button onClick={fetchNextPage} className="text-blue-500 underline">
                Retry
              </button>
            </div>
          )}
      </>
    );
  }
);

SummaryList.displayName = "SummaryList";

export default SummaryList;
