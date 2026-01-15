import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generateSummary, getVideos } from '@/lib/api';
import type { VideosFilterState, VideoSummary, UserProfile } from '@/types';
import { useProfile } from './useProfile';

export const useVideos = () => {
  const [filters, setFilters] = useState<VideosFilterState>({
    channelId: 'all',
    summaryStatus: 'all',
    searchQuery: '',
    sort: 'published_at_desc',
  });
  const [selectedVideo, setSelectedVideo] = useState<VideoSummary | null>(null);

  const { profile, isLoading: isLoadingProfile } = useProfile();
  const channels = profile?.subscribed_channels?.map((sub: any) => sub.channel) ?? [];
  const queryClient = useQueryClient();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['videos', filters],
    queryFn: ({ pageParam = 0 }) => getVideos(filters, pageParam),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      const nextOffset = pagination.offset + pagination.limit;
      return nextOffset < pagination.total ? nextOffset : undefined;
    },
    initialPageParam: 0,
    placeholderData: keepPreviousData,
  });

  const { mutate: generateSummaryMutation, isPending: isGenerating } = useMutation({
    mutationFn: (video: VideoSummary) => {
      const videoUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
      return generateSummary({ video_url: videoUrl });
    },
    onSuccess: () => {
      toast.success('Summary generation started!');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      const errorMessage = error?.error?.message || 'An unknown error occurred.';
      toast.error(`Failed to generate summary: ${errorMessage}`);
    },
  });

  const videos = data?.pages.flatMap(page => page.data) ?? [];

  // Client-side filtering removed as backend now handles all filters
  const processedVideos = videos;

  const handleSetFilters = (newFilters: Partial<VideosFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSelectVideo = (video: VideoSummary) => {
    setSelectedVideo(video);
  };

  const handleCloseDialog = () => {
    setSelectedVideo(null);
  };

  const handleGenerateSummary = () => {
    if (selectedVideo) {
      generateSummaryMutation(selectedVideo);
    }
  };

  return {
    videos: processedVideos,
    isLoading: status === 'pending' || isFetching,
    isError: status === 'error',
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    filters,
    setFilters: handleSetFilters,
    channels,
    selectedVideo,
    selectVideo: handleSelectVideo,
    closeDialog: handleCloseDialog,
    generateSummary: handleGenerateSummary,
    isGenerating,
  };
};
