import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export const SuccessMessage: React.FC = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/login";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleManualRedirect = () => {
    window.location.href = "/login";
  };

  return (
    <div data-testid="success-message" className="flex flex-col items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-6 text-center text-green-800">
      <CheckCircle className="h-12 w-12 text-green-600" aria-hidden="true" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Password Reset Successful!</h3>
        <p className="text-sm">
          Your password has been updated successfully. You will be redirected to the login page in 3 seconds.
        </p>
        <p className="text-xs text-muted-foreground">If not redirected, click below.</p>
      </div>
      <Button onClick={handleManualRedirect} className="gap-2">
        Go to Login <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
