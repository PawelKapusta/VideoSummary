import React from "react";
import type { VideoSummary, ValidationStep } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSummaryGenerationValidation } from "@/hooks/useSummaryGenerationValidation";
import { CheckCircle2, XCircle, Loader2, Circle, Play, Clock, User, AlertTriangle, X, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerateSummaryDialogProps {
  video: VideoSummary | null;
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onConfirm: (video: VideoSummary) => void;
}

const StatusIcon: React.FC<{ status: ValidationStep["status"] }> = ({ status }) => {
  switch (status) {
    case "checking":
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-600" />;
    case "pending":
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
};

const ValidationStepItem: React.FC<{ step: ValidationStep }> = ({ step }) => {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card/50 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        <StatusIcon status={step.status} />
      </div>
      <div className="flex flex-col space-y-1 min-w-0 flex-1">
        <span
          className={`text-base font-semibold leading-relaxed ${
            step.status === "checking"
              ? "text-blue-500 dark:text-blue-400"
              : step.status === "success"
                ? "text-green-600 dark:text-green-400"
                : step.status === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
          }`}
        >
          {step.text}
        </span>
        {step.error_message && (
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-red-600 dark:text-red-400 leading-tight">{step.error_message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const GenerateSummaryDialog: React.FC<GenerateSummaryDialogProps> = ({
  video,
  isOpen,
  isGenerating,
  onClose,
  onConfirm,
}) => {
  const { validationState, isAllValid, isLoading } = useSummaryGenerationValidation(isOpen ? video : null);

  if (!video) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm(video);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-background" />
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Generate Summary</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Review the pre-generate checks below and confirm to generate an AI summary for this video.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Information Card */}
          <Card className="border-l-4 border-l-primary/50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-16 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-md flex items-center justify-center">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">{video.title}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{video.channel.name}</span>
                    </div>
                    {video.published_at && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(video.published_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Steps Card */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base flex items-center space-x-2">
                <span>Pre-generate Checks</span>
                <Badge
                  variant={isAllValid ? "default" : "destructive"}
                  className={`text-sm px-3 py-1 rounded-full shadow-sm font-medium transition-all duration-200 hover:shadow-md ${isAllValid ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}`}
                >
                  {isAllValid ? "✓ Ready" : "⚠️ Issues Found"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ValidationStepItem step={validationState.isUrlValid} />
              <ValidationStepItem step={validationState.isSubscribed} />
              <ValidationStepItem step={validationState.isWithinLimit} />
              <ValidationStepItem step={validationState.isDurationValid} />
              <ValidationStepItem step={validationState.isNotAlreadyGenerating} />
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isGenerating}
            className="w-full sm:w-auto hover:bg-secondary/80 shadow-sm hover:shadow-md transition-all duration-200 px-6 py-2 rounded-lg font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary"
            size="lg"
          >
            <XIcon className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isAllValid || isLoading || isGenerating}
            className={cn(
              "w-full sm:w-auto transition-all duration-200 px-6 py-2 rounded-lg font-medium shadow-sm focus:ring-2 focus:ring-white/50",
              !isAllValid || isLoading || isGenerating
                ? "bg-muted text-muted-foreground hover:bg-muted shadow-none"
                : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-md hover:shadow-lg text-white"
            )}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Summary...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Confirm & Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateSummaryDialog;
