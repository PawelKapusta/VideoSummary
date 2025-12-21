import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ThumbsUp, ThumbsDown, EyeOff, Clock, AlertCircle, Languages, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { SummaryWithVideo, SummaryStatus, SummaryErrorCode } from '../../types';
import { useRating } from '../../hooks/useRating';
import { apiClient as api } from '../../lib/api';

interface Props {
  summary: SummaryWithVideo;
  onHide: (id: string) => void;
  onRate: (id: string, rating: boolean | null) => void;
  onClick: (id: string) => void;
  onRegenerate?: (summary: SummaryWithVideo) => void;
}

const SummaryCard: React.FC<Props> = React.memo(({ summary, onHide, onRate, onClick, onRegenerate }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [userRating, setUserRating] = useState(summary.user_rating);
  const { rateSummary, removeRating, isRating } = useRating(summary.id);

  const handleRate = (rating: boolean) => {
    if (isRating || summary.status !== 'completed') return;

    if (userRating === rating) {
      // Remove rating if clicking the same button
      removeRating();
      setUserRating(null);
      onRate(summary.id, null);
    } else {
      // Set new rating
      rateSummary(rating);
      setUserRating(rating);
      onRate(summary.id, rating);
    }
  };

  const handleHide = async () => {
    if (isHiding) return;
    setIsHiding(true);
    try {
      await api.post(`/api/summaries/${summary.id}/hide`);
      onHide(summary.id);
      setShowDialog(false);
      toast.success('Summary hidden');
    } catch (error) {
      toast.error('Failed to hide summary');
      console.error('Hide failed:', error);
    } finally {
      setIsHiding(false);
    }
  };

  const isCompleted = summary.status === 'completed';

  // Assume error_code is available in summary if failed; adjust type if needed

  return (
    <Card className="group flex flex-col cursor-pointer overflow-hidden border-muted-foreground/20 hover:border-primary/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" onClick={() => onClick(summary.id)}>
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={summary.video.thumbnail_url || '/placeholder.svg'}
          alt={summary.video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {(() => {
          const getStatusConfig = (status: string) => {
            // Elegant "Tech Pill" design: dark glass, round, with a glowing status dot
            const containerStyle = "absolute top-3 right-3 pl-2.5 pr-3 py-1.5 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl z-10 transition-all duration-300 group-hover:bg-black/80 group-hover:border-white/20";

            switch (status) {
              case 'completed':
                return {
                  container: containerStyle,
                  dot: "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-pulse-slow",
                  text: "text-[10px] font-bold text-emerald-100 tracking-widest uppercase",
                  label: "Completed"
                };
              case 'failed':
                return {
                  container: containerStyle,
                  dot: "w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]",
                  text: "text-[10px] font-bold text-rose-100 tracking-widest uppercase",
                  label: "Failed"
                };
              case 'processing':
                return {
                  container: containerStyle,
                  dot: "w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)] animate-pulse",
                  text: "text-[10px] font-bold text-blue-100 tracking-widest uppercase",
                  label: "Processing"
                };
              case 'pending':
                return {
                  container: containerStyle,
                  dot: "w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]",
                  text: "text-[10px] font-bold text-amber-100 tracking-widest uppercase",
                  label: "Pending"
                };
              default:
                return {
                  container: containerStyle,
                  dot: "w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.6)]",
                  text: "text-[10px] font-bold text-slate-100 tracking-widest uppercase",
                  label: status
                };
            }
          };

          const config = getStatusConfig(summary.status);

          return (
            <div className={config.container}>
              <div className={config.dot} />
              <span className={config.text}>{config.label}</span>
            </div>
          );
        })()}
      </div>

      <CardHeader className="pb-2 p-4 space-y-2">
        <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2" onClick={(e) => e.stopPropagation()}>
          {summary.video.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{summary.channel.name}</span>
        </CardDescription>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <div className="flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            <span>{summary.video.published_at ? format(new Date(summary.video.published_at), 'MMM dd, yyyy') : 'Unknown date'}</span>
          </div>
          {summary.summary_data && (
            <div className="flex items-center">
              <Languages className="mr-1 h-3 w-3" />
              <span>{summary.summary_data.language}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pt-0 pb-0 flex flex-col flex-1">
        {summary.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground bg-destructive/5 rounded-md border border-dashed border-destructive/20 flex-1 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm font-semibold text-foreground">
              Generation Failed
            </p>
            <p className="text-xs text-muted-foreground px-4 mt-1 mb-4">
              {summary.error_code === 'NO_SUBTITLES' ? 'Unable to generate summary: No subtitles available.' :
                summary.error_code === 'VIDEO_TOO_LONG' ? 'Video is too long to process.' :
                  `Error: ${summary.error_code || 'Unknown error'}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-red-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-all duration-300 font-bold"
                onClick={(e) => { e.stopPropagation(); onRegenerate?.(summary); }}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Try Again
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-all duration-300"
                onClick={(e) => { e.stopPropagation(); setShowDialog(true); }}
              >
                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                Hide
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-base text-foreground/80 line-clamp-4 mb-3 leading-relaxed">{summary.tldr || 'No summary available'}</p>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-xl transition-all duration-300 group/like ${userRating === true
                  ? 'bg-green-50 text-green-600 shadow-sm'
                  : 'text-muted-foreground hover:bg-green-50/80 hover:text-green-600'
                  }`}
                onClick={(e) => { e.stopPropagation(); handleRate(true); }}
                disabled={isRating}
              >
                <ThumbsUp className={`w-5 h-5 transition-transform duration-300 group-hover/like:scale-110 ${userRating === true ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-xl transition-all duration-300 group/dislike ${userRating === false
                  ? 'bg-red-50 text-red-600 shadow-sm'
                  : 'text-muted-foreground hover:bg-red-600 hover:text-red-600'
                  }`}
                onClick={(e) => { e.stopPropagation(); handleRate(false); }}
                disabled={isRating}
              >
                <ThumbsDown className={`w-5 h-5 transition-transform duration-300 group-hover/dislike:scale-110 ${userRating === false ? 'fill-current' : ''}`} />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-orange-600 hover:bg-orange-50/80 transition-all duration-300 group/hide"
              onClick={(e) => { e.stopPropagation(); setShowDialog(true); }}
            >
              <EyeOff className="w-5 h-5 transition-all duration-300 group-hover/hide:scale-110 group-hover/hide:rotate-6" />
            </Button>
          </div>
        )}

        {/* Hide Confirmation Dialog - always rendered to support both completed and failed states */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[500px]" onClick={(e) => e.stopPropagation()}>
            <DialogHeader className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                  <EyeOff className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">Hide This Summary</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">Remove from your dashboard</p>
                </div>
              </div>
              <DialogDescription className="text-base leading-relaxed">
                This summary will be completely hidden from your main dashboard view. The summary data remains safe and can be restored anytime from your settings.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-orange-100 rounded-md flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-orange-900 mb-2">What happens next?</p>
                    <ul className="space-y-1.5 text-orange-800">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0"></div>
                        Summary disappears from your dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0"></div>
                        Won't appear in regular search results
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0"></div>
                        Data is preserved and can be restored in Settings
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setShowDialog(false); }}
                className="flex-1 h-11"
              >
                Keep Visible
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); handleHide(); }}
                disabled={isHiding}
                className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium"
              >
                {isHiding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Hiding...
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide Summary
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
});

SummaryCard.displayName = 'SummaryCard'; // For debugging

export default SummaryCard;
