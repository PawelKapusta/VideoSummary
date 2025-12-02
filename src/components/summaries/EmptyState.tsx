import React from 'react';
import { Button } from '../ui/button';
import { FileText, Search } from 'lucide-react';

interface Props {
  message?: string;
  onClearFilters?: () => void;
}

const EmptyState: React.FC<Props> = ({ message = 'No summaries match your filters.', onClearFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-gray-500" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-gray-900">{message}</h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        Try adjusting your filters, subscribing to more channels, or generating summaries manually.
      </p>
      <div className="flex gap-4">
        {onClearFilters && (
          <Button onClick={onClearFilters} variant="outline">
            Clear Filters
          </Button>
        )}
        <Button asChild variant="default">
          <a href="/profile">Subscribe to Channels</a>
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
