import React from 'react';
import type { SummaryWithVideo } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardProps {
  summary: SummaryWithVideo;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const { video, channel, tldr, generated_at } = summary;

  const formattedDate = generated_at ? new Date(generated_at).toLocaleDateString() : 'N/A';

  return (
    <a href={`/dashboard/${summary.id}`} className="block">
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader>
          <CardTitle className="text-lg">{video.title}</CardTitle>
          <CardDescription>
            {channel.name} &bull; {formattedDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {video.thumbnail_url && (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="rounded-lg w-full object-cover mb-4"
              width="1280"
              height="720"
            />
          )}
          <p className="text-sm text-muted-foreground">{tldr || 'No TL;DR available.'}</p>
        </CardContent>
      </Card>
    </a>
  );
};

export default SummaryCard;
