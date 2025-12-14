import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ThumbsUp, ThumbsDown, EyeOff, Clock, AlertCircle, Languages } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { SummaryWithVideo, SummaryStatus, SummaryErrorCode } from '../../types';
import { apiClient as api } from '../../lib/api';

interface Props {
  summary: SummaryWithVideo;
  onHide: (id: string) => void;
  onRate: (id: string, rating: boolean) => void;
  onClick: (id: string) => void;
}

const SummaryCard: React.FC<Props> = React.memo(({ summary, onHide, onRate, onClick }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [userRating, setUserRating] = useState(summary.user_rating);
  const [isRating, setIsRating] = useState(false);

  const handleRate = async (rating: boolean) => {
    if (isRating || summary.status !== 'completed') return;
    setIsRating(true);
    try {
      await api.post(`/api/summaries/${summary.id}/rate`, { rating });
      onRate(summary.id, rating);
      setUserRating(rating);
      toast.success(rating ? 'Upvoted!' : 'Downvoted!');
    } catch (error) {
      toast.error('Failed to submit rating');
      console.error('Rating failed:', error);
    } finally {
      setIsRating(false);
    }
  };

  const handleHide = async () => {
    if (isHiding) return;
    setIsHiding(true);
    try {
      await api.post('/api/summaries/hide', { summary_id: summary.id });
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
        <Badge
          variant={summary.status === 'completed' ? "default" : "secondary"}
          className="absolute top-2 right-2 text-xs font-semibold shadow-md z-10 backdrop-blur-md bg-opacity-90"
        >
          {summary.status.toUpperCase()}
        </Badge>
      </div>

      <CardHeader className="flex-grow pb-2 p-4 space-y-2">
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

      <CardContent className="p-4 pt-0">
        {summary.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground bg-destructive/5 rounded-md border border-dashed border-destructive/20 h-full">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm font-semibold text-foreground">
              Generation Failed
            </p>
            <p className="text-xs text-muted-foreground px-4 mt-1">
              {summary.error_code === 'NO_SUBTITLES' ? 'Unable to generate summary: No subtitles available.' :
                summary.error_code === 'VIDEO_TOO_LONG' ? 'Video is too long to process.' :
                  `Error: ${summary.error_code || 'Unknown error'}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-foreground/80 line-clamp-3 mb-4 leading-relaxed">{summary.tldr || 'No summary available'}</p>
        )}

        {isCompleted && (
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
            <div className="flex gap-2">
              <Button
                variant={userRating === true ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 hover:text-green-600 hover:bg-green-50"
                onClick={(e) => { e.stopPropagation(); handleRate(true); }}
                disabled={isRating}
              >
                <ThumbsUp className={`w-4 h-4 ${userRating === true ? 'fill-current text-green-600' : ''}`} />
              </Button>
              <Button
                variant={userRating === false ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                onClick={(e) => { e.stopPropagation(); handleRate(false); }}
                disabled={isRating}
              >
                <ThumbsDown className={`w-4 h-4 ${userRating === false ? 'fill-current text-red-600' : ''}`} />
              </Button>
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                  <EyeOff className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Hide Summary</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to hide this summary? It will no longer appear in your list unless you unhide it.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleHide} disabled={isHiding}>
                    {isHiding ? 'Hiding...' : 'Hide'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

      </CardContent>
    </Card>
  );
});

SummaryCard.displayName = 'SummaryCard'; // For debugging

export default SummaryCard;
