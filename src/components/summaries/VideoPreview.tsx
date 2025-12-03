import React from 'react';
import type { VideoPreviewViewModel } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface VideoPreviewProps {
  video: VideoPreviewViewModel | null;
  isLoading: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ video, isLoading }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="w-full h-40 rounded-md" />
          <Skeleton className="w-3/4 h-6" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      );
    }

    if (!video) {
      return (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Enter a video URL to see a preview.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full rounded-md" />
        <div>
          <h3 className="font-semibold text-lg">{video.title}</h3>
          <p className="text-sm text-muted-foreground">{video.channelName}</p>
          <p className="text-sm text-muted-foreground">{video.durationInMinutes} minutes</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Video Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default VideoPreview;
