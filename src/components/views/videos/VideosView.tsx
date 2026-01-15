import React from 'react';
import { useVideos } from '@/hooks/useVideos';
import VideosFilterBar from './VideosFilterBar';
import VideosGrid from './VideosGrid';
import GenerateSummaryDialog from './GenerateSummaryDialog';
import QueryProvider from '@/components/providers/QueryProvider';
import ErrorState from '@/components/shared/ErrorState';

const VideosContent = () => {
  const {
    videos,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    filters,
    setFilters,
    channels,
    selectedVideo,
    selectVideo,
    closeDialog,
    generateSummary,
    isGenerating,
  } = useVideos();

  // Check if any filters are active
  const hasActiveFilters = filters.channelId !== 'all' || filters.summaryStatus !== 'all' || !!(filters.searchQuery && filters.searchQuery.trim());

  // Show error state if there's an error
  if (isError) {
    return (
      <div className="container mx-auto p-4 pt-12 pb-12">
        <ErrorState
          error={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-12 pb-12">
      {/* Page Header - always visible */}
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          Available Videos
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover videos from your subscribed channels and generate AI-powered summaries to enhance your learning. Currently displaying {videos.length} videos.
        </p>
      </div>

      {/* Filters - always visible */}
      <VideosFilterBar
        channels={channels}
        activeFilters={filters}
        onFiltersChange={setFilters}
        disabled={isLoading}
      />

      <VideosGrid
        videos={videos}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={!!hasNextPage}
        fetchNextPage={fetchNextPage}
        onSelectVideo={selectVideo}
        hasActiveFilters={hasActiveFilters}
      />
      <GenerateSummaryDialog
        video={selectedVideo}
        isOpen={!!selectedVideo}
        isGenerating={isGenerating}
        onClose={closeDialog}
        onConfirm={generateSummary}
      />
    </div >
  );
};

const VideosView = () => (
  <QueryProvider>
    <VideosContent />
  </QueryProvider>
);

export default VideosView;
