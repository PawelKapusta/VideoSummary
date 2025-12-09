import React from 'react';
import { useSummaryDetails } from '@/hooks/useSummaryDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{summary.video.title}</h1>
      <p>Channel: {summary.channel.name}</p>
      {summary.video.published_at && (
        <p>Published: {new Date(summary.video.published_at).toLocaleDateString()}</p>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>TL;DR</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{summary.tldr}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div dangerouslySetInnerHTML={{ __html: summary.full_summary?.summary || '' }} />
        </CardContent>
      </Card>

      {summary.full_summary?.key_points && (
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
      )}

      {summary.full_summary?.conclusions && (
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
      )}
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
