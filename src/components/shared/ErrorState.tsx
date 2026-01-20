import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { AlertTriangle, RefreshCw, Server, Home } from "lucide-react";
import type { ApiClientError } from "../../lib/api";

interface ErrorStateProps {
  error?: Error | ApiClientError | null;
  onRetry?: () => void;
  compact?: boolean;
}

const getErrorConfig = (error: Error | ApiClientError | null | undefined) => {
  if (!error) {
    return {
      title: "Something went wrong",
      message: "An unexpected error occurred. Please try again.",
      icon: AlertTriangle,
      bgColor: "bg-red-500",
      lightBgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    };
  }

  // Handle ApiClientError - only server errors now
  if ("code" in error) {
    const apiError = error as ApiClientError;
    return {
      title: "Server Error",
      message: apiError.message || "Our servers are experiencing issues. Please try again later.",
      icon: Server,
      bgColor: "bg-red-500",
      lightBgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    };
  }

  // Handle generic Error
  return {
    title: "Error",
    message: error.message || "An unexpected error occurred.",
    icon: AlertTriangle,
    bgColor: "bg-red-500",
    lightBgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  };
};

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, compact = false }) => {
  const config = getErrorConfig(error);
  const Icon = config.icon;

  if (compact) {
    return (
      <Card className={`border-2 border-dashed ${config.borderColor} ${config.lightBgColor}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bgColor} bg-opacity-10`}>
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{config.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{config.message}</p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} size="sm" variant="outline" className="shrink-0">
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-orange-100/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Icon container */}
        <div className="relative mb-8">
          <div
            className={`w-24 h-24 ${config.bgColor} bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto shadow-2xl border border-white/20 backdrop-blur-sm`}
          >
            <Icon className={`w-12 h-12 ${config.textColor}`} />
          </div>
        </div>

        {/* Title with gradient */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-red-800 to-gray-900 bg-clip-text text-transparent">
          {config.title}
        </h1>

        {/* Message */}
        <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-lg mx-auto">{config.message}</p>

        {/* Action buttons with enhanced styling */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              size="lg"
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw className="w-5 h-5 mr-3" />
              Try Again
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="lg"
            className="px-8 py-3 border-2 border-gray-300 hover:border-red-300 hover:bg-red-50 transition-colors duration-200"
          >
            <a href="/dashboard" className="flex items-center">
              <Home className="w-5 h-5 mr-3" />
              Back to Dashboard
            </a>
          </Button>
        </div>

        {/* Additional help text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If this problem persists, please{" "}
            <a href="mailto:support@ytinsights.app" className="text-red-600 hover:text-red-700 font-medium underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
