import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSummaries } from '../../hooks/useSummaries';
import SummaryList from '../summaries/SummaryList';
import AppLoader from '../ui/AppLoader';
import EmptyState from '../summaries/EmptyState';
import ErrorState from '../shared/ErrorState';
import type { FilterOptions, SummaryWithVideo, VideoSummary } from '../../types';
import QueryProvider from '../providers/QueryProvider';
import { useMutation } from '@tanstack/react-query';
import { generateSummary } from '../../lib/api';
import GenerateSummaryDialog from './videos/GenerateSummaryDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['summaries'] });
  }, [queryClient]);

  return (
    <div className="container mx-auto p-4 pt-12 pb-12">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Track your video insights, manage subscriptions, and access your AI-generated summaries all in one place.
        </p>
      </div>

      {/* AI Disclaimer - Always visible */}
      <div className="relative mx-3 sm:mx-4 lg:mx-0 mb-6 sm:mb-8 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 shadow-lg shadow-blue-100/50">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full -translate-y-10 sm:-translate-y-16 translate-x-10 sm:translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-tr from-purple-200/30 to-transparent rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>

        <div className="relative p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                🤖 AI Content Notice
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Important</span>
              </h3>

              <div className="space-y-3">
                <p className="text-gray-700 font-medium leading-relaxed">
                  VideoSummary provides AI-generated summaries for educational purposes only.
                </p>

                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100/50">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Please note:</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>AI summaries may contain inaccuracies or incomplete information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Do not rely on summaries for critical decisions or professional advice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Always verify information from original sources when accuracy matters</span>
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-600 italic bg-gray-50/80 rounded-lg px-3 py-2 border-l-4 border-blue-300">
                  Use AI summaries as learning tools, not definitive sources of information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isInitialLoading && <AppLoader loadingText="Loading summaries..." />}

      {isListEmpty && !isInitialLoading && (
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
        <ErrorState
          error={error}
          onRetry={handleRetry}
        />
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
