import React from "react";
import type { ValidationStatusViewModel, ValidationStep } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle2, XCircle, Loader2, Circle } from "lucide-react";

interface ValidationStatusProps {
  status: ValidationStatusViewModel;
}

const StatusIcon: React.FC<{ status: ValidationStep["status"] }> = ({ status }) => {
  switch (status) {
    case "checking":
      return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "pending":
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
};

const ValidationItem: React.FC<{ step: ValidationStep }> = ({ step }) => (
  <li className="flex flex-col">
    <div className="flex items-center space-x-3">
      <StatusIcon status={step.status} />
      <span className={step.status === "error" ? "text-red-500" : "text-foreground"}>{step.text}</span>
    </div>
    {step.status === "error" && step.error_message && <p className="ml-8 text-sm text-red-500">{step.error_message}</p>}
  </li>
);

const ValidationStatus: React.FC<ValidationStatusProps> = ({ status }) => {
  return (
    <Card data-testid="validation-status" className="h-full">
      <CardHeader>
        <CardTitle>Validation Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          <ValidationItem step={status.isUrlValid} />
          <ValidationItem step={status.isSubscribed} />
          <ValidationItem step={status.isDurationValid} />
          <ValidationItem step={status.isWithinLimit} />
          <ValidationItem step={status.isNotAlreadyGenerating} />
        </ul>
      </CardContent>
    </Card>
  );
};

export default ValidationStatus;
