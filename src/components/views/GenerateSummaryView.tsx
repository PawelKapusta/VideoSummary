import React from 'react';
import { useGenerateSummary } from '../../hooks/useGenerateSummary';
import VideoUrlForm from '../summaries/VideoUrlForm';
import VideoPreview from '../summaries/VideoPreview';
import ValidationStatus from '../summaries/ValidationStatus';
import QueryProvider from '../providers/QueryProvider';

const GenerateSummaryContent = () => {
  const {
    url,
    setUrl,
    validationStatus,
    videoPreview,
    isPreviewLoading,
    isSubmitting,
    canSubmit,
    handleSubmit,
  } = useGenerateSummary();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Generate New Summary</h1>
        <p className="text-muted-foreground mt-2">
          Enter a YouTube video URL to generate a summary.
        </p>
      </div>
      <VideoUrlForm
        url={url}
        onUrlChange={setUrl}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
      />
      <div className="space-y-8">
        <ValidationStatus status={validationStatus} />
        <VideoPreview video={videoPreview} isLoading={isPreviewLoading} />
      </div>
    </div>
  );
};

const GenerateSummaryView = () => (
  <QueryProvider>
    <GenerateSummaryContent />
  </QueryProvider>
);


export default GenerateSummaryView;
