import React from "react";
import { useGenerateSummary } from "../../hooks/useGenerateSummary";
import VideoUrlForm from "../summaries/VideoUrlForm";
import VideoPreview from "../summaries/VideoPreview";
import ValidationStatus from "../summaries/ValidationStatus";
import QueryProvider from "../providers/QueryProvider";

const GenerateSummaryContent = () => {
  const { url, setUrl, validationStatus, videoPreview, isPreviewLoading, isSubmitting, canSubmit, handleSubmit } =
    useGenerateSummary();

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-8 pt-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
          Generate New Summary
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Enter a YouTube video URL below and we&apos;ll create a comprehensive summary with key insights, quotes, and
          analysis.
        </p>
      </div>

      {/* AI Disclaimer */}
      <div className="relative mx-3 sm:mx-4 lg:mx-auto lg:max-w-2xl mb-6 sm:mb-8 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/50 shadow-lg shadow-amber-100/50">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-bl from-amber-200/40 to-transparent rounded-full -translate-y-10 sm:-translate-y-14 translate-x-10 sm:translate-x-14"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-orange-200/40 to-transparent rounded-full translate-y-8 sm:translate-y-10 -translate-x-8 sm:-translate-x-10"></div>

        <div className="relative p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                🤖 Before You Generate
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  Please Read
                </span>
              </h3>

              <div className="space-y-3">
                <p className="text-gray-700 font-medium leading-relaxed">
                  AI-generated summaries are powerful learning tools, but they have limitations.
                </p>

                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-amber-100/50">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Important considerations:</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>AI may occasionally produce inaccurate or incomplete information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Summaries should not be used for critical decisions or professional advice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Always cross-reference with original sources for important information</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100/50">
                  <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pro tip: Use summaries to quickly understand content, then watch the original video for full
                    context.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
