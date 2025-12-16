import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGenerationStatus, fetchVideoMeta } from '@/lib/api';
import type { VideoSummary, ValidationStatusViewModel } from '@/types';

const INITIAL_VALIDATION_STATE: ValidationStatusViewModel = {
  isUrlValid: { text: 'Checking video URL', status: 'pending' },
  isSubscribed: { text: 'Checking channel subscription', status: 'pending' },
  isWithinLimit: { text: 'Checking generation limits', status: 'pending' },
  isDurationValid: { text: 'Checking video duration', status: 'pending' },
  isNotAlreadyGenerating: { text: 'Checking summary status', status: 'pending' },
};

export const useSummaryGenerationValidation = (video: VideoSummary | null) => {
  const [validationState, setValidationState] = useState(INITIAL_VALIDATION_STATE);
  const videoUrl = video ? `https://www.youtube.com/watch?v=${video.youtube_video_id}` : '';

  const {
    data: videoMeta,
    isLoading: isLoadingMeta,
    isError: isErrorMeta,
  } = useQuery({
    queryKey: ['videoMeta', videoUrl],
    queryFn: () => fetchVideoMeta(videoUrl),
    enabled: !!video,
  });

  const {
    data: generationStatus,
    isLoading: isLoadingStatus,
    isError: isErrorStatus,
  } = useQuery({
    queryKey: ['generationStatus', video?.channel.id],
    queryFn: () => fetchGenerationStatus(video!.channel.id),
    enabled: !!video,
  });

  // Summary status is now available directly from the video object

  useEffect(() => {
    if (!video) {
      setValidationState(INITIAL_VALIDATION_STATE);
      return;
    }

    const newState = { ...INITIAL_VALIDATION_STATE };

    // Step 1: URL & Meta check
    if (isLoadingMeta) {
      newState.isUrlValid = { text: 'Validating video...', status: 'checking' };
    } else if (isErrorMeta || !videoMeta) {
      newState.isUrlValid = { text: 'Video not found or invalid', status: 'error', error_message: 'Could not fetch video details.' };
    } else {
      newState.isUrlValid = { text: 'Video is valid', status: 'success' };

      // Step 2: Subscription check
      if (videoMeta.is_subscribed) {
        newState.isSubscribed = { text: 'Channel is subscribed', status: 'success' };
      } else {
        newState.isSubscribed = { text: 'Channel not subscribed', status: 'error', error_message: 'You must be subscribed to the channel.' };
      }

      // Step 4: Duration check
      const maxDuration = 45 * 60; // 45 minutes in seconds
      if (videoMeta.duration_seconds <= maxDuration) {
        newState.isDurationValid = { text: `Duration is less than 45 minutes`, status: 'success' };
      } else {
        newState.isDurationValid = { text: 'Video is too long', status: 'error', error_message: 'Video must be 45 minutes or less.' };
      }
    }

    // Step 3: Generation limit check
    if (isLoadingStatus) {
      newState.isWithinLimit = { text: 'Checking generation limits...', status: 'checking' };
    } else if (isErrorStatus || !generationStatus) {
      newState.isWithinLimit = { text: 'Failed to check limits', status: 'error', error_message: 'Could not verify generation limits.' };
    } else {
      if (generationStatus.can_generate) {
        newState.isWithinLimit = { text: 'Generation limit OK', status: 'success' };
      } else {
        newState.isWithinLimit = { text: 'Generation limit reached', status: 'error', error_message: generationStatus.note };
      }
    }

    // Step 5: Summary status check (using data from video object)
    if (video.summary_status === 'pending' || video.summary_status === 'in_progress') {
      newState.isNotAlreadyGenerating = { text: 'Summary is already being generated', status: 'error', error_message: 'This video already has a summary in progress.' };
    } else if (video.summary_status === 'completed') {
      newState.isNotAlreadyGenerating = { text: 'Summary already exists', status: 'error', error_message: 'This video already has a completed summary.' };
    } else if (video.summary_status === 'failed') {
      newState.isNotAlreadyGenerating = { text: 'Previous generation failed - ready to retry', status: 'success' };
    } else {
      newState.isNotAlreadyGenerating = { text: 'No existing summary found', status: 'success' };
    }

    setValidationState(newState);

  }, [video, videoMeta, isLoadingMeta, isErrorMeta, generationStatus, isLoadingStatus, isErrorStatus]);

  const isAllValid = Object.values(validationState).every(step => step.status === 'success');

  return { validationState, isAllValid, isLoading: isLoadingMeta || isLoadingStatus };
};
