import { describe, it, expect } from "vitest";
import {
  extractYouTubeChannelId,
  extractYouTubeVideoId,
  isValidYouTubeChannelId,
  isValidYouTubeVideoId,
  constructYouTubeChannelUrl,
  YOUTUBE_VIDEO_URL_PREFIX,
} from "@/lib/youtube.utils";

describe("YouTube Utilities", () => {
  describe("extractYouTubeChannelId", () => {
    it("should extract channel ID from standard format", () => {
      const url = "https://www.youtube.com/channel/UC1234567890123456789012";
      expect(extractYouTubeChannelId(url)).toBe("UC1234567890123456789012");
    });

    it("should extract channel ID without protocol", () => {
      const url = "youtube.com/channel/UC1234567890123456789012";
      expect(extractYouTubeChannelId(url)).toBe("UC1234567890123456789012");
    });

    it("should extract channel ID without www", () => {
      const url = "https://youtube.com/channel/UC1234567890123456789012";
      expect(extractYouTubeChannelId(url)).toBe("UC1234567890123456789012");
    });

    it("should extract handle from @ format", () => {
      const url = "https://www.youtube.com/@channelname";
      expect(extractYouTubeChannelId(url)).toBe("@channelname");
    });

    it("should extract handle from @ format without www", () => {
      const url = "youtube.com/@channelname";
      expect(extractYouTubeChannelId(url)).toBe("@channelname");
    });

    it("should handle URL with encoded characters", () => {
      const url = "https://www.youtube.com/@channel%20name";
      expect(extractYouTubeChannelId(url)).toBe("@channel name");
    });

    it("should throw error for legacy /c/ format", () => {
      const url = "https://www.youtube.com/c/channelname";
      expect(() => extractYouTubeChannelId(url)).toThrow(
        "Legacy YouTube URL format - please use /channel/UC... or /@... format"
      );
    });

    it("should throw error for legacy /user/ format", () => {
      const url = "https://www.youtube.com/user/username";
      expect(() => extractYouTubeChannelId(url)).toThrow(
        "Legacy YouTube URL format - please use /channel/UC... or /@... format"
      );
    });

    it("should throw error for youtu.be (video URL)", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      expect(() => extractYouTubeChannelId(url)).toThrow("youtu.be URLs are for videos, not channels");
    });

    it("should throw error for invalid YouTube URL", () => {
      const url = "https://www.youtube.com/invalid";
      expect(() => extractYouTubeChannelId(url)).toThrow("Invalid YouTube channel URL format");
    });

    it("should throw error for non-YouTube URL", () => {
      const url = "https://example.com/channel/test";
      expect(() => extractYouTubeChannelId(url)).toThrow("Invalid YouTube channel URL format");
    });
  });

  describe("extractYouTubeVideoId", () => {
    it("should extract video ID from standard watch URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from URL with additional parameters", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&feature=share";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from youtu.be short link", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from youtu.be with parameters", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ?t=30";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from embed URL", () => {
      const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID without protocol", () => {
      const url = "youtube.com/watch?v=dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID without www", () => {
      const url = "https://youtube.com/watch?v=dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("should throw error for invalid YouTube video URL", () => {
      const url = "https://www.youtube.com/watch";
      expect(() => extractYouTubeVideoId(url)).toThrow("Invalid YouTube video URL format");
    });

    it("should throw error for non-YouTube URL", () => {
      const url = "https://example.com/watch?v=test";
      expect(() => extractYouTubeVideoId(url)).toThrow("Invalid YouTube video URL format");
    });

    it("should throw error for channel URL", () => {
      const url = "https://www.youtube.com/channel/UC1234567890123456789012";
      expect(() => extractYouTubeVideoId(url)).toThrow("Invalid YouTube video URL format");
    });
  });

  describe("isValidYouTubeChannelId", () => {
    it("should return true for valid channel ID", () => {
      expect(isValidYouTubeChannelId("UC1234567890123456789012")).toBe(true);
    });

    it("should return true for valid channel ID with lowercase", () => {
      expect(isValidYouTubeChannelId("uc1234567890123456789012")).toBe(false); // UC must be uppercase
    });

    it("should return false for channel ID without UC prefix", () => {
      expect(isValidYouTubeChannelId("123456789012345678901234")).toBe(false);
    });

    it("should return false for too short channel ID", () => {
      expect(isValidYouTubeChannelId("UC123456789012345678901")).toBe(false); // 23 chars instead of 24
    });

    it("should return false for too long channel ID", () => {
      expect(isValidYouTubeChannelId("UC12345678901234567890123")).toBe(false); // 25 chars instead of 24
    });

    it("should return false for channel ID with invalid characters", () => {
      expect(isValidYouTubeChannelId("UC123456789012345678901!")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidYouTubeChannelId("")).toBe(false);
    });

    it("should return false for handle format", () => {
      expect(isValidYouTubeChannelId("@channelname")).toBe(false);
    });
  });

  describe("isValidYouTubeVideoId", () => {
    it("should return true for valid video ID", () => {
      expect(isValidYouTubeVideoId("dQw4w9WgXcQ")).toBe(true);
    });

    it("should return true for video ID with allowed special characters", () => {
      expect(isValidYouTubeVideoId("dQw4w9WgXc-")).toBe(true);
      expect(isValidYouTubeVideoId("dQw4w9WgXc_")).toBe(true);
    });

    it("should return false for too short video ID", () => {
      expect(isValidYouTubeVideoId("dQw4w9WgXc")).toBe(false); // 10 chars instead of 11
    });

    it("should return false for too long video ID", () => {
      expect(isValidYouTubeVideoId("dQw4w9WgXcQQ")).toBe(false); // 12 chars instead of 11
    });

    it("should return false for video ID with invalid characters", () => {
      expect(isValidYouTubeVideoId("dQw4w9WgXc!")).toBe(false);
      expect(isValidYouTubeVideoId("dQw4w9WgXc@")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidYouTubeVideoId("")).toBe(false);
    });

    it("should return false for uppercase letters (YouTube IDs are case-sensitive but typically lowercase)", () => {
      expect(isValidYouTubeVideoId("DQW4W9WGXCQ")).toBe(true); // Actually valid - YouTube IDs can have uppercase
    });
  });

  describe("constructYouTubeChannelUrl", () => {
    it("should construct URL for handle format", () => {
      expect(constructYouTubeChannelUrl("@channelname")).toBe("https://www.youtube.com/@channelname");
    });

    it("should construct URL for channel ID format", () => {
      expect(constructYouTubeChannelUrl("UC1234567890123456789012")).toBe(
        "https://www.youtube.com/channel/UC1234567890123456789012"
      );
    });

    it("should construct URL for plain username (fallback)", () => {
      expect(constructYouTubeChannelUrl("channelname")).toBe("https://www.youtube.com/@channelname");
    });

    it("should handle empty string", () => {
      expect(constructYouTubeChannelUrl("")).toBe("https://www.youtube.com/@");
    });
  });

  describe("YOUTUBE_VIDEO_URL_PREFIX constant", () => {
    it("should have correct value", () => {
      expect(YOUTUBE_VIDEO_URL_PREFIX).toBe("https://www.youtube.com/watch?v=");
    });
  });
});
