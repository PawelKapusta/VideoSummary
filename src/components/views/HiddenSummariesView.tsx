import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Eye, EyeOff, Clock, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useHiddenSummaries } from "../../hooks/useHiddenSummaries";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "../../lib/api";
import type { SummaryWithVideo, FilterOptions, PaginatedResponse } from "../../types";
import AppLoader from "../ui/AppLoader";
import QueryProvider from "../providers/QueryProvider";
import FilterPanel from "../summaries/FilterPanel";
import { useUserChannels } from "../../hooks/useUserChannels";

const HiddenSummariesContent = () => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    useHiddenSummaries(filters);
  const { data: channelsData } = useUserChannels();
  const queryClient = useQueryClient();
  const [unhidingIds, setUnhidingIds] = useState<Set<string>>(new Set());
  const [isUnhidingAll, setIsUnhidingAll] = useState(false);

  const hiddenSummaries = data?.pages.flatMap((page: PaginatedResponse<SummaryWithVideo>) => page.data) || [];
  const totalCount = data?.pages[0]?.pagination?.total || 0;

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleUnhideAll = async () => {
    setIsUnhidingAll(true);
    try {
      await api.post("/api/summaries/unhide-all");
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "summaries" || query.queryKey[0] === "hiddenSummaries",
      });
      toast.success("All summaries restored to your dashboard");
    } catch {
      toast.error("Failed to restore all summaries");
    } finally {
      setIsUnhidingAll(false);
    }
  };

  const handleUnhide = async (summaryId: string) => {
    if (unhidingIds.has(summaryId)) return;

    setUnhidingIds((prev) => new Set(prev).add(summaryId));

    try {
      // Using DELETE based on backend API convention for unhide
      await api.delete(`/api/summaries/${summaryId}/hide`);
      // Invalidate both hidden summaries and regular summaries queries
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "summaries" || query.queryKey[0] === "hiddenSummaries",
      });
      toast.success("Summary restored to your dashboard");
    } catch {
      toast.error("Failed to unhide summary");
    } finally {
      setUnhidingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(summaryId);
        return newSet;
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          color: "bg-emerald-100 text-emerald-800 border-emerald-200",
          label: "Completed",
        };
      case "failed":
        return {
          color: "bg-rose-100 text-rose-800 border-rose-200",
          label: "Failed",
        };
      case "in_progress":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          label: "Processing",
        };
      case "pending":
        return {
          color: "bg-amber-100 text-amber-800 border-amber-200",
          label: "Pending",
        };
      default:
        return {
          color: "bg-slate-100 text-slate-800 border-slate-200",
          label: status,
        };
    }
  };

  if (isLoading && hiddenSummaries.length === 0) {
    return (
      <div className="container mx-auto p-4 pt-12">
        <AppLoader loadingText="Loading hidden summaries..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 pt-12">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load hidden summaries</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="hidden-summaries-view" className="container mx-auto p-4 pt-12 pb-12">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {hiddenSummaries.length > 0 && (
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Unhide All
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Restore All Summaries?</DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                      This will restore <strong>{totalCount}</strong> summaries to your dashboard. They will be visible
                      in your main list again.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <DialogClose>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleUnhideAll}
                      disabled={isUnhidingAll}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      {isUnhidingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        "Restore All"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 bg-gradient-to-r from-slate-800 to-gray-900 bg-clip-text text-transparent">
              <EyeOff className="h-8 w-8 text-slate-800" />
              Hidden Summaries
            </div>
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-base font-medium shadow-sm mt-2 sm:mt-0">
                <span className="font-bold text-slate-900">{totalCount}</span>
                <span className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Hidden</span>
              </div>
            )}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            View and manage summaries you&apos;ve hidden from your dashboard.
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        channels={channelsData || []}
        disabled={isLoading}
      />

      {/* Content Section */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          {hiddenSummaries.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {Object.keys(filters).length > 0 ? "No matches found" : "No hidden summaries"}
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {Object.keys(filters).length > 0
                  ? "Try adjusting your filters to find what you are looking for."
                  : "Summaries you hide from your dashboard will appear here."}
              </p>
              {Object.keys(filters).length > 0 && (
                <Button variant="outline" className="mt-6" onClick={() => setFilters({})}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {hiddenSummaries.map((summary: SummaryWithVideo) => {
                const statusConfig = getStatusConfig(summary.status);
                const isUnhiding = unhidingIds.has(summary.id);

                return (
                  <div
                    key={summary.id}
                    onClick={() => (window.location.href = `/summaries/${summary.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        window.location.href = `/summaries/${summary.id}`;
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-xl hover:bg-slate-50/50 hover:border-slate-200 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {summary.video.title}
                        </h4>
                        <Badge className={`${statusConfig.color} font-normal border`} variant="secondary">
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">{summary.channel.name}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {summary.video.published_at
                              ? format(new Date(summary.video.published_at), "MMM dd, yyyy")
                              : "Unknown date"}
                          </span>
                        </div>
                      </div>
                      {summary.tldr && (
                        <p className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed">{summary.tldr}</p>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-2 mt-4 sm:mt-0 sm:self-center shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUnhiding}
                            className="w-full sm:w-auto hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                          >
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
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle className="text-xl">Restore Summary</DialogTitle>
                            <DialogDescription className="pt-2 text-base">
                              Are you sure you want to restore <strong>&quot;{summary.video.title}&quot;</strong>?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-2 text-sm text-muted-foreground">
                            It will appear in your main dashboard again.
                          </div>
                          <DialogFooter className="gap-2 sm:gap-0 mt-2">
                            <DialogClose>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                              onClick={() => {
                                handleUnhide(summary.id);
                              }}
                              disabled={isUnhiding}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {isUnhiding ? "Restoring..." : "Restore Summary"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}

              {hasNextPage && (
                <div className="text-center pt-8 pb-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="min-w-[150px]"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Summaries"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function HiddenSummariesView() {
  return (
    <QueryProvider>
      <HiddenSummariesContent />
    </QueryProvider>
  );
}
