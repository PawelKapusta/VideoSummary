import React from 'react';
import { useSummaryDetails } from '@/hooks/useSummaryDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLoader from '@/components/ui/AppLoader';
import { ArrowUpRight, AlertCircle, Clock, Loader2, CheckCircle } from 'lucide-react';
import QueryProvider from '@/components/providers/QueryProvider';

interface SummaryDetailsContentProps {
  summaryId: string;
}

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-yellow-700 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Summary Generation Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              Your summary generation request has been queued and will be processed shortly.
              Estimated wait time: 1-5 minutes depending on current queue length.
            </p>
            <div className="mt-3 text-sm text-yellow-600">
              <p>• The page will automatically update when processing begins</p>
              <p>• You can leave this page and return later</p>
            </div>
          </CardContent>
        </Card>
      );

    case 'in_progress':
      return (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700">
              We're currently analyzing the video content and generating your summary using AI.
              This process includes transcribing audio, extracting key points, and creating a comprehensive summary.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <span className="text-sm text-blue-700 font-medium">Processing...</span>
            </div>
            <div className="mt-3 text-sm text-blue-600">
              <p>Estimated completion: 2-8 minutes depending on video length and complexity</p>
              <p>• The page will automatically update when complete</p>
              <p>• You can safely navigate away and return to check progress</p>
            </div>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
};

const SummaryDetailsContent: React.FC<SummaryDetailsContentProps> = ({ summaryId }) => {
  const { data: summary, isLoading, isError, error } = useSummaryDetails(summaryId);

  if (isLoading) {
    return <AppLoader loadingText="Loading summary details..." />;
  }

  if (isError) {
    return (
      <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-center">
        <p className="text-red-700 font-medium">{error?.message || 'Failed to load summary details.'}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested summary could not be found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{summary.video.title}</h1>
            <p>Channel: {summary.channel.name}</p>
            {summary.video.published_at && (
              <p>Published: {new Date(summary.video.published_at).toLocaleDateString()}</p>
            )}
          </div>
          {summary.video.youtube_url && (
            <Button
              asChild
              size="lg"
              variant="destructive"
              className="self-start gap-2 rounded-full shadow-md hover:shadow-lg transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <a href={summary.video.youtube_url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2">
                Open video on YouTube
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </Button>
          )}
        </div>

        {/* Status indicator for all states */}
        <StatusIndicator status={summary.status} />

        {/* Show summary content only when completed and has content */}
        {summary.status === 'completed' && summary.tldr && (
          <Card>
            <CardHeader>
              <CardTitle>TL;DR</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{summary.tldr}</p>
            </CardContent>
          </Card>
        )}

        {/* Error state for failed summaries */}
        {summary.status === 'failed' && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Generation Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {summary.error_code === 'NO_SUBTITLES'
                  ? 'Unable to generate summary: No subtitles available for this video.'
                  : summary.error_code === 'VIDEO_TOO_LONG'
                    ? 'Video is too long to process.'
                    : `Error: ${summary.error_code || 'Unknown error'}`}
              </p>
            </CardContent>
          </Card>
        )}

        {summary.status === 'completed' && summary.full_summary && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Full Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div dangerouslySetInnerHTML={{ __html: summary.full_summary.detailed_summary || '' }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {summary.full_summary.key_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memorable Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {summary.full_summary.memorable_quotes.map((quote, index) => (
                    <li key={index} className="italic">"{quote}"</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conclusions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {summary.full_summary.conclusions.map((conclusion, index) => (
                    <li key={index}>{conclusion}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Genre</h4>
                  <p>{summary.full_summary.genre}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Duration</h4>
                  <p>{summary.full_summary.duration}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Language</h4>
                  <p>{summary.full_summary.language}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Recommendation</h4>
                  <p>{summary.full_summary.worth_watching}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};



interface SummaryDetailsViewProps {
  summaryId: string;
}

const SummaryDetailsView: React.FC<SummaryDetailsViewProps> = ({ summaryId }) => (
  <QueryProvider>
    <SummaryDetailsContent summaryId={summaryId} />
  </QueryProvider>
);

export default SummaryDetailsView;
