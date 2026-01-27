import { Button } from "@/components/ui/button";
import { Video, FileText, Youtube, Search } from "lucide-react";
import React from "react";

interface EmptyStateProps {
  message?: string;
  description?: string;
  type?: "videos" | "summaries";
}

const EmptyState = ({ message, description, type = "summaries" }: EmptyStateProps) => {
  const defaultMessage = type === "videos" ? "No videos available" : "No summaries yet";

  const defaultDescription =
    type === "videos"
      ? "Subscribe to YouTube channels to see their videos and generate summaries."
      : "Subscribe to YouTube channels on your profile page to start generating summaries.";

  const Icon = type === "videos" ? Video : FileText;

  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center py-16 px-8 max-w-2xl mx-auto"
      role="status"
      aria-live="polite"
    >
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center shadow-sm">
          <Icon className="w-12 h-12 text-indigo-600" aria-hidden="true" />
        </div>
        {type === "videos" && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <Youtube className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">{message || defaultMessage}</h2>

      <p className="text-lg text-gray-600 mb-8 text-center leading-relaxed max-w-lg">
        {description || defaultDescription}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Button asChild size="lg" className="px-8">
          <a href="/profile" className="flex items-center gap-2">
            <Youtube className="w-4 h-4" />
            Subscribe to Channels
          </a>
        </Button>

        {type === "videos" && (
          <Button asChild variant="outline" size="lg" className="px-8">
            <a href="/generate" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Generate Summary
            </a>
          </Button>
        )}
      </div>

      {type === "summaries" && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help getting started? Check out our{" "}
            <a href="/videos" className="text-indigo-600 hover:text-indigo-700 font-medium">
              videos page
            </a>{" "}
            or{" "}
            <a href="/generate" className="text-indigo-600 hover:text-indigo-700 font-medium">
              generate a summary manually
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
