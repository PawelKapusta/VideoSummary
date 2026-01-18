import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Eye, EyeOff, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useHiddenSummaries } from '../../hooks/useHiddenSummaries';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../../lib/api';
import type { SummaryWithVideo } from '../../types';
import AppLoader from '../ui/AppLoader';

const HiddenSummariesSection = () => {
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useHiddenSummaries();
  const queryClient = useQueryClient();
  const [unhidingIds, setUnhidingIds] = useState<Set<string>>(new Set());

  const hiddenSummaries = data?.pages.flatMap((page: any) => page.data) || [];

  const handleUnhide = async (summaryId: string) => {
    if (unhidingIds.has(summaryId)) return;

    setUnhidingIds(prev => new Set(prev).add(summaryId));

    try {
      await api.delete(`/api/summaries/${summaryId}/hide`);
      // Invalidate both hidden summaries and regular summaries queries
      await queryClient.invalidateQueries({ queryKey: ['hiddenSummaries'] });
      await queryClient.invalidateQueries({ queryKey: ['summaries'] });
      toast.success('Summary restored to your dashboard');
    } catch (error) {
      toast.error('Failed to unhide summary');
      console.error('Unhide failed:', error);
    } finally {
      setUnhidingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(summaryId);
        return newSet;
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-emerald-100 text-emerald-800',
          label: 'Completed'
        };
      case 'failed':
        return {
          color: 'bg-rose-100 text-rose-800',
          label: 'Failed'
        };
      case 'in_progress':
        return {
          color: 'bg-blue-100 text-blue-800',
          label: 'Processing'
        };
      case 'pending':
        return {
          color: 'bg-amber-100 text-amber-800',
          label: 'Pending'
        };
      default:
        return {
          color: 'bg-slate-100 text-slate-800',
          label: status
        };
    }
  };

  if (isLoading && hiddenSummaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            Hidden Summaries
          </CardTitle>
          <CardDescription>
            View and manage summaries you've hidden from your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppLoader loadingText="Loading hidden summaries..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            Hidden Summaries
          </CardTitle>
          <CardDescription>
            View and manage summaries you've hidden from your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load hidden summaries</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['hidden-summaries'] })}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeOff className="h-5 w-5" />
          Hidden Summaries
          {hiddenSummaries.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {hiddenSummaries.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          View and manage summaries you've hidden from your dashboard. You can restore them anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hiddenSummaries.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hidden summaries</p>
            <p className="text-sm text-muted-foreground mt-2">
              Summaries you hide from your dashboard will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hiddenSummaries.map((summary: SummaryWithVideo) => {
              const statusConfig = getStatusConfig(summary.status);
              const isUnhiding = unhidingIds.has(summary.id);

              return (
                <div
                  key={summary.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium truncate">{summary.video.title}</h4>
                      <Badge className={statusConfig.color} variant="secondary">
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{summary.channel.name}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{summary.video.published_at ? format(new Date(summary.video.published_at), 'MMM dd, yyyy') : 'Unknown date'}</span>
                      </div>
                    </div>
                    {summary.tldr && (
                      <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
                        {summary.tldr}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isUnhiding}>
                          {isUnhiding ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Unhide
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Restore Summary</DialogTitle>
                          <DialogDescription>
                            This summary will be restored to your main dashboard and will appear in your regular view.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={(e) => { e.stopPropagation(); }}>
                            Cancel
                          </Button>
                          <Button onClick={(e) => { e.stopPropagation(); handleUnhide(summary.id); }} disabled={isUnhiding}>
                            {isUnhiding ? 'Restoring...' : 'Restore'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}

            {hasNextPage && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HiddenSummariesSection;
