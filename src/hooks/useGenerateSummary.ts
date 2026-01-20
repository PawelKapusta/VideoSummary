import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDebounce } from "./useDebounce";
import type {
  ValidationStatusViewModel,
  VideoMetaResponse,
  GenerationStatusResponse,
  VideoPreviewViewModel,
  GenerateSummaryRequest,
  ApiError,
} from "../types";
import { fetchVideoMeta, fetchGenerationStatus, generateSummary } from "../lib/api";

const createInitialValidationStatus = (): ValidationStatusViewModel => ({
  isUrlValid: { text: "Valid YouTube URL", status: "pending" },
  isSubscribed: { text: "You are subscribed to the channel", status: "pending" },
  isDurationValid: { text: "Video is 45 minutes or less", status: "pending" },
  isWithinLimit: { text: "Within daily generation limit", status: "pending" },
  isNotAlreadyGenerating: { text: "Checking summary status", status: "pending" },
});

export function useGenerateSummary() {
  const [url, setUrl] = useState("");
  const debouncedUrl = useDebounce(url, 500);

  const {
    data: videoMeta,
    isFetching: isPreviewLoading,
    isError: isVideoMetaError,
    error: videoMetaError,
  } = useQuery<VideoMetaResponse, ApiError>({
    queryKey: ["videoMeta", debouncedUrl],
    queryFn: () => fetchVideoMeta(debouncedUrl),
    enabled: !!debouncedUrl && debouncedUrl.includes("youtube.com/watch?v="),
    retry: false,
  });

  const channelId = videoMeta?.channel.id;
  const isSubscribed = videoMeta?.is_subscribed;

  const {
    data: generationStatus,
    isFetching: isGenerationStatusFetching,
    isError: isGenerationStatusError,
    error: generationStatusError,
  } = useQuery<GenerationStatusResponse, ApiError>({
    queryKey: ["generationStatus", channelId],
    queryFn: () => fetchGenerationStatus(channelId!),
    enabled: !!channelId && !!isSubscribed,
    retry: false,
  });

  const { mutate: submit, isPending: isSubmitting } = useMutation<any, ApiError, GenerateSummaryRequest>({
    mutationFn: generateSummary,
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error(error.error?.message || "Failed to generate summary");
    },
  });

  const validationStatus = useMemo((): ValidationStatusViewModel => {
    const status = createInitialValidationStatus();

    if (!debouncedUrl) {
      return status;
    }

    // URL Validation
    if (isPreviewLoading) {
      status.isUrlValid.status = "checking";
    } else if (isVideoMetaError) {
      status.isUrlValid.status = "error";
      status.isUrlValid.error_message = videoMetaError?.error.message || "Invalid URL";
    } else if (videoMeta) {
      status.isUrlValid.status = "success";
    }

    if (videoMeta) {
      // Subscription Validation
      const isSubscribed = videoMeta.is_subscribed;
      status.isSubscribed.status = isSubscribed ? "success" : "error";
      if (!isSubscribed) {
        status.isSubscribed.error_message = "You must be subscribed to this channel.";
        // If not subscribed, we can't check the limit. Mark it as an error to provide clear feedback.
        status.isWithinLimit.status = "error";
        status.isWithinLimit.error_message = "Cannot check limit without a valid subscription.";
      }

      // Duration Validation
      const isDurationValid = videoMeta.duration_seconds <= 2700;
      status.isDurationValid.status = isDurationValid ? "success" : "error";
      if (!isDurationValid) {
        status.isDurationValid.error_message = "Video is longer than 45 minutes.";
      }

      // Generation Limit Validation - only runs if subscribed
      if (isSubscribed) {
        if (isGenerationStatusFetching) {
          status.isWithinLimit.status = "checking";
        } else if (isGenerationStatusError) {
          status.isWithinLimit.status = "error";
          status.isWithinLimit.error_message = generationStatusError?.error.message || "Could not check limit.";
        } else if (generationStatus) {
          status.isWithinLimit.status = generationStatus.can_generate ? "success" : "error";
          if (!generationStatus.can_generate) {
            status.isWithinLimit.error_message = "Daily generation limit reached for this channel.";
          }
        }
      }

      // Summary existence check - only runs if subscribed
      if (isSubscribed) {
        const summaryStatus = videoMeta.summary_status;
        if (summaryStatus === "completed") {
          status.isNotAlreadyGenerating.status = "error";
          status.isNotAlreadyGenerating.error_message = "This video already has a completed summary.";
        } else if (summaryStatus === "pending" || summaryStatus === "in_progress") {
          status.isNotAlreadyGenerating.status = "error";
          status.isNotAlreadyGenerating.error_message = "This video already has a summary in progress.";
        } else if (summaryStatus === "failed") {
          status.isNotAlreadyGenerating.status = "success";
          status.isNotAlreadyGenerating.text = "Previous generation failed - ready to retry";
        } else {
          status.isNotAlreadyGenerating.status = "success";
        }
      }
    } else {
      // If there's no videoMeta yet, but we are not loading and there's no error, it means the URL is invalid.
      if (!isPreviewLoading && debouncedUrl) {
        status.isUrlValid.status = "error";
        status.isUrlValid.error_message = "Invalid or unsupported YouTube video URL.";
      }
    }

    return status;
  }, [
    debouncedUrl,
    isPreviewLoading,
    isVideoMetaError,
    videoMetaError,
    videoMeta,
    isGenerationStatusFetching,
    isGenerationStatusError,
    generationStatus,
    generationStatusError,
  ]);

  const videoPreview = useMemo((): VideoPreviewViewModel | null => {
    if (!videoMeta) return null;
    return {
      title: videoMeta.title,
      channelName: videoMeta.channel.name,
      thumbnailUrl: videoMeta.thumbnail_url,
      durationInMinutes: Math.round(videoMeta.duration_seconds / 60),
    };
  }, [videoMeta]);

  const canSubmit = useMemo(() => {
    return Object.values(validationStatus).every((v) => v.status === "success");
  }, [validationStatus]);

  const handleSubmit = () => {
    if (canSubmit) {
      submit({ video_url: url });
    }
  };

  return {
    url,
    setUrl,
    validationStatus,
    videoPreview,
    isPreviewLoading,
    isSubmitting,
    canSubmit,
    handleSubmit,
  };
}
