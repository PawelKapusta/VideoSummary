import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

const EmptyState = ({
  message = "No summaries yet",
  description = "Subscribe to YouTube channels on your profile page to start generating summaries."
}: EmptyStateProps) => {
  return (
    <div 
      className="text-center p-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-center items-center mb-4">
        <FileText 
          className="w-16 h-16 text-muted-foreground" 
          aria-hidden="true"
        />
      </div>
      <h2 className="text-2xl font-semibold mb-2">{message}</h2>
      <p className="text-muted-foreground mb-4">
        {description}
      </p>
      <Button asChild>
        <a href="/profile">Go to Profile</a>
      </Button>
    </div>
  );
};

export default EmptyState;
