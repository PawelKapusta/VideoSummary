import React from 'react';
import { useSummaryDetails } from '@/hooks/useSummaryDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import QueryProvider from '@/components/providers/QueryProvider';

interface SummaryDetailsContentProps {
  summaryId: string;
}

const SummaryDetailsContent: React.FC<SummaryDetailsContentProps> = ({ summaryId }) => {
  const { data: summary, isLoading, isError, error } = useSummaryDetails(summaryId);

  if (isLoading) {
    return <SummaryDetailsSkeleton />;
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error?.message || 'Failed to load summary details.'}</p>
        </CardContent>
      </Card>
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

        <Card>
          <CardHeader>
            <CardTitle>TL;DR</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{summary.tldr}</p>
          </CardContent>
        </Card>

        {summary.full_summary && (
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

const SummaryDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/5" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/5" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardContent>
      </Card>
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
