import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSupportTicketId } from "@/lib/logger";

describe("Logger Utilities", () => {
  let mockProcessEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Mock Date.now() for consistent timestamps
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1609459200000)); // 2021-01-01 00:00:00 UTC

    // Mock process.env
    mockProcessEnv = {};
    vi.stubGlobal("process", {
      env: mockProcessEnv,
    });
  });

  describe("createSupportTicketId", () => {
    it("should create support ticket ID with correct format", () => {
      const userId = "user123";
      const ticketId = createSupportTicketId(userId);

      // Should start with SUPPORT_
      expect(ticketId).toMatch(/^SUPPORT_/);
      // Should contain uppercase letters and/or numbers after SUPPORT_
      expect(ticketId.length).toBeGreaterThan(8); // SUPPORT_ + at least 1 character
    });

    it("should create deterministic ticket ID with default salt", () => {
      const userId = "user123";
      const ticketId1 = createSupportTicketId(userId);
      const ticketId2 = createSupportTicketId(userId);

      // Should be the same for same input (deterministic)
      expect(ticketId1).toBe(ticketId2);
    });

    it("should create different ticket IDs for different users", () => {
      const ticketId1 = createSupportTicketId("user1");
      const ticketId2 = createSupportTicketId("user2");

      expect(ticketId1).not.toBe(ticketId2);
    });

    it("should use custom salt from environment", () => {
      mockProcessEnv.LOG_SALT = "custom_salt_2024";

      const userId = "user123";
      const ticketId = createSupportTicketId(userId);

      // With custom salt, should still have correct format
      expect(ticketId).toMatch(/^SUPPORT_/);
    });

    it("should use default salt when LOG_SALT not set", () => {
      // Ensure LOG_SALT is not set
      delete mockProcessEnv.LOG_SALT;

      const userId = "user123";
      const ticketId = createSupportTicketId(userId);

      // Should use default salt and have correct format
      expect(ticketId).toMatch(/^SUPPORT_/);
    });

    it("should handle empty userId", () => {
      const ticketId = createSupportTicketId("");
      expect(ticketId).toMatch(/^SUPPORT_/);
    });

    it("should handle userId with special characters", () => {
      const ticketId = createSupportTicketId("user@test.com");
      expect(ticketId).toMatch(/^SUPPORT_/);
    });

    it("should handle userId with unicode characters", () => {
      const ticketId = createSupportTicketId("user_测试");
      expect(ticketId).toMatch(/^SUPPORT_/);
    });

    it("should create different IDs with different timestamps", () => {
      const userId = "user123";
      const ticketId1 = createSupportTicketId(userId);

      // Advance time by 1 second
      vi.setSystemTime(new Date(1609459201000)); // 1 second later
      const ticketId2 = createSupportTicketId(userId);

      // Should be different due to different timestamp
      expect(ticketId1).not.toBe(ticketId2);
    });

    it("should create different IDs with different salts", () => {
      const userId = "user123";

      // First with default salt
      const ticketId1 = createSupportTicketId(userId);

      // Then with custom salt
      mockProcessEnv.LOG_SALT = "different_salt";
      const ticketId2 = createSupportTicketId(userId);

      expect(ticketId1).not.toBe(ticketId2);
    });

    it("should always return consistent format", () => {
      const testCases = [
        "a",
        "user123",
        "very_long_user_id_with_many_characters",
        "123456789",
        "special-chars@#$%",
      ];

      testCases.forEach(userId => {
        const ticketId = createSupportTicketId(userId);
        const hashPart = ticketId.replace("SUPPORT_", "");
        expect(hashPart.length).toBeGreaterThan(0);
        expect(hashPart).toMatch(/^[A-Z0-9]+$/);
      });
    });

    it("should produce consistent results for same input", () => {
      const userId = "testuser";

      const ticketId1 = createSupportTicketId(userId);
      const ticketId2 = createSupportTicketId(userId);
      expect(ticketId1).toBe(ticketId2);
    });
  });
});