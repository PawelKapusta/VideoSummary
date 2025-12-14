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
    <Card
      onClick={() => {
        if (video.summary_id) {
          window.location.href = `/summaries/${video.summary_id}`;
        } else {
          onGenerate(video);
        }
      }}
      className="flex flex-col group cursor-pointer overflow-hidden border-muted-foreground/20 hover:border-primary/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
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
        <CardTitle className="text-lg font-bold leading-tight mb-2 line-clamp-2">{video.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{video.channel.name}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-4 mt-auto">
        {video.summary_id ? (
          <>
            <Badge
              variant="secondary"
              className="pl-2.5 pr-3 py-1.5 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-300 group-hover:bg-black/80 group-hover:border-white/20"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-pulse-slow"></div>
              <span className="text-[10px] font-bold text-emerald-100 tracking-widest uppercase">Summary Available</span>
            </Badge>
            <span className="text-sm font-medium text-black group-hover:text-gray-700 group-hover:underline decoration-gray-400/60 underline-offset-4 flex items-center gap-1 transition-colors">
              See Summary
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </span>
          </>
        ) : (
          <>
            <Badge
              variant="outline"
              className="pl-2.5 pr-3 py-1.5 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-300 group-hover:bg-black/80 group-hover:border-white/20"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"></div>
              <span className="text-[10px] font-bold text-amber-100 tracking-widest uppercase">No Summary</span>
            </Badge>
            <span className="text-sm font-medium text-black group-hover:text-gray-700 group-hover:underline decoration-gray-400/60 underline-offset-4 flex items-center gap-1 transition-colors">
              Generate Summary
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </span>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default VideoCard;
