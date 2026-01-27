import { describe, it, expect } from "vitest";
import {
  EmailSchema,
  PasswordSchema,
  RegisterRequestSchema,
  LoginRequestSchema,
  ResetPasswordRequestSchema,
  ConfirmResetPasswordRequestSchema,
  SubscribeRequestSchema,
  GenerateSummaryRequestSchema,
  RateSummaryRequestSchema,
  UUIDSchema,
  PaginationSchema,
  SummaryListFiltersSchema,
  VideoListFiltersSchema,
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  describe("EmailSchema", () => {
    it("should validate correct email", () => {
      const result = EmailSchema.safeParse("test@example.com");
      expect(result.success).toBe(true);
      expect(result.data).toBe("test@example.com");
    });

    it("should validate email with subdomain", () => {
      const result = EmailSchema.safeParse("user@sub.example.com");
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = EmailSchema.safeParse("invalid-email");
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Invalid email format");
    });

    it("should reject empty email", () => {
      const result = EmailSchema.safeParse("");
      expect(result.success).toBe(false);
      // Zod checks email format first, then min length, so we get "Invalid email format"
      expect(result.error?.issues.some((issue) => issue.message === "Email is required")).toBe(true);
    });

    it("should reject email that is too long", () => {
      const longEmail = "a".repeat(245) + "@example.com"; // 254+ chars
      const result = EmailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Email is too long");
    });
  });

  describe("PasswordSchema", () => {
    it("should validate strong password", () => {
      const result = PasswordSchema.safeParse("StrongPass123!");
      expect(result.success).toBe(true);
    });

    it("should reject password too short", () => {
      const result = PasswordSchema.safeParse("Short1!");
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Password must be at least 8 characters long");
    });

    it("should reject password without uppercase", () => {
      const result = PasswordSchema.safeParse("password123!");
      expect(result.success).toBe(false);
    });

    it("should reject password without lowercase", () => {
      const result = PasswordSchema.safeParse("PASSWORD123!");
      expect(result.success).toBe(false);
    });

    it("should reject password without number", () => {
      const result = PasswordSchema.safeParse("Password!");
      expect(result.success).toBe(false);
    });

    it("should reject password without special character", () => {
      const result = PasswordSchema.safeParse("Password123");
      expect(result.success).toBe(false);
    });

    it("should reject password too long", () => {
      // Create a valid password that's too long
      const baseValidPassword = "ValidPass123!";
      const longPassword = baseValidPassword + "A".repeat(129 - baseValidPassword.length);
      const result = PasswordSchema.safeParse(longPassword);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Password is too long");
    });
  });

  describe("RegisterRequestSchema", () => {
    it("should validate correct registration data", () => {
      const data = {
        email: "test@example.com",
        password: "StrongPass123!",
      };
      const result = RegisterRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it("should reject invalid email", () => {
      const data = {
        email: "invalid-email",
        password: "StrongPass123!",
      };
      const result = RegisterRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject weak password", () => {
      const data = {
        email: "test@example.com",
        password: "weak",
      };
      const result = RegisterRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("LoginRequestSchema", () => {
    it("should validate correct login data", () => {
      const data = {
        email: "test@example.com",
        password: "anypassword",
      };
      const result = LoginRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const data = {
        email: "invalid-email",
        password: "password",
      };
      const result = LoginRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const data = {
        email: "test@example.com",
        password: "",
      };
      const result = LoginRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("ResetPasswordRequestSchema", () => {
    it("should validate correct reset request", () => {
      const data = { email: "test@example.com" };
      const result = ResetPasswordRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const data = { email: "invalid" };
      const result = ResetPasswordRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("ConfirmResetPasswordRequestSchema", () => {
    it("should validate correct confirmation data", () => {
      const data = {
        token: "valid-reset-token",
        password: "NewStrongPass123!",
      };
      const result = ConfirmResetPasswordRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject empty token", () => {
      const data = {
        token: "",
        password: "NewStrongPass123!",
      };
      const result = ConfirmResetPasswordRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject weak password", () => {
      const data = {
        token: "valid-token",
        password: "weak",
      };
      const result = ConfirmResetPasswordRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("SubscribeRequestSchema", () => {
    it("should validate YouTube channel URL", () => {
      const data = { channel_url: "https://www.youtube.com/@channelname" };
      const result = SubscribeRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate YouTube channel ID URL", () => {
      const data = { channel_url: "https://www.youtube.com/channel/UC1234567890123456789012" };
      const result = SubscribeRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject non-YouTube URL", () => {
      const data = { channel_url: "https://example.com/channel/test" };
      const result = SubscribeRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid URL format", () => {
      const data = { channel_url: "not-a-url" };
      const result = SubscribeRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("GenerateSummaryRequestSchema", () => {
    it("should validate YouTube video URL", () => {
      const data = { video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };
      const result = GenerateSummaryRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate youtu.be URL", () => {
      const data = { video_url: "https://youtu.be/dQw4w9WgXcQ" };
      const result = GenerateSummaryRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject non-YouTube URL", () => {
      const data = { video_url: "https://example.com/watch?v=test" };
      const result = GenerateSummaryRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject channel URL", () => {
      const data = { video_url: "https://www.youtube.com/channel/UC1234567890123456789012" };
      const result = GenerateSummaryRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("RateSummaryRequestSchema", () => {
    it("should validate true rating", () => {
      const data = { rating: true };
      const result = RateSummaryRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate false rating", () => {
      const data = { rating: false };
      const result = RateSummaryRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject non-boolean rating", () => {
      const data = { rating: "true" };
      const result = RateSummaryRequestSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("UUIDSchema", () => {
    it("should validate correct UUID", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = UUIDSchema.safeParse(uuid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID format", () => {
      const invalid = "not-a-uuid";
      const result = UUIDSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Invalid UUID format");
    });
  });

  describe("PaginationSchema", () => {
    it("should validate correct pagination params", () => {
      const data = { limit: 50, offset: 10 };
      const result = PaginationSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it("should apply default values", () => {
      const data = {};
      const result = PaginationSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ limit: 50, offset: 0 });
    });

    it("should reject limit too low", () => {
      const data = { limit: 0 };
      const result = PaginationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject limit too high", () => {
      const data = { limit: 101 };
      const result = PaginationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const data = { offset: -1 };
      const result = PaginationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("SummaryListFiltersSchema", () => {
    it("should validate complete filter object", () => {
      const data = {
        limit: 20,
        offset: 0,
        channel_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "completed",
        sort: "published_at_desc",
        include_hidden: true,
        hidden_only: false,
        search: "test query",
      };
      const result = SummaryListFiltersSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle boolean preprocessing", () => {
      const testCases = [
        { input: "false", expected: false },
        { input: "0", expected: false },
        { input: "", expected: false },
        { input: null, expected: false },
        { input: undefined, expected: false },
        { input: "true", expected: true },
        { input: "1", expected: true },
        { input: true, expected: true },
        { input: false, expected: false },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = SummaryListFiltersSchema.safeParse({
          include_hidden: input,
          hidden_only: input,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.include_hidden).toBe(expected);
          expect(result.data.hidden_only).toBe(expected);
        }
      });
    });

    it("should reject search too short", () => {
      const data = { search: "ab" }; // less than 3 chars
      const result = SummaryListFiltersSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept search with 3+ characters", () => {
      const data = { search: "abc" };
      const result = SummaryListFiltersSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("VideoListFiltersSchema", () => {
    it("should validate video filter object", () => {
      const data = {
        channel_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "with",
        search: "test",
        sort: "published_at_desc",
      };
      const result = VideoListFiltersSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate status enum values", () => {
      const validStatuses = ["all", "with", "without"];
      validStatuses.forEach((status) => {
        const result = VideoListFiltersSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });

      const result = VideoListFiltersSchema.safeParse({ status: "invalid" });
      expect(result.success).toBe(false);
    });
  });
});
