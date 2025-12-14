import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
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
}



const VideosGrid: React.FC<VideosGridProps> = ({
  videos,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onSelectVideo,
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
    return <EmptyState message="No videos found." description="Try adjusting your filters or subscribing to more channels." />;
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
