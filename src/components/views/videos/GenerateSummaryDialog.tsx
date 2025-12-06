import React from 'react';
import type { VideoSummary, ValidationStep } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSummaryGenerationValidation } from '@/hooks/useSummaryGenerationValidation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'; // Assuming you have lucide-react

interface GenerateSummaryDialogProps {
  video: VideoSummary | null;
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onConfirm: (video: VideoSummary) => void;
}

const ValidationStepItem: React.FC<{ step: ValidationStep }> = ({ step }) => {
  return (
    <div className="flex items-center space-x-2">
      {step.status === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
      {step.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
      {step.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
      <div className="flex flex-col">
        <span className={step.status === 'error' ? 'text-red-500' : ''}>{step.text}</span>
        {step.error_message && <span className="text-xs text-red-400">{step.error_message}</span>}
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Summary</DialogTitle>
          <DialogDescription>
            Confirm that you want to generate a summary for the video below after reviewing the pre-flight checks.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <h3 className="font-semibold">{video.title}</h3>
            <p className="text-sm text-muted-foreground">{video.channel.name}</p>
          </div>
          <div className="space-y-2">
            <ValidationStepItem step={validationState.isUrlValid} />
            <ValidationStepItem step={validationState.isSubscribed} />
            <ValidationStepItem step={validationState.isWithinLimit} />
            <ValidationStepItem step={validationState.isDurationValid} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isAllValid || isLoading || isGenerating}>
            {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Confirm & Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateSummaryDialog;
