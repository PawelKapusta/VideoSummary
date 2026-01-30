import { describe, it, expect, beforeEach, vi } from "vitest";
import { getEnv, requireEnv, getSiteUrl } from "@/lib/env";
import type { RuntimeEnv } from "@/lib/env";

describe("Environment Variables Utilities", () => {
  let mockProcessEnv: Record<string, string | undefined>;
  let mockImportMetaEnv: Record<string, string | undefined>;

  beforeEach(() => {
    mockProcessEnv = {};
    vi.stubGlobal("process", {
      env: mockProcessEnv,
    });

    mockImportMetaEnv = {};
    vi.stubGlobal("import.meta", {
      env: mockImportMetaEnv,
    });
  });

  describe("getEnv", () => {
    it("should return value from runtimeEnv (highest priority)", () => {
      const runtimeEnv: RuntimeEnv = { TEST_VAR: "runtime_value" };
      mockProcessEnv.TEST_VAR = "process_value";
      mockImportMetaEnv.TEST_VAR = "import_value";

      const result = getEnv("TEST_VAR", runtimeEnv);
      expect(result).toBe("runtime_value");
    });

    it("should return value from process.env when runtimeEnv doesn't have it", () => {
      const runtimeEnv: RuntimeEnv = { OTHER_VAR: "runtime_value" };
      mockProcessEnv.TEST_VAR = "process_value";
      mockImportMetaEnv.TEST_VAR = "import_value";

      const result = getEnv("TEST_VAR", runtimeEnv);
      expect(result).toBe("process_value");
    });

    it("should return undefined when variable not found in runtimeEnv or process.env", () => {
      const runtimeEnv: RuntimeEnv = {};
      mockProcessEnv.OTHER_VAR = "process_value";

      const result = getEnv("TEST_VAR", runtimeEnv);
      expect(result).toBeUndefined();
    });

    it("should return undefined when variable not found in any source", () => {
      const runtimeEnv: RuntimeEnv = {};
      mockProcessEnv.OTHER_VAR = "process_value";
      mockImportMetaEnv.OTHER_VAR = "import_value";

      const result = getEnv("TEST_VAR", runtimeEnv);
      expect(result).toBeUndefined();
    });

    it("should return undefined when no runtimeEnv provided and globals don't exist", () => {
      // Temporarily remove globals
      vi.unstubAllGlobals();

      const result = getEnv("TEST_VAR");
      expect(result).toBeUndefined();
    });

    it("should fall back when runtimeEnv has empty string (falsy)", () => {
      const runtimeEnv: RuntimeEnv = { TEST_VAR: "" };
      mockProcessEnv.TEST_VAR = "process_value";

      const result = getEnv("TEST_VAR", runtimeEnv);
      // Empty string is falsy, so it falls back to process.env
      expect(result).toBe("process_value");
    });

    it("should fall back to process.env when runtimeEnv has undefined value", () => {
      const runtimeEnv: RuntimeEnv = { TEST_VAR: undefined };
      mockProcessEnv.TEST_VAR = "process_value";

      const result = getEnv("TEST_VAR", runtimeEnv);
      expect(result).toBe("process_value");
    });
  });

  describe("requireEnv", () => {
    it("should return value when found", () => {
      const runtimeEnv: RuntimeEnv = { TEST_VAR: "found_value" };

      const result = requireEnv("TEST_VAR", runtimeEnv);
      expect(result).toBe("found_value");
    });

    it("should throw error when value not found in runtime", () => {
      const runtimeEnv: RuntimeEnv = {};

      expect(() => requireEnv("TEST_VAR", runtimeEnv)).toThrow('Required environment variable "TEST_VAR" is not set');
    });

    it("should throw error for empty string value in runtime", () => {
      const runtimeEnv: RuntimeEnv = { TEST_VAR: "" };

      expect(() => requireEnv("TEST_VAR", runtimeEnv)).toThrow('Required environment variable "TEST_VAR" is not set');
    });

    it("should return placeholder when allowPlaceholder is true", () => {
      const runtimeEnv: RuntimeEnv = {};

      const result = requireEnv("TEST_VAR", runtimeEnv, true);
      expect(result).toBe("__PLACEHOLDER_TEST_VAR__");
    });

    it("should work with different variable names when allowPlaceholder is true", () => {
      const runtimeEnv: RuntimeEnv = {};

      expect(requireEnv("API_KEY", runtimeEnv, true)).toBe("__PLACEHOLDER_API_KEY__");
      expect(requireEnv("DATABASE_URL", runtimeEnv, true)).toBe("__PLACEHOLDER_DATABASE_URL__");
    });
  });

  describe("getSiteUrl", () => {
    it("should return localhost URL in development mode (runtimeEnv)", () => {
      const runtimeEnv: RuntimeEnv = { NODE_ENV: "development" };

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("http://localhost:3000/");
    });

    it("should return localhost URL in development mode (process.env)", () => {
      mockProcessEnv.NODE_ENV = "development";

      const result = getSiteUrl();
      expect(result).toBe("http://localhost:3000/");
    });

    it("should return custom HTTPS URL in production", () => {
      const runtimeEnv: RuntimeEnv = {
        NODE_ENV: "production",
        SITE_URL: "https://myapp.com",
      };

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://myapp.com/");
    });

    it("should add trailing slash to custom URL", () => {
      const runtimeEnv: RuntimeEnv = {
        NODE_ENV: "production",
        SITE_URL: "https://myapp.com",
      };

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://myapp.com/");
    });

    it("should not add extra trailing slash if already present", () => {
      const runtimeEnv: RuntimeEnv = {
        NODE_ENV: "production",
        SITE_URL: "https://myapp.com/",
      };

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://myapp.com/");
    });

    it("should reject HTTP URL in production and use fallback", () => {
      const runtimeEnv: RuntimeEnv = {
        NODE_ENV: "production",
        SITE_URL: "http://myapp.com",
      };

      // Mock console.warn to verify it's called
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://video-summary.pages.dev/");
      expect(consoleWarnSpy).toHaveBeenCalledWith("SITE_URL must use https in production, got: http:");

      consoleWarnSpy.mockRestore();
    });

    it("should handle malformed URL and use fallback", () => {
      const runtimeEnv: RuntimeEnv = {
        NODE_ENV: "production",
        SITE_URL: "not-a-url",
      };

      // Mock console.error to verify it's called
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://video-summary.pages.dev/");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Invalid SITE_URL format:", "not-a-url");

      consoleErrorSpy.mockRestore();
    });

    it("should use fallback when no SITE_URL provided in production", () => {
      const runtimeEnv: RuntimeEnv = {
        NODE_ENV: "production",
      };

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://video-summary.pages.dev/");
    });

    it("should use fallback when SITE_URL is empty in production", () => {
      const runtimeEnv: RuntimeEnv = {
        NODE_ENV: "production",
        SITE_URL: "",
      };

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://video-summary.pages.dev/");
    });

    it("should detect development mode from process.env.NODE_ENV when runtimeEnv not provided", () => {
      mockProcessEnv.NODE_ENV = "development";

      const result = getSiteUrl();
      expect(result).toBe("http://localhost:3000/");
    });

    it("should use production fallback when NODE_ENV not set", () => {
      const runtimeEnv: RuntimeEnv = {};

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://video-summary.pages.dev/");
    });

    it("should handle URL with port number", () => {
      const runtimeEnv: RuntimeEnv = {
        NODE_ENV: "production",
        SITE_URL: "https://myapp.com:8080",
      };

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://myapp.com:8080/");
    });

    it("should handle URL with path", () => {
      const runtimeEnv: RuntimeEnv = {
        NODE_ENV: "production",
        SITE_URL: "https://myapp.com/api",
      };

      const result = getSiteUrl(runtimeEnv);
      expect(result).toBe("https://myapp.com/api/");
    });
  });
});
