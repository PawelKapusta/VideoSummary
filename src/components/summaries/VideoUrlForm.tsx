import React from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

interface VideoUrlFormProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

const VideoUrlForm: React.FC<VideoUrlFormProps> = ({ url, onUrlChange, onSubmit, isSubmitting, canSubmit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <Input
        type="url"
        placeholder="https://www.youtube.com/watch?v=..."
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        disabled={isSubmitting}
        className="flex-grow"
      />
      <Button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Summary'
        )}
      </Button>
    </form>
  );
};

export default VideoUrlForm;
