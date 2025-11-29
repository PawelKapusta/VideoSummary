import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const SummaryCardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thumbnail skeleton with 16:9 aspect ratio */}
        <Skeleton className="w-full aspect-video rounded-lg" />
        {/* TL;DR text lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCardSkeleton;
