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
    <div className="container mx-auto p-4 max-w-2xl space-y-8 pt-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
          Generate New Summary
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Enter a YouTube video URL below and we'll create a comprehensive summary with key insights, quotes, and analysis.
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
