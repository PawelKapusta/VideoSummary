import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Search } from 'lucide-react';
import type { VideoSummary } from '@/types';
import VideoCard from './VideoCard';
import EmptyState from '@/components/shared/EmptyState';
import AppLoader from '@/components/ui/AppLoader';

interface VideosGridProps {
  videos: VideoSummary[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  onSelectVideo: (video: VideoSummary) => void;
  hasActiveFilters?: boolean;
}



const VideosGrid: React.FC<VideosGridProps> = ({
  videos,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onSelectVideo,
  hasActiveFilters = false,
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <AppLoader loadingText="Loading videos..." />;
  }

  if (videos.length === 0) {
    if (!hasActiveFilters) {
      return <EmptyState
        type="videos"
        message="No videos found."
        description="Subscribe to YouTube channels to see their videos and generate summaries."
      />;
    } else {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-8 max-w-2xl mx-auto">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-amber-100 rounded-full flex items-center justify-center shadow-sm">
              <Search className="w-12 h-12 text-amber-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            No videos match your filters
          </h2>
          <p className="text-lg text-gray-600 mb-8 text-center leading-relaxed max-w-lg">
            Try adjusting your search criteria or clearing some filters to see more videos.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} onGenerate={onSelectVideo} />
      ))}
      <div ref={ref} className="h-10" />
      {isFetchingNextPage && (
        <div className="text-center py-4">
          <p>Loading more videos...</p>
        </div>
      )}
    </div>
  );
};

export default VideosGrid;
