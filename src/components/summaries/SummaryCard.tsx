import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ThumbsUp, ThumbsDown, EyeOff, Clock, AlertCircle } from 'lucide-react';
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
  const displayText = summary.status === 'failed' 
    ? (summary.error_code === 'NO_SUBTITLES' ? 'No subtitles available' : 
       summary.error_code === 'VIDEO_TOO_LONG' ? 'Video too long for summarization' : 
       `Error: ${summary.error_code || 'Unknown error'}`) 
    : summary.tldr || 'No summary available';
  // Assume error_code is available in summary if failed; adjust type if needed

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onClick(summary.id)}>
      <CardHeader className="pb-2">
        <div className="relative aspect-video mb-2">
          <img
            src={summary.video.thumbnail_url || '/placeholder.svg'}
            alt={summary.video.title}
            className="w-full h-32 object-cover rounded-md"
            loading="lazy"
          />
          <Badge className="absolute top-2 right-2">{summary.status}</Badge>
        </div>
        <CardTitle className="text-lg line-clamp-1" onClick={(e) => e.stopPropagation()}>
          {summary.video.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-sm">
          <span>{summary.channel.name}</span>
          <Clock className="w-4 h-4" />
          <span>{summary.video.published_at ? format(new Date(summary.video.published_at), 'MMM dd, yyyy') : 'Unknown date'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">{displayText}</p>
        {isCompleted && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={userRating === true ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleRate(true); }}
                disabled={isRating}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                variant={userRating === false ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleRate(false); }}
                disabled={isRating}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
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
        {summary.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />}
      </CardContent>
    </Card>
  );
});

SummaryCard.displayName = 'SummaryCard'; // For debugging

export default SummaryCard;
