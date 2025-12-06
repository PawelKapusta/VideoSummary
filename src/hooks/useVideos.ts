import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generateSummary, getVideos } from '@/lib/api';
import type { VideosFilterState, VideoSummary, UserProfile } from '@/types';
import { useProfile } from './useProfile';

export const useVideos = () => {
  const [filters, setFilters] = useState<VideosFilterState>({
    channelId: 'all',
    summaryStatus: 'all',
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
      toast.error(`Failed to start generation: ${errorMessage}`);
    },
  });

  const videos = data?.pages.flatMap(page => page.data) ?? [];

  // Client-side filtering for summary status (api filtering for summary status is not implemented yet in this version)
  const filteredVideos = videos.filter(video => {
    // Note: channelId filtering is handled by the API, so we don't need to filter here for channelId unless 'all' case needs handling on client side (but API handles it).
    // However, keeping it consistent if API returns mixed results or for optimistic updates. 
    // Actually, API handles channelId, but let's double check summaryStatus.
    
    if (filters.summaryStatus === 'with') {
      return video.has_summary;
    }
    if (filters.summaryStatus === 'without') {
      return !video.has_summary;
    }
    return true;
  });

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
    videos: filteredVideos,
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
