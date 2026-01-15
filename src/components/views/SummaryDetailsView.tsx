import React, { useState, useEffect, useRef } from 'react';
import { useSummaryDetails } from '@/hooks/useSummaryDetails';
import { useRating } from '@/hooks/useRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLoader from '@/components/ui/AppLoader';
import TypewriterAnimation from '@/components/ui/typewriter-animation';
import EnhancedProgressBar from '@/components/ui/EnhancedProgressBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateSummary } from '@/lib/api';
import GenerateSummaryDialog from '@/components/views/videos/GenerateSummaryDialog';
import type { VideoSummary, DetailedSummary } from '@/types';
import { toast } from 'sonner';
import QueryProvider from '@/components/providers/QueryProvider';
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValueEvent } from 'framer-motion';
import { ArrowUpRight, AlertCircle, Clock, Loader2, CheckCircle, ThumbsUp, ThumbsDown, Calendar, User, Play, Star, TrendingUp, BarChart3, Share2, Copy, MessageSquare, FileText, Link, Film, Timer, Globe, Award, Sparkles, Maximize2, EyeOff, RefreshCw } from 'lucide-react';
import NotFound from '@/components/shared/NotFound';

interface SummaryDetailsContentProps {
  summaryId: string;
}

// Utility function for copying to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch (err) {
    toast.error('Failed to copy to clipboard');
  }
};


// Scroll Progress Indicator Component with Direction Detection
const ScrollProgress: React.FC = () => {
  const { scrollYProgress, scrollY } = useScroll();
  const [scrollDirection, setScrollDirection] = useState("up");
  const [isVisible, setIsVisible] = useState(true);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious();
    if (previous !== undefined) {
      const diff = current - previous;
      const newDirection = diff > 0 ? "down" : "up";
      setScrollDirection(newDirection);

      // Hide/show progress bar based on scroll direction and position
      if (current > 100 && newDirection === "down") {
        setIsVisible(false);
      } else if (newDirection === "up") {
        setIsVisible(true);
      }
    }
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 origin-left z-50"
      style={{
        scaleX,
        y: isVisible ? 0 : -4,
        opacity: isVisible ? 1 : 0
      }}
      animate={{
        background: scrollDirection === "down"
          ? "linear-gradient(to right, #3b82f6, #8b5cf6)"
          : "linear-gradient(to right, #10b981, #06b6d4)"
      }}
      transition={{ duration: 0.3 }}
    />
  );
};

// Animated Video Header Component with Parallax
const VideoHeader: React.FC<{
  video: { title: string; thumbnail_url: string | null; youtube_url: string; published_at: string | null };
  channel: { name: string };
  generated_at: string | null;
  is_hidden?: boolean;
  status: string;
}> = ({ video, channel, generated_at, is_hidden, status }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Parallax effect for background elements
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const gradientY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8 text-white shadow-2xl w-full"
    >
      {/* Background Pattern with Parallax */}
      <motion.div className="absolute inset-0 opacity-10" style={{ y: backgroundY }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-500/20 to-transparent rounded-full blur-3xl"
          style={{ y: gradientY }}
        />
      </motion.div>

      <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
        <div className="w-full lg:flex-1 space-y-3 sm:space-y-4">
          <div className="flex items-start gap-3 sm:gap-4 lg:gap-6 w-full">
            {video.thumbnail_url && (
              <div className="relative shrink-0 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="h-16 w-16 sm:h-20 sm:w-20 lg:h-28 lg:w-28 rounded-xl object-cover shadow-2xl"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2 sm:space-y-3 animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-200">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent break-words">
                {video.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-slate-300 w-full">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm animate-in fade-in-0 duration-300 delay-400">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-medium truncate">{channel.name}</span>
                </div>
                {video.published_at && (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm animate-in fade-in-0 duration-300 delay-500">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{new Date(video.published_at).toLocaleDateString()}</span>
                    <span className="sm:hidden">{new Date(video.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                  </div>
                )}
                {generated_at && status === 'completed' && (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm animate-in fade-in-0 duration-300 delay-600">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Generated {new Date(generated_at).toLocaleDateString()}</span>
                    <span className="sm:hidden">Gen {new Date(generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                  </div>
                )}
                {is_hidden && (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-rose-500/20 text-rose-300 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm animate-in fade-in-0 duration-300 delay-700 border border-rose-500/30">
                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="font-bold">HIDDEN</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {video.youtube_url && (
          <div className="sm:flex-shrink-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-700">
            <Button
              asChild
              size="lg"
              className="w-full gap-2 sm:gap-3 bg-red-600 hover:bg-red-700 hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-red-500/25 sm:w-auto group text-sm sm:text-base"
            >
              <a href={video.youtube_url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2">
                <Play className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse" />
                <span className="hidden sm:inline">Watch on YouTube</span>
                <span className="sm:hidden">Watch</span>
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Compact Status Indicator
const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
          <Clock className="h-4 w-4" />
          <div className="text-sm">
            <span className="font-medium">Queued for processing</span>
            <span className="text-yellow-600"> • Updates automatically</span>
          </div>
        </div>
      );

    case 'in_progress':
      return (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          <div className="text-sm">
            <span className="font-medium">Generating summary...</span>
            <span className="text-blue-600"> • ~2-4 minutes remaining</span>
          </div>
        </div>
      );

    default:
      return null;
  }
};

// Sidebar Component
const SummarySidebar: React.FC<{
  summaryId: string;
  status: string;
  rating_stats: { upvotes: number; downvotes: number };
  user_rating: boolean | null;
  full_summary: any;
  error_code: string | null;
  tldr?: string | null;
}> = ({ summaryId, status, rating_stats, user_rating, full_summary, error_code, tldr }) => {
  const { rateSummary, removeRating, isRating } = useRating(summaryId);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (user_rating !== null && hasInteracted) {
      setShowConfirmation(true);
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [user_rating, hasInteracted]);

  const handleRating = (rating: boolean) => {
    setHasInteracted(true);
    if (user_rating === rating) {
      // Remove rating if clicking the same button
      removeRating();
    } else {
      // Set new rating
      rateSummary(rating);
    }
  };

  return (
    <div className="space-y-6">
      {/* Processing Status - Clean & Intuitive */}
      <div className={`${status === 'completed' ? 'md:block hidden' : ''} bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-300`}>
        <div className="p-6">
          <div className="flex items-center gap-4">
            {status === 'completed' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900">Ready</p>
                  <p className="text-sm text-slate-600">Summary available</p>
                </div>
              </>
            ) : status === 'failed' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900">Failed</p>
                  <p className="text-sm text-slate-600">
                    {error_code === 'NO_SUBTITLES' ? 'No captions available' :
                      error_code === 'VIDEO_TOO_LONG' ? 'Video too long' :
                        'Processing error'}
                  </p>
                </div>
              </>
            ) : status === 'pending' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Queued</p>
                  <p className="text-sm text-slate-600">Waiting to process</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Processing</p>
                  <p className="text-sm text-slate-600">~2-4 minutes remaining</p>
                  <div className="mt-3">
                    <EnhancedProgressBar
                      progress={65}
                      variant="glow"
                      color="blue"
                      height="h-3"
                      duration={3}
                      showPercentage={false}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Community Rating - Premium Design */}
      {status === 'completed' && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden relative">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 opacity-0 hover:opacity-100 transition-opacity duration-700" />

          <div className="relative p-4">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-1">
                Community Rating
              </h3>
              <p className="text-xs text-slate-600">Help improve our summaries with your feedback</p>
            </div>

            {/* Rating Stats - Premium Animated Design */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Likes Counter */}
              <div className="group relative">
                {/* Animated background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-emerald-300/20 to-emerald-200/10 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-100/40 opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-100 rounded-2xl" />

                {/* Floating particles effect */}
                <div className="absolute -top-2 -right-2 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-emerald-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300 delay-150" />

                <div className="relative text-center p-3 bg-gradient-to-br from-emerald-50/30 via-white to-emerald-50/20 rounded-2xl border border-emerald-200/40 group-hover:border-emerald-400/60 group-hover:shadow-xl group-hover:shadow-emerald-500/15 transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:-translate-y-1">
                  {/* Icon with enhanced animation */}
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-300 flex items-center justify-center mx-auto shadow-lg group-hover:shadow-2xl group-hover:shadow-emerald-500/30 group-hover:scale-110 transition-all duration-500 ease-out group-hover:rotate-12">
                      <ThumbsUp className="h-6 w-6 text-emerald-700 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-emerald-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Animated counter */}
                  <div className="relative mb-1">
                    <div className="text-3xl font-black text-emerald-600 group-hover:text-emerald-800 transition-colors duration-300 animate-pulse group-hover:animate-bounce">
                      {rating_stats.upvotes}
                    </div>
                    {/* Counter glow */}
                    <div className="absolute inset-0 text-3xl font-black text-emerald-400/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {rating_stats.upvotes}
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-600 group-hover:text-emerald-700 transition-colors duration-300 uppercase tracking-wider">
                    Likes
                  </div>

                  {/* Progress bar effect */}
                  <div className="mt-3 h-1 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out group-hover:from-emerald-500 group-hover:to-emerald-600"
                      style={{
                        width: `${Math.min((rating_stats.upvotes / (rating_stats.upvotes + rating_stats.downvotes || 1)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Dislikes Counter */}
              <div className="group relative">
                {/* Animated background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 via-red-300/20 to-red-200/10 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-100/40 opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-100 rounded-2xl" />

                {/* Floating particles effect */}
                <div className="absolute -top-2 -left-2 w-2 h-2 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
                <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-red-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300 delay-150" />

                <div className="relative text-center p-3 bg-gradient-to-br from-red-50/30 via-white to-red-50/20 rounded-2xl border border-red-200/40 group-hover:border-red-400/60 group-hover:shadow-xl group-hover:shadow-red-500/15 transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:-translate-y-1">
                  {/* Icon with enhanced animation */}
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 via-red-200 to-red-300 flex items-center justify-center mx-auto shadow-lg group-hover:shadow-2xl group-hover:shadow-red-500/30 group-hover:scale-110 transition-all duration-500 ease-out group-hover:-rotate-12">
                      <ThumbsDown className="h-6 w-6 text-red-700 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-red-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Animated counter */}
                  <div className="relative mb-1">
                    <div className="text-3xl font-black text-red-600 group-hover:text-red-800 transition-colors duration-300 animate-pulse group-hover:animate-bounce">
                      {rating_stats.downvotes}
                    </div>
                    {/* Counter glow */}
                    <div className="absolute inset-0 text-3xl font-black text-red-400/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {rating_stats.downvotes}
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-600 group-hover:text-red-700 transition-colors duration-300 uppercase tracking-wider">
                    Dislikes
                  </div>

                  {/* Progress bar effect */}
                  <div className="mt-3 h-1 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-1000 ease-out group-hover:from-red-500 group-hover:to-red-600"
                      style={{
                        width: `${Math.min((rating_stats.downvotes / (rating_stats.upvotes + rating_stats.downvotes || 1)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Actions - Premium Design */}
            <div className="space-y-3">
              <div className="text-center">
                <h4 className="text-base font-semibold text-slate-800 mb-1">Share Your Opinion</h4>
                <p className="text-xs text-slate-600">Help the community by rating this summary</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant={user_rating === true ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleRating(true)}
                  disabled={isRating}
                  className={`flex-1 gap-2 h-9 text-sm font-semibold transition-all duration-300 rounded-xl ${user_rating === true
                    ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-700 text-white border-emerald-400 shadow-xl hover:shadow-emerald-400/40 hover:shadow-2xl hover:scale-105'
                    : 'border-2 border-slate-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:via-emerald-100/50 hover:to-emerald-50 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-400/20 hover:scale-102'
                    }`}
                >
                  <ThumbsUp className={`h-4 w-4 transition-transform duration-300 ${user_rating === true ? 'scale-110' : ''}`} />
                  Like
                </Button>
                <Button
                  variant={user_rating === false ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleRating(false)}
                  disabled={isRating}
                  className={`flex-1 gap-2 h-9 text-sm font-semibold transition-all duration-300 rounded-xl ${user_rating === false
                    ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white border-red-500 shadow-xl hover:shadow-red-500/40 hover:shadow-2xl hover:scale-105'
                    : 'border-2 border-slate-300 hover:bg-gradient-to-r hover:from-red-50 hover:via-red-100/50 hover:to-red-50 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/20 hover:scale-102'
                    }`}
                >
                  <ThumbsDown className={`h-4 w-4 transition-transform duration-300 ${user_rating === false ? 'scale-110' : ''}`} />
                  Dislike
                </Button>
              </div>

              {showConfirmation && user_rating !== null && (
                <div className="text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-300 ${user_rating
                    ? 'bg-gradient-to-r from-emerald-100 via-emerald-50 to-emerald-100 text-emerald-800 border-2 border-emerald-300/50'
                    : 'bg-gradient-to-r from-red-100 via-red-50 to-red-100 text-red-800 border-2 border-red-300/50'
                    }`}>
                    <div className={`w-3 h-3 rounded-full ${user_rating ? 'bg-emerald-500' : 'bg-red-500'
                      } animate-pulse shadow-sm`} />
                    <span className="animate-in fade-in-0 duration-300 delay-100">
                      {user_rating ? 'Thanks for the positive feedback!' : 'Thanks for your feedback'}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${user_rating ? 'bg-emerald-400' : 'bg-red-400'
                      } animate-ping`} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Details - Clean / Editorial */}
      {status === 'completed' && full_summary && (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Film className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Video Details</h3>
                <p className="text-sm text-slate-600">Content analysis and metadata</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200/60 overflow-hidden bg-gradient-to-b from-slate-50/20 to-white">
              <dl className="divide-y divide-slate-100/80">
                {/* Genre */}
                <div className="group p-4 sm:p-6 hover:bg-gradient-to-r hover:from-purple-50/40 hover:to-slate-50/60 transition-all duration-300 animate-in fade-in-0 slide-in-from-left-2 duration-500">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 h-10 w-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                      <Sparkles className="h-4 w-4 text-purple-700" />
                    </div>

                    <div className="min-w-0 flex-1 grid gap-2 sm:grid-cols-[minmax(0,1fr),auto] sm:items-start">
                      <div className="min-w-0">
                        <dt className="text-base font-semibold text-slate-900 leading-tight group-hover:text-purple-900 transition-colors duration-200">Genre</dt>
                        <p className="mt-1 text-sm text-slate-500 leading-tight">Category classification</p>
                      </div>
                      <dd className="sm:text-right">
                        <span className="mt-1 inline-flex max-w-full whitespace-normal rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 px-3 py-1.5 text-sm font-semibold text-purple-900 border border-purple-200/50 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                          {full_summary.genre}
                        </span>
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="group p-4 sm:p-6 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-slate-50/60 transition-all duration-300 animate-in fade-in-0 slide-in-from-left-2 duration-500 delay-75">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                      <Timer className="h-4 w-4 text-blue-700" />
                    </div>

                    <div className="min-w-0 flex-1 grid gap-2 sm:grid-cols-[minmax(0,1fr),auto] sm:items-start">
                      <div className="min-w-0">
                        <dt className="text-base font-semibold text-slate-900 leading-tight group-hover:text-blue-900 transition-colors duration-200">Duration</dt>
                        <p className="mt-1 text-sm text-slate-500 leading-tight">Length & runtime</p>
                      </div>
                      <dd className="sm:text-right">
                        <span className="mt-1 inline-flex max-w-full whitespace-normal rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-900 border border-blue-200/50 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                          {full_summary.duration}
                        </span>
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Language */}
                <div className="group p-4 sm:p-6 hover:bg-gradient-to-r hover:from-green-50/40 hover:to-slate-50/60 transition-all duration-300 animate-in fade-in-0 slide-in-from-left-2 duration-500 delay-150">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 h-10 w-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                      <Globe className="h-4 w-4 text-green-700" />
                    </div>

                    <div className="min-w-0 flex-1 grid gap-2 sm:grid-cols-[minmax(0,1fr),auto] sm:items-start">
                      <div className="min-w-0">
                        <dt className="text-base font-semibold text-slate-900 leading-tight group-hover:text-green-900 transition-colors duration-200">Language</dt>
                        <p className="mt-1 text-sm text-slate-500 leading-tight">Audio & subtitles</p>
                      </div>
                      <dd className="sm:text-right">
                        <span className="mt-1 inline-flex max-w-full whitespace-normal rounded-lg bg-gradient-to-r from-green-50 to-green-100 px-3 py-1.5 text-sm font-semibold text-green-900 border border-green-200/50 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                          {full_summary.language}
                        </span>
                      </dd>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="group p-4 sm:p-6 hover:bg-gradient-to-r hover:from-orange-50/40 hover:to-slate-50/60 transition-all duration-300 animate-in fade-in-0 slide-in-from-left-2 duration-500 delay-200">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 h-10 w-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                      <Award className="h-4 w-4 text-orange-700" />
                    </div>

                    <div className="min-w-0 flex-1 grid gap-2 sm:grid-cols-[minmax(0,1fr),auto] sm:items-start">
                      <div className="min-w-0">
                        <dt className="text-base font-semibold text-slate-900 leading-tight group-hover:text-orange-900 transition-colors duration-200">Recommendation</dt>
                        <p className="mt-1 text-sm text-slate-500 leading-tight">Watch verdict</p>
                      </div>
                      <dd className="sm:text-right">
                        <span
                          className={`mt-1 inline-flex max-w-full whitespace-normal rounded-lg border px-3 py-1.5 text-sm font-semibold shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 ${full_summary.worth_watching === 'Must watch'
                            ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-200'
                            : full_summary.worth_watching === 'Worth watching'
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200'
                              : full_summary.worth_watching === 'Watch only if you have time'
                                ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-200'
                                : 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200'
                            }`}
                        >
                          {full_summary.worth_watching}
                        </span>
                      </dd>
                    </div>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics - Enhanced Content Overview */}
      {status === 'completed' && full_summary && (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Key Metrics</h3>
                <p className="text-sm text-slate-600">Content overview and insights</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Key Points Metric */}
              <div className="group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-emerald-300/20 to-emerald-200/10 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-100/30 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
                <div className="relative flex justify-between items-center p-5 bg-gradient-to-r from-emerald-50/30 to-white rounded-xl border border-emerald-200/50 group-hover:border-emerald-400 group-hover:shadow-xl group-hover:shadow-emerald-500/10 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:shadow-emerald-500/25 group-hover:scale-110 transition-all duration-400 ease-out group-hover:rotate-6">
                      <CheckCircle className="h-6 w-6 text-emerald-700 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="transition-transform duration-400 ease-out group-hover:translate-x-1">
                      <span className="text-base font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors duration-300">Key Points</span>
                      <p className="text-xs text-slate-600 group-hover:text-emerald-700 transition-colors duration-300">Essential takeaways</p>
                    </div>
                  </div>
                  <div className="text-right transition-transform duration-400 ease-out group-hover:-translate-x-1">
                    <div className="text-3xl font-bold text-emerald-600 group-hover:text-emerald-800 group-hover:scale-110 transition-all duration-300 animate-pulse group-hover:animate-bounce">
                      {full_summary.key_points.length}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide group-hover:text-emerald-600 transition-colors duration-300">points</div>
                  </div>
                </div>
              </div>

              {/* Quotes Metric */}
              <div className="group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-amber-300/20 to-amber-200/10 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 to-amber-100/30 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
                <div className="relative flex justify-between items-center p-5 bg-gradient-to-r from-amber-50/30 to-white rounded-xl border border-amber-200/50 group-hover:border-amber-400 group-hover:shadow-xl group-hover:shadow-amber-500/10 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:shadow-amber-500/25 group-hover:scale-110 transition-all duration-400 ease-out group-hover:rotate-6">
                      <MessageSquare className="h-6 w-6 text-amber-700 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="transition-transform duration-400 ease-out group-hover:translate-x-1">
                      <span className="text-base font-semibold text-slate-900 group-hover:text-amber-900 transition-colors duration-300">Memorable Quotes</span>
                      <p className="text-xs text-slate-600 group-hover:text-amber-700 transition-colors duration-300">Notable statements</p>
                    </div>
                  </div>
                  <div className="text-right transition-transform duration-400 ease-out group-hover:-translate-x-1">
                    <div className="text-3xl font-bold text-amber-600 group-hover:text-amber-800 group-hover:scale-110 transition-all duration-300 animate-pulse group-hover:animate-bounce">
                      {full_summary.memorable_quotes.length}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide group-hover:text-amber-600 transition-colors duration-300">quotes</div>
                  </div>
                </div>
              </div>

              {/* Conclusions Metric */}
              <div className="group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-blue-300/20 to-blue-200/10 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
                <div className="relative flex justify-between items-center p-5 bg-gradient-to-r from-blue-50/30 to-white rounded-xl border border-blue-200/50 group-hover:border-blue-400 group-hover:shadow-xl group-hover:shadow-blue-500/10 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:shadow-blue-500/25 group-hover:scale-110 transition-all duration-400 ease-out group-hover:rotate-3">
                      <TrendingUp className="h-6 w-6 text-blue-700 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="transition-transform duration-400 ease-out group-hover:translate-x-1">
                      <span className="text-base font-semibold text-slate-900 group-hover:text-blue-900 transition-colors duration-300">Conclusions</span>
                      <p className="text-xs text-slate-600 group-hover:text-blue-700 transition-colors duration-300">Key insights & takeaways</p>
                    </div>
                  </div>
                  <div className="text-right transition-transform duration-400 ease-out group-hover:-translate-x-1">
                    <div className="text-3xl font-bold text-blue-600 group-hover:text-blue-800 group-hover:scale-110 transition-all duration-300 animate-pulse group-hover:animate-bounce">
                      {full_summary.conclusions.length}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide group-hover:text-blue-600 transition-colors duration-300">insights</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {status === 'completed' && (
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
                <p className="text-sm text-slate-600">Share and copy content</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-3 hover:bg-slate-50 border-slate-300"
                onClick={() => tldr && copyToClipboard(tldr)}
                disabled={!tldr}
                aria-label="Copy TL;DR summary to clipboard"
              >
                <Copy className="h-4 w-4" />
                Copy TL;DR
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-3 hover:bg-slate-50 border-slate-300"
                onClick={() => full_summary?.detailed_summary && copyToClipboard(full_summary.detailed_summary.replace(/<[^>]*>/g, ''))}
                disabled={!full_summary?.detailed_summary}
                aria-label="Copy full summary to clipboard"
              >
                <FileText className="h-4 w-4" />
                Copy Full Summary
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-3 hover:bg-slate-50 border-slate-300"
                onClick={() => {
                  const url = window.location.href;
                  copyToClipboard(url);
                }}
                aria-label="Copy summary URL to clipboard"
              >
                <Link className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryDetailsContent: React.FC<SummaryDetailsContentProps> = ({ summaryId }) => {
  const { data: summary, isLoading, isError, error } = useSummaryDetails(summaryId);
  const [isSummaryPreviewOpen, setIsSummaryPreviewOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: generateSummaryMutation, isPending: isGenerating } = useMutation({
    mutationFn: (video: VideoSummary) => {
      const videoUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
      return generateSummary({ video_url: videoUrl });
    },
    onSuccess: () => {
      toast.success('Summary generation started!');
      queryClient.invalidateQueries({ queryKey: ['summaryDetails', summaryId] });
      setIsGenerateDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.error?.message || 'An unknown error occurred.';
      toast.error(`Failed to generate summary: ${errorMessage}`);
    },
  });

  const handleReGenerate = () => {
    setIsGenerateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto p-4 pt-12">
          <AppLoader loadingText="Loading summary..." />
        </div>
      </div>
    );
  }

  if (isError) {
    const is404 = error?.message?.includes('404') || error?.message?.includes('not found');
    if (is404) {
      return (
        <NotFound
          title="Summary Not Found"
          message="We couldn't find the summary you're looking for. It might have been deleted or the link is incorrect."
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to load summary</h2>
        <p className="text-gray-600 mb-8 max-w-md">{error?.message || 'An unexpected error occurred while fetching summary details.'}</p>
        <Button onClick={() => window.location.reload()} size="lg" className="rounded-xl px-8">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Loading
        </Button>
      </div>
    );
  }

  if (!summary) {
    return (
      <NotFound
        title="Summary Not Found"
        message="The requested summary could not be located in our database."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 w-full overflow-x-hidden">
      <ScrollProgress />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        {/* Video Header */}
        <div className="mb-8">
          <VideoHeader
            video={summary.video}
            channel={summary.channel}
            generated_at={summary.generated_at}
            is_hidden={summary.is_hidden}
            status={summary.status}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Status indicator for non-completed states */}
            {(summary.status === 'pending' || summary.status === 'in_progress') && (
              <div className="mb-6">
                <StatusIndicator status={summary.status} />
              </div>
            )}

            {/* Error state */}
            {summary.status === 'failed' && (
              <Card className="mb-6 border-red-200 bg-red-50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-red-900 text-lg">Generation Failed</h3>
                          <p className="mt-1 text-sm text-red-700 leading-relaxed font-medium">
                            {summary.error_code === 'NO_SUBTITLES'
                              ? 'Unable to generate summary: No subtitles available for this video.'
                              : summary.error_code === 'VIDEO_TOO_LONG'
                                ? 'Video is too long to process.'
                                : `Error: ${summary.error_code || 'Unknown error'}`}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          className="bg-white border-red-200 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 gap-2 font-bold shadow-sm hover:shadow-md shrink-0 sm:self-center"
                          onClick={handleReGenerate}
                        >
                          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Disclaimer */}
            {summary.status === 'completed' && summary.full_summary && (
              <div className="relative mx-3 sm:mx-4 lg:mx-0 mb-6 sm:mb-8 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border border-emerald-200/50 shadow-lg shadow-emerald-100/50">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full -translate-y-10 sm:-translate-y-16 translate-x-10 sm:translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>

                <div className="relative p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        🤖 Understanding AI Summaries
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Educational Tool</span>
                      </h3>

                      <div className="space-y-3">
                        <p className="text-gray-700 font-medium leading-relaxed">
                          This summary was created by AI to help you quickly grasp the video's main points.
                        </p>

                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-emerald-100/50">
                          <p className="text-sm font-semibold text-gray-800 mb-2">Remember:</p>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span>AI may occasionally miss nuances or context from the original video</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Use this as a learning aid, not a substitute for watching the full content</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span>For complete understanding, always refer to the original video</span>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100/50">
                          <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Best practice: Read the summary first, then watch key sections of the original video for deeper insights.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Content */}
            {summary.status === 'completed' && summary.full_summary && (
              <div className="space-y-8">
                {/* TL;DR Section - Blue Theme */}
                {summary.tldr && (
                  <Card className="border-l-4 border-l-blue-400 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm">
                            <Star className="h-6 w-6 text-blue-600" />
                          </div>
                          <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent font-bold">
                            TL;DR
                          </span>
                        </CardTitle>
                        {/* Mobile Status Indicator */}
                        <div className="md:hidden">
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-emerald-800">Ready</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl bg-gradient-to-r from-blue-50/50 to-blue-100/30 p-6 border border-blue-200/30">
                        <TypewriterAnimation
                          text={summary.tldr}
                          speed={30}
                          delay={500}
                          className="text-blue-800 font-medium text-lg leading-relaxed"
                          cursorClassName="bg-blue-600"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Key Points and Quotes in enhanced layout */}
                <div className="grid gap-8 lg:grid-cols-2">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card className="shadow-sm border border-blue-200">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          <span className="font-bold text-blue-900">
                            Key Points
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {summary.full_summary.key_points.map((point, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -30 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 hover:bg-blue-100 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                            >
                              <Badge variant="secondary" className="mt-0.5 h-7 w-7 rounded-full p-0 text-sm font-bold bg-blue-100 text-blue-800 shrink-0 hover:bg-blue-200 transition-colors">
                                {index + 1}
                              </Badge>
                              <span className="text-base leading-relaxed">{point}</span>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Card className="shadow-sm border border-gray-200">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5 text-gray-600" />
                          <span className="font-bold text-gray-900">
                            Memorable Quotes
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {summary.full_summary.memorable_quotes.length > 0 ? (
                          <div className="space-y-4">
                            {summary.full_summary.memorable_quotes.map((quote, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.15 }}
                                className="relative hover:scale-[1.01] transition-transform duration-200"
                              >
                                <div className="absolute -left-2 top-4 w-1 h-8 bg-amber-400 rounded-full animate-pulse" />
                                <blockquote className="border-l-4 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 p-5 italic text-amber-900 text-base leading-relaxed rounded-r-lg ml-2 transition-colors duration-200">
                                  "{quote}"
                                </blockquote>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm">No memorable quotes extracted from this video.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Full Summary */}
                <Card className="shadow-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300 border border-blue-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-blue-900">
                          Full Summary
                        </span>
                      </div>
                      <Dialog open={isSummaryPreviewOpen} onOpenChange={setIsSummaryPreviewOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                          >
                            <Maximize2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Preview</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-xl">
                              <MessageSquare className="h-6 w-6 text-blue-600" />
                              Full Summary Preview
                            </DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <div className="prose prose-blue prose-lg max-w-none bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-8 border border-blue-200/50 shadow-inner">
                              <div dangerouslySetInnerHTML={{ __html: summary.full_summary.detailed_summary || '' }} />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-blue prose-lg max-w-none bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200/50">
                      <div dangerouslySetInnerHTML={{ __html: summary.full_summary.detailed_summary || '' }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Conclusions - Emerald Theme */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl shadow-sm">
                          <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                        <span className="bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent font-bold">
                          Conclusions & Insights
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {summary.full_summary.conclusions.map((conclusion, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex items-start gap-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 hover:bg-emerald-100 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                            style={{ animationDelay: `${index * 120}ms` }}
                          >
                            <div className="mt-1 h-3 w-3 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                            <span className="text-base leading-relaxed">{conclusion}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SummarySidebar
              summaryId={summaryId}
              status={summary.status}
              rating_stats={summary.rating_stats}
              user_rating={summary.user_rating}
              full_summary={summary.full_summary}
              error_code={summary.error_code}
              tldr={summary.tldr}
            />
          </div>
        </div>
      </div>
      {summary && (
        <GenerateSummaryDialog
          video={{
            id: summary.video.id,
            youtube_video_id: summary.video.youtube_video_id,
            title: summary.video.title,
            thumbnail_url: summary.video.thumbnail_url,
            published_at: summary.video.published_at,
            channel: summary.channel,
            summary_id: summary.id,
            summary_status: summary.status,
          }}
          isOpen={isGenerateDialogOpen}
          isGenerating={isGenerating}
          onClose={() => setIsGenerateDialogOpen(false)}
          onConfirm={generateSummaryMutation}
        />
      )}
    </div>
  );
};



interface SummaryDetailsViewProps {
  summaryId: string;
}

const SummaryDetailsView: React.FC<SummaryDetailsViewProps> = ({ summaryId }) => (
  <QueryProvider>
    <SummaryDetailsContent summaryId={summaryId} />
  </QueryProvider>
);

export default SummaryDetailsView;
