import React from 'react';
import type { VideoSummary } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VideoCardProps {
  video: VideoSummary;
  onGenerate: (video: VideoSummary) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onGenerate }) => {
  return (
    <Card className="flex flex-col group cursor-pointer overflow-hidden border-muted-foreground/20 hover:border-primary/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <CardHeader>
        {video.thumbnail_url && (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="rounded-t-lg object-cover aspect-video transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <CardTitle className="text-lg font-bold leading-tight mb-2">{video.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{video.channel.name}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-4">
        {video.summary_id ? (
          <>
            <Badge variant="secondary">Summary Available</Badge>
            <Button
              asChild
              size="sm"
              className="cursor-pointer transition-all hover:shadow-md"
            >
              <a href={`/summaries/${video.summary_id}`}>See Summary</a>
            </Button>
          </>
        ) : (
          <>
            <Badge variant="outline">No Summary</Badge>
            <Button
              onClick={() => onGenerate(video)}
              size="sm"
              className="cursor-pointer transition-all hover:shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Generate Summary
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default VideoCard;
