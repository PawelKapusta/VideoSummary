import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';

const FuturisticSkeleton: React.FC = () => {
  return (
    <Card className="h-full flex flex-col overflow-hidden border bg-card text-card-foreground shadow-sm relative">
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gray-500/30 to-transparent animate-shimmer" />
      <CardHeader className="pb-2 space-y-3 bg-transparent">
        <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted/20">
          <div className="h-full w-full bg-muted/30" />
          <div className="absolute top-2 right-2 h-5 w-16 rounded-full opacity-50 bg-muted/40" />
        </div>
        
        <div className="space-y-2">
           <div className="h-5 w-11/12 bg-muted/30 rounded-md" />
        </div>
        
        <div className="flex items-center gap-2 pt-1">
          <div className="h-3 w-24 bg-muted/30 rounded-md" />
          <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
          <div className="h-3 w-20 bg-muted/30 rounded-md" />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 pb-4 bg-transparent">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted/30 rounded-md" />
          <div className="h-4 w-[95%] bg-muted/30 rounded-md" />
          <div className="h-4 w-[80%] bg-muted/30 rounded-md" />
        </div>

        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="flex gap-2">
            <div className="h-8 w-12 rounded-md bg-muted/30" />
            <div className="h-8 w-12 rounded-md bg-muted/30" />
          </div>
          <div className="h-8 w-8 rounded-md bg-muted/30" />
        </div>
      </CardContent>
    </Card>
  );
};

export default FuturisticSkeleton;
