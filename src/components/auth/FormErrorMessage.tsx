import type { ApiError } from '@/types';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FormErrorMessageProps {
  error: ApiError | string | null;
  onDismiss?: () => void;
}

export function FormErrorMessage({ error, onDismiss }: FormErrorMessageProps) {
  if (!error) {
    return null;
  }

  const getErrorMessage = () => {
    if (typeof error === 'string') {
      return error;
    }
    return error.error.message;
  };

  const hasDetails = typeof error !== 'string' &&
    error.error.details &&
    Object.keys(error.error.details).length > 0;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 transition-all duration-300 animate-in fade-in slide-in-from-top-1"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-medium">{getErrorMessage()}</p>
        {hasDetails && (
          <pre className="mt-1 text-xs opacity-75">
            {JSON.stringify(error.error.details, null, 2)}
          </pre>
        )}
      </div>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      )}
    </div>
  );
}

