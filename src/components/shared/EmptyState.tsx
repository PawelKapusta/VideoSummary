import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import React from 'react';

const EmptyState = () => {
  return (
    <div className="text-center p-8">
      <div className="flex justify-center items-center mb-4">
        <FileText className="w-16 h-16 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">No summaries yet</h2>
      <p className="text-muted-foreground mb-4">
        Subscribe to YouTube channels on your profile page to start generating summaries.
      </p>
      <Button asChild>
        <a href="/profile">Go to Profile</a>
      </Button>
    </div>
  );
};

export default EmptyState;
