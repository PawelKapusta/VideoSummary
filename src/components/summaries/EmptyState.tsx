import React from 'react';
import { Button } from '../ui/button';
import { FileText, Search, Youtube, Sparkles, Home } from 'lucide-react';

interface Props {
  message?: string;
  description?: string;
  onClearFilters?: () => void;
}

const EmptyState: React.FC<Props> = ({
  message = 'No summaries available yet.',
  description = 'Start building your knowledge base by subscribing to channels and generating AI-powered summaries of their videos.',
  onClearFilters
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 max-w-2xl mx-auto">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-full flex items-center justify-center shadow-sm">
          <Home className="w-12 h-12 text-purple-600" aria-hidden="true" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
        {message}
      </h2>

      <p className="text-lg text-gray-600 mb-8 text-center leading-relaxed max-w-lg">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {onClearFilters && (
          <Button onClick={onClearFilters} variant="outline" size="lg" className="px-8">
            <Search className="w-4 h-4" />
            Show All Summaries
          </Button>
        )}
        <Button asChild size="lg" className="px-8">
          <a href="/profile" className="flex items-center gap-2">
            <Youtube className="w-4 h-4" />
            Discover Channels
          </a>
        </Button>
        <Button asChild variant="outline" size="lg" className="px-8">
          <a href="/generate" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Create First Summary
          </a>
        </Button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Browse available videos on our{' '}
          <a href="/videos" className="text-indigo-600 hover:text-indigo-700 font-medium">
            videos page
          </a>{' '}
          to get started
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
