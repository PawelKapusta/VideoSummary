import React from 'react';
import { useVideos } from '@/hooks/useVideos';
import VideosFilterBar from './VideosFilterBar';
import VideosGrid from './VideosGrid';
import GenerateSummaryDialog from './GenerateSummaryDialog';
import QueryProvider from '@/components/providers/QueryProvider';

const VideosContent = () => {
  const {
    videos,
    isLoading,
    isError,
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      
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
      />
      <GenerateSummaryDialog
        video={selectedVideo}
        isOpen={!!selectedVideo}
        isGenerating={isGenerating}
        onClose={closeDialog}
        onConfirm={generateSummary}
      />
    </div>
  );
};

const VideosView = () => (
  <QueryProvider>
    <VideosContent />
  </QueryProvider>
);

export default VideosView;
