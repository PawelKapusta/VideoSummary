import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSummaries } from '../../hooks/useSummaries';
import SummaryList from '../summaries/SummaryList';
import AppLoader from '../ui/AppLoader';
import EmptyState from '../summaries/EmptyState';
import { ApiClientError } from '../../lib/api';
import type { FilterOptions, SummaryWithVideo, VideoSummary } from '../../types';
import QueryProvider from '../providers/QueryProvider';
import { useMutation } from '@tanstack/react-query';
import { generateSummary } from '../../lib/api';
import GenerateSummaryDialog from './videos/GenerateSummaryDialog';

const DashboardContent = () => {
  const filters: FilterOptions = useMemo(() => ({}), []);
  const [selectedVideo, setSelectedVideo] = useState<VideoSummary | null>(null);
  const queryClient = useQueryClient();

  const { mutate: generateSummaryMutation, isPending: isGenerating } = useMutation({
    mutationFn: (video: VideoSummary) => {
      const videoUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
      return generateSummary({ video_url: videoUrl });
    },
    onSuccess: () => {
      toast.success('Summary generation started!');
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
      setSelectedVideo(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.error?.message || 'An unknown error occurred.';
      toast.error(`Failed to generate summary: ${errorMessage}`);
    },
  });

  const handleRegenerate = useCallback((summary: SummaryWithVideo) => {
    setSelectedVideo({
      id: summary.video.id,
      youtube_video_id: summary.video.youtube_video_id,
      title: summary.video.title,
      thumbnail_url: summary.video.thumbnail_url,
      published_at: summary.video.published_at,
      channel: summary.channel,
      summary_id: summary.id,
      summary_status: summary.status,
    });
  }, []);
  const {
    data,
    isLoading,
    isFetching,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useSummaries(filters);

  const summaries = data?.pages.flatMap((page: any) => page.data) || [];
  const status = isLoading ? 'loading' : (error ? 'error' : (summaries.length > 0 ? 'success' : 'empty'));
  const isInitialLoading = isLoading && summaries.length === 0;
  const isListEmpty = status === 'empty';

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleRate = useCallback(async (id: string, rating: boolean | null) => {
    // Update the specific summary in the cache instead of invalidating everything
    queryClient.setQueryData(['summaries', filters], (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          data: page.data.map((summary: any) =>
            summary.id === id ? { ...summary, user_rating: rating } : summary
          )
        }))
      };
    });
  }, [queryClient, filters]);

  const handleHide = useCallback(async (id: string) => {
    try {
      // Clear all caches to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['summaries'] });
      await queryClient.invalidateQueries({ queryKey: ['hiddenSummaries'] });
      toast.success('Summary hidden successfully');
    } catch (err) {
      toast.error('Failed to hide summary');
    }
  }, [queryClient]);

  const getErrorMessage = (error: any): string => {
    if (error instanceof ApiClientError) {
      if (error.code === 'UNAUTHORIZED') {
        return 'Your session has expired. Please log in again.';
      }
      return error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again later.';
  };

  return (
    <div className="container mx-auto p-4 pt-12 pb-12">
      {!isListEmpty && (
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your video insights, manage subscriptions, and access your AI-generated summaries all in one place.
          </p>
        </div>
      )}

      {isInitialLoading && <AppLoader loadingText="Loading summaries..." />}

      {isListEmpty && (
        <EmptyState
          message="Welcome to your dashboard"
        />
      )}

      {!isInitialLoading && !isListEmpty && (
        <SummaryList
          data={data}
          isLoading={isLoading}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          error={error}
          refetch={() => { }} // Placeholder; add refetch if needed
          filters={filters}
          onHide={handleHide}
          onRate={handleRate}
          onRegenerate={handleRegenerate}
        />
      )}

      <GenerateSummaryDialog
        video={selectedVideo}
        isOpen={!!selectedVideo}
        isGenerating={isGenerating}
        onClose={() => setSelectedVideo(null)}
        onConfirm={generateSummaryMutation}
      />

      {status === 'error' && !isInitialLoading && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700 font-medium">{getErrorMessage(error)}</p>
        </div>
      )}
    </div>
  );
};

export const DashboardView = () => (
  <QueryProvider>
    <DashboardContent />
  </QueryProvider>
);

export default DashboardView;
