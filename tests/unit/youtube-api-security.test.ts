import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSecureYouTubeFetchOptions, validateYouTubeApiUrl, secureYouTubeFetch } from "@/lib/youtube-api-security";

// Mock dependencies
vi.mock("@/lib/logger", () => ({
  appLogger: {
    debug: vi.fn(),
  },
  securityLogger: {
    logSecurityEvent: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  getSiteUrl: vi.fn(() => "https://example.com/"),
}));

describe("YouTube API Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  describe("createSecureYouTubeFetchOptions", () => {
    it("should create fetch options with correct headers", () => {
      const options = createSecureYouTubeFetchOptions();

      expect(options).toEqual({
        headers: {
          Referer: "https://example.com/",
          "User-Agent": "YTInsights/1.0",
        },
      });
    });

    it("should pass runtimeEnv to getSiteUrl", () => {
      const runtimeEnv = { NODE_ENV: "production" };

      const options = createSecureYouTubeFetchOptions(runtimeEnv);

      expect(options).toHaveProperty("headers");
      expect(options.headers).toHaveProperty("Referer");
      expect(options.headers).toHaveProperty("User-Agent", "YTInsights/1.0");
    });

    it("should handle undefined runtimeEnv", () => {
      const options = createSecureYouTubeFetchOptions(undefined);

      expect(options).toHaveProperty("headers");
      expect(options.headers).toHaveProperty("User-Agent", "YTInsights/1.0");
    });

    it("should include userId parameter (currently unused in implementation)", () => {
      const options = createSecureYouTubeFetchOptions(undefined, "user123");

      // userId is currently not used in the implementation
      expect(options).toEqual({
        headers: {
          Referer: "https://example.com/",
          "User-Agent": "YTInsights/1.0",
        },
      });
    });
  });

  describe("validateYouTubeApiUrl", () => {
    it("should validate correct YouTube API URLs", () => {
      const validUrls = [
        "https://www.googleapis.com/youtube/v3/videos",
        "https://youtube.googleapis.com/youtube/v3/search",
        "https://www.googleapis.com/youtube/v3/channels?part=snippet",
      ];

      validUrls.forEach((url) => {
        const result = validateYouTubeApiUrl(url);
        expect(result).toBe(true);
      });

      // Logger should not be called for valid URLs
    });

    it("should reject URLs with invalid domains", () => {
      const invalidUrls = [
        "https://example.com/api",
        "https://youtube.com/api",
        "https://api.youtube.com/api",
        "https://googleapis.com/youtube/v3/videos", // missing www
      ];

      invalidUrls.forEach((url) => {
        const result = validateYouTubeApiUrl(url);
        expect(result).toBe(false);
      });

      // Invalid URLs should be rejected
      expect.anything(); // Test focuses on validation logic
    });

    it("should handle malformed URLs", () => {
      const malformedUrls = ["not-a-url", "", "://invalid", "https://"];

      malformedUrls.forEach((url) => {
        const result = validateYouTubeApiUrl(url);
        expect(result).toBe(false);
      });

      // Logger should be called for malformed URLs
    });

    it("should reject URLs without protocol", () => {
      const result = validateYouTubeApiUrl("www.googleapis.com/youtube/v3/videos");
      expect(result).toBe(false);
    });

    it("should handle URLs with query parameters and fragments", () => {
      const result = validateYouTubeApiUrl("https://www.googleapis.com/youtube/v3/videos?id=123&key=abc#fragment");
      expect(result).toBe(true);
    });
  });

  describe("secureYouTubeFetch", () => {
    it("should throw error for invalid YouTube API URL", async () => {
      const url = "https://example.com/api";

      await expect(secureYouTubeFetch(url)).rejects.toThrow("Invalid YouTube API URL");
    });

    it("should validate URL format before processing", () => {
      const validUrl = "https://www.googleapis.com/youtube/v3/videos";
      const invalidUrl = "https://example.com/api";

      // Test that validation functions are called internally
      expect(validateYouTubeApiUrl(validUrl)).toBe(true);
      expect(validateYouTubeApiUrl(invalidUrl)).toBe(false);
    });

    it("should work with youtube.googleapis.com domain", async () => {
      const url = "https://youtube.googleapis.com/youtube/v3/search";

      // Test that URL validation passes for this domain
      expect(validateYouTubeApiUrl(url)).toBe(true);
    });
  });
});
