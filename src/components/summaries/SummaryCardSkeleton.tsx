import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';

const SummaryCardSkeleton: React.FC = () => {
  return (
    <Card className="h-full flex flex-col overflow-hidden border bg-card text-card-foreground shadow-sm">
      <CardHeader className="pb-2 space-y-3">
        {/* Thumbnail Skeleton */}
        <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted/20">
          <Skeleton className="h-full w-full" />
          {/* Badge Skeleton */}
          <Skeleton className="absolute top-2 right-2 h-5 w-16 rounded-full opacity-50" />
        </div>
        
        {/* Title Skeleton */}
        <div className="space-y-2">
           <Skeleton className="h-5 w-11/12" />
        </div>
        
        {/* Meta Skeleton (Channel + Date) */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-3 w-24" />
          <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 pb-4">
        {/* Summary Text Skeleton - 3 lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[95%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>

        {/* Actions Skeleton */}
        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-12 rounded-md" /> {/* Thumbs up/down group */}
            <Skeleton className="h-8 w-12 rounded-md" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" /> {/* Hide button */}
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCardSkeleton;
