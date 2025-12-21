import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import FilterPanel from '../summaries/FilterPanel';
import SummaryList from '../summaries/SummaryList';
import EmptyState from '../summaries/EmptyState';
import { useSummaries } from '../../hooks/useSummaries';
import { useUserChannels } from '../../hooks/useUserChannels';
import type { FilterOptions, SummaryWithVideo } from '../../types';
import AppLoader from '../ui/AppLoader';
import { Button } from '../ui/button';
import { useMutation } from '@tanstack/react-query';
import { generateSummary } from '../../lib/api';
import GenerateSummaryDialog from './videos/GenerateSummaryDialog';
import type { VideoSummary } from '../../types';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // TODO: Log to service like Sentry
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">An unexpected error occurred while rendering the summaries.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Reload Page
          </button>
          {this.state.error && <p className="mt-4 text-sm text-red-500">{this.state.error.message}</p>}
        </div>
      );
    }

    return this.props.children;
  }
}

const SummariesContent: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isRefetchDisabled, setIsRefetchDisabled] = useState(false);
  const [disableUntil, setDisableUntil] = useState<number | null>(null);
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
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, error, refetch } = useSummaries(filters);
  const { data: channelsData, isLoading: channelsLoading } = useUserChannels();

  const flattenedData = data?.pages.flatMap((page: any) => page.data) || [];
  const firstPage = data?.pages[0] as any;
  const totalCount = firstPage?.pagination?.total || 0;

  // Handle auth errors - redirect to login
  useEffect(() => {
    if (error?.message.includes('401') || error?.message.includes('UNAUTHORIZED')) {
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login'; // Replace navigate('/login');
    }
  }, [error]);

  // Rate limiting - disable refetch for 30s on 429
  useEffect(() => {
    if (error?.message.includes('429') || error?.message.includes('RATE_LIMIT')) {
      const now = Date.now();
      setDisableUntil(now + 30000);
      setIsRefetchDisabled(true);
      toast.warning('Too many requests. Please wait 30 seconds before trying again.', { duration: 5000 });
      const timer = setTimeout(() => {
        setIsRefetchDisabled(false);
        setDisableUntil(null);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters((prevFilters) => {
      // Avoid unnecessary updates if filters haven't changed
      if (JSON.stringify(prevFilters) === JSON.stringify(newFilters)) {
        return prevFilters;
      }
      return newFilters;
    });
  }, []);

  const handleHide = useCallback(async (id: string) => {
    try {
      // Optimistic update can be added here
      await queryClient.invalidateQueries({ queryKey: ['summaries', filters] });
      toast.success('Summary hidden successfully');
    } catch (err) {
      toast.error('Failed to hide summary');
    }
  }, [queryClient, filters]);

  const handleRate = useCallback(async (id: string, rating: boolean | null) => {
    try {
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

      // Don't invalidate here - useRating hook will handle success/error states
    } catch (err) {
      toast.error('Failed to update rating');
    }
  }, [queryClient, filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Check if any filters are active
  const hasActiveFilters = filters.channelId !== 'all' || filters.summaryStatus !== 'all' || (filters.searchQuery && filters.searchQuery.trim() !== '');

  const emptyMessage = flattenedData.length === 0 && hasActiveFilters
    ? `No summaries match your current filters.`
    : 'Ready to start your learning journey?';

  const emptyDescription = flattenedData.length === 0 && hasActiveFilters
    ? 'Try adjusting your search criteria or clearing some filters to see more summaries.'
    : 'Start building your knowledge base by subscribing to channels and generating AI-powered summaries of their videos.';

  // ... imports

  if (channelsLoading) {
    return (
      <div className="container mx-auto p-4 pt-12">
        <AppLoader loadingText="Loading your summaries..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 pt-12 pb-12">
        {/* Header - always visible */}
        <header className="text-center mb-8 space-y-3">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Your Summaries
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {totalCount > 0
              ? `Browse and manage all ${totalCount} of your video summaries. Filter by channel, date, or search for specific content.`
              : 'Start building your knowledge base by subscribing to channels and generating AI-powered summaries of their videos.'
            }
          </p>
        </header>

        {/* Filters - always visible */}
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          channels={channelsData || []}
          disabled={isLoading || isFetching}
        />

        {flattenedData.length === 0 && !isLoading ? (
          hasActiveFilters ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 max-w-2xl mx-auto">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-amber-100 rounded-full flex items-center justify-center shadow-sm">
                  <Search className="w-12 h-12 text-amber-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                No summaries match your filters
              </h2>
              <p className="text-lg text-gray-600 mb-8 text-center leading-relaxed max-w-lg">
                Try adjusting your search criteria or clearing some filters to see more summaries.
              </p>
              <Button onClick={handleClearFilters} variant="outline" size="lg" className="px-8">
                <Search className="w-4 h-4 mr-2" />
                Show All Summaries
              </Button>
            </div>
          ) : (
            <EmptyState
              message={emptyMessage}
              description={emptyDescription}
            />
          )
        ) : (
          <SummaryList
            data={data}
            isLoading={isLoading || isFetching}
            isFetching={isFetching}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            error={error}
            refetch={() => !isRefetchDisabled && refetch()}
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
      </div>
    </ErrorBoundary>
  );
};

import QueryProvider from '../providers/QueryProvider';

const SummariesView = () => (
  <QueryProvider>
    <SummariesContent />
  </QueryProvider>
);

export default SummariesView;
