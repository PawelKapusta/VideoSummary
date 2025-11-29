import React from 'react';
import type { SummaryWithVideo } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardProps {
  summary: SummaryWithVideo;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const { video, channel, tldr } = summary;

  const formattedDate = video.published_at 
    ? new Date(video.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Date unknown';

  return (
    <a 
      href={`/dashboard/${summary.id}`} 
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      aria-label={`View summary for ${video.title} by ${channel.name}`}
    >
      <Card className="hover:bg-muted/50 transition-colors h-full">
        <CardHeader>
          <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
          <CardDescription>
            {channel.name} &bull; {formattedDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {video.thumbnail_url && (
            <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-muted">
              <img
                src={video.thumbnail_url}
                alt={`Thumbnail for ${video.title}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {tldr || 'No TL;DR available yet.'}
          </p>
        </CardContent>
      </Card>
    </a>
  );
};

export default React.memo(SummaryCard);
