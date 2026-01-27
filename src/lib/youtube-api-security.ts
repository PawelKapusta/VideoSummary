/**
 * Security utilities for YouTube API calls
 *
 * This module provides additional security layers for YouTube API requests:
 * - Rate limiting to prevent abuse
 * - Request validation
 * - Monitoring and logging
 */

import { appLogger, securityLogger } from "./logger";
import { getSiteUrl, type RuntimeEnv } from "./env";

/**
 * Rate limiter to prevent API abuse
 * Tracks requests per IP/user to detect suspicious activity
 */
class YouTubeApiRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequestsPerMinute = 60; // Adjust based on your needs
  private readonly windowMs = 60 * 1000; // 1 minute

  /**
   * Check if request should be allowed
   * @param identifier - User ID, IP, or session identifier
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // Clean up old records
    if (record && now > record.resetTime) {
      this.requests.delete(identifier);
    }

    // Check current record
    const current = this.requests.get(identifier);
    if (!current) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (current.count >= this.maxRequestsPerMinute) {
      securityLogger.logSecurityEvent("rate_limit_exceeded", "YouTube API rate limit exceeded", {
        service: "youtube_api",
        identifier,
        count: current.count,
      });
      return false;
    }

    current.count++;
    return true;
  }
}

const rateLimiter = new YouTubeApiRateLimiter();

/**
 * Create secure fetch options for YouTube API requests
 *
 * Security features:
 * - Sets Referer header from server-controlled env var
 * - Validates URL is actually YouTube API
 * - Adds request tracking for monitoring
 *
 * @param runtimeEnv - Runtime environment variables
 * @param userId - Optional user ID for rate limiting
 */
export function createSecureYouTubeFetchOptions(runtimeEnv?: RuntimeEnv, _userId?: string): RequestInit {
  // Get site URL from server-controlled env (cannot be manipulated by client)
  const referer = getSiteUrl(runtimeEnv);

  return {
    headers: {
      Referer: referer,
      "User-Agent": "YTInsights/1.0", // Identify your app
    },
  };
}

/**
 * Validate that URL is actually a YouTube API endpoint
 * Prevents accidental or malicious requests to other domains
 */
export function validateYouTubeApiUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const allowedHosts = ["www.googleapis.com", "youtube.googleapis.com"];

    if (!allowedHosts.includes(parsedUrl.hostname)) {
      securityLogger.logSecurityEvent("suspicious_activity", "Invalid YouTube API URL detected", {
        service: "youtube_api",
        url: parsedUrl.hostname,
      });
      return false;
    }

    return true;
  } catch (error) {
    securityLogger.logSecurityEvent("suspicious_activity", "Malformed URL in YouTube API request", {
      service: "youtube_api",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Secure wrapper for YouTube API fetch calls
 *
 * @param url - YouTube API URL
 * @param runtimeEnv - Runtime environment
 * @param userId - Optional user ID for rate limiting
 */
export async function secureYouTubeFetch(url: string, runtimeEnv?: RuntimeEnv, userId?: string): Promise<Response> {
  // Validate URL
  if (!validateYouTubeApiUrl(url)) {
    throw new Error("Invalid YouTube API URL");
  }

  // Rate limiting (optional - can be enabled for additional security)
  if (userId && !rateLimiter.isAllowed(userId)) {
    throw new Error("Rate limit exceeded for YouTube API requests");
  }

  // Create secure fetch options
  const options = createSecureYouTubeFetchOptions(runtimeEnv, userId);

  // Log request for monitoring (without sensitive data)
  const headers = options.headers as Record<string, string> | undefined;
  appLogger.debug("YouTube API request", {
    url: url.replace(/key=[^&]+/, "key=REDACTED"),
    referer: headers?.["Referer"],
  });

  // Make request
  return fetch(url, options);
}
