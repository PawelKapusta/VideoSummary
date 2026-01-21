y import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createAwsTraceId,
  isValidAwsTraceId,
  getAwsTraceId,
  createTraceHeaders,
  addTraceIdToHeaders,
} from "@/lib/trace";

describe("AWS X-Ray Trace Utilities", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.useRealTimers();

    // Mock Date.now() to return a consistent timestamp
    vi.spyOn(Date, "now").mockReturnValue(1609459200000); // 2021-01-01 00:00:00 UTC

    // Mock crypto.randomUUID to return a consistent UUID
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "12345678-1234-1234-1234-123456789abc"),
    });
  });

  describe("createAwsTraceId", () => {
    it("should create a valid AWS X-Ray trace ID format", () => {
      const traceId = createAwsTraceId();

      // Should match the pattern: 1-{8 hex chars}-{24 hex chars}
      expect(traceId).toMatch(/^1-[0-9a-f]{8}-[0-9a-f]{24}$/);
    });

    it("should create deterministic trace ID with mocked values", () => {
      const traceId = createAwsTraceId();
      expect(traceId).toMatch(/^1-[0-9a-f]{8}-[0-9a-f]{24}$/);

      const traceId2 = createAwsTraceId();
      expect(traceId).toBe(traceId2);
    });

    it("should generate different trace IDs on subsequent calls", () => {
      const cryptoMock = vi.mocked(global.crypto);
      cryptoMock.randomUUID
        .mockReturnValueOnce("12345678-1234-1234-1234-123456789abc")
        .mockReturnValueOnce("abcdef12-3456-7890-abcd-ef1234567890");

      const traceId1 = createAwsTraceId();
      const traceId2 = createAwsTraceId();

      expect(traceId1).not.toBe(traceId2);
      expect(isValidAwsTraceId(traceId1)).toBe(true);
      expect(isValidAwsTraceId(traceId2)).toBe(true);
    });

    it("should use current timestamp in hex format", () => {
      vi.spyOn(Date, "now").mockReturnValue(1609459260000);
      const traceId = createAwsTraceId();

      expect(traceId).toMatch(/^1-[0-9a-f]{8}-[0-9a-f]{24}$/);
      expect(isValidAwsTraceId(traceId)).toBe(true);
    });
  });

  describe("isValidAwsTraceId", () => {
    it("should validate correct AWS X-Ray trace ID format", () => {
      const validTraceId = "1-58406520-a006649127e371903a2de979";
      expect(isValidAwsTraceId(validTraceId)).toBe(true);
    });

    it("should validate generated trace ID", () => {
      const generatedTraceId = createAwsTraceId();
      expect(isValidAwsTraceId(generatedTraceId)).toBe(true);
    });

    it("should reject trace ID without version prefix", () => {
      const invalidTraceId = "58406520-a006649127e371903a2de979";
      expect(isValidAwsTraceId(invalidTraceId)).toBe(false);
    });

    it("should reject trace ID with wrong version", () => {
      const invalidTraceId = "2-58406520-a006649127e371903a2de979";
      expect(isValidAwsTraceId(invalidTraceId)).toBe(false);
    });

    it("should reject trace ID with too short timestamp", () => {
      const invalidTraceId = "1-5840652-a006649127e371903a2de979"; // 7 chars instead of 8
      expect(isValidAwsTraceId(invalidTraceId)).toBe(false);
    });

    it("should reject trace ID with too long timestamp", () => {
      const invalidTraceId = "1-584065200-a006649127e371903a2de979"; // 9 chars instead of 8
      expect(isValidAwsTraceId(invalidTraceId)).toBe(false);
    });

    it("should reject trace ID with too short random part", () => {
      const invalidTraceId = "1-58406520-a006649127e371903a2de97"; // 23 chars instead of 24
      expect(isValidAwsTraceId(invalidTraceId)).toBe(false);
    });

    it("should reject trace ID with too long random part", () => {
      const invalidTraceId = "1-58406520-a006649127e371903a2de9790"; // 25 chars instead of 24
      expect(isValidAwsTraceId(invalidTraceId)).toBe(false);
    });

    it("should reject trace ID with invalid hex characters", () => {
      const invalidTraceId = "1-5840652g-a006649127e371903a2de979"; // 'g' is not hex
      expect(isValidAwsTraceId(invalidTraceId)).toBe(false);
    });

    it("should reject trace ID with uppercase letters", () => {
      const invalidTraceId = "1-58406520-A006649127E371903A2DE979"; // Uppercase not allowed
      expect(isValidAwsTraceId(invalidTraceId)).toBe(false);
    });

    it("should reject empty string", () => {
      expect(isValidAwsTraceId("")).toBe(false);
    });

    it("should reject malformed trace ID", () => {
      expect(isValidAwsTraceId("not-a-trace-id")).toBe(false);
      expect(isValidAwsTraceId("1-")).toBe(false);
      expect(isValidAwsTraceId("1-58406520")).toBe(false);
      expect(isValidAwsTraceId("1-58406520-")).toBe(false);
    });
  });

  describe("getAwsTraceId", () => {
    it("should return existing valid trace ID from headers", () => {
      const headers = { "x-amzn-trace-id": "1-58406520-a006649127e371903a2de979" };
      const result = getAwsTraceId(headers);
      expect(result).toBe("1-58406520-a006649127e371903a2de979");
    });

    it("should create new trace ID when headers are undefined", () => {
      const result = getAwsTraceId();
      expect(result).toMatch(/^1-[0-9a-f]{8}-[0-9a-f]{24}$/);
      expect(isValidAwsTraceId(result)).toBe(true);
    });

    it("should create new trace ID when x-amzn-trace-id header is missing", () => {
      const headers = { "other-header": "value" };
      const result = getAwsTraceId(headers);
      expect(result).toMatch(/^1-[0-9a-f]{8}-[0-9a-f]{24}$/);
      expect(isValidAwsTraceId(result)).toBe(true);
    });

    it("should create new trace ID when trace ID in headers is invalid", () => {
      const headers = { "x-amzn-trace-id": "invalid-trace-id" };
      const result = getAwsTraceId(headers);
      expect(result).toMatch(/^1-[0-9a-f]{8}-[0-9a-f]{24}$/);
      expect(isValidAwsTraceId(result)).toBe(true);
    });

    it("should return existing trace ID even if other headers are present", () => {
      const headers = {
        "x-amzn-trace-id": "1-58406520-a006649127e371903a2de979",
        "other-header": "value",
      };
      const result = getAwsTraceId(headers);
      expect(result).toBe("1-58406520-a006649127e371903a2de979");
    });
  });

  describe("createTraceHeaders", () => {
    it("should create headers with provided trace ID", () => {
      const traceId = "1-58406520-a006649127e371903a2de979";
      const headers = createTraceHeaders(traceId);

      expect(headers).toEqual({
        "x-amzn-trace-id": "1-58406520-a006649127e371903a2de979",
      });
    });

    it("should create headers with new trace ID when none provided", () => {
      const headers = createTraceHeaders();

      expect(headers).toHaveProperty("x-amzn-trace-id");
      expect(isValidAwsTraceId(headers["x-amzn-trace-id"])).toBe(true);
    });

    it("should create headers object with single property", () => {
      const headers = createTraceHeaders();
      expect(Object.keys(headers)).toHaveLength(1);
      expect(headers).toHaveProperty("x-amzn-trace-id");
    });
  });

  describe("addTraceIdToHeaders", () => {
    it("should add trace ID to existing headers", () => {
      const existingHeaders = {
        "Content-Type": "application/json",
        "Authorization": "Bearer token",
      };

      const result = addTraceIdToHeaders(existingHeaders);

      expect(result).toHaveProperty("Content-Type", "application/json");
      expect(result).toHaveProperty("Authorization", "Bearer token");
      expect(result).toHaveProperty("x-amzn-trace-id");
      expect(isValidAwsTraceId(result["x-amzn-trace-id"])).toBe(true);
    });

    it("should add specific trace ID to existing headers", () => {
      const existingHeaders = { "Content-Type": "application/json" };
      const traceId = "1-58406520-a006649127e371903a2de979";

      const result = addTraceIdToHeaders(existingHeaders, traceId);

      expect(result).toEqual({
        "Content-Type": "application/json",
        "x-amzn-trace-id": "1-58406520-a006649127e371903a2de979",
      });
    });

    it("should override existing x-amzn-trace-id header", () => {
      const existingHeaders = {
        "x-amzn-trace-id": "old-trace-id",
        "Content-Type": "application/json",
      };

      const result = addTraceIdToHeaders(existingHeaders);

      expect(result).toHaveProperty("Content-Type", "application/json");
      expect(result).toHaveProperty("x-amzn-trace-id");
      expect(result["x-amzn-trace-id"]).not.toBe("old-trace-id");
      expect(isValidAwsTraceId(result["x-amzn-trace-id"])).toBe(true);
    });

    it("should handle empty headers object", () => {
      const result = addTraceIdToHeaders({});

      expect(result).toHaveProperty("x-amzn-trace-id");
      expect(isValidAwsTraceId(result["x-amzn-trace-id"])).toBe(true);
      expect(Object.keys(result)).toHaveLength(1);
    });

    it("should preserve original headers object (immutable)", () => {
      const originalHeaders = { "Content-Type": "application/json" };
      const result = addTraceIdToHeaders(originalHeaders);

      expect(originalHeaders).toEqual({ "Content-Type": "application/json" });
      expect(result).not.toBe(originalHeaders); // Different object reference
    });
  });
});