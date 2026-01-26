import { z } from "zod";

/**
 * Email validation schema - RFC 5322 compliant format
 */
export const EmailSchema = z
  .string()
  .email({ message: "Invalid email format" })
  .min(1, { message: "Email is required" })
  .max(254, { message: "Email is too long" }); // RFC 5321 limit

/**
 * Username validation schema - 3-30 characters, alphanumeric + underscore/dash only
 */
export const UsernameSchema = z
  .string()
  .min(3, { message: "Username must be at least 3 characters long" })
  .max(30, { message: "Username must be at most 30 characters long" })
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: "Username can only contain letters, numbers, underscores, and dashes",
  })
  .optional();

/**
 * Password validation schema - minimum 8 characters with complexity requirements
 */
export const PasswordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};"\\|,.<>?/])/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  .max(128, { message: "Password is too long" }); // Reasonable limit for security

/**
 * User registration request validation schema
 */
export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

/**
 * User login request validation schema
 */
export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

/**
 * Password reset request validation schema
 */
export const ResetPasswordRequestSchema = z.object({
  email: EmailSchema,
});

/**
 * Password reset confirmation request validation schema
 */
export const ConfirmResetPasswordRequestSchema = z.object({
  token: z.string().min(1, { message: "Reset token is required" }),
  password: PasswordSchema,
});

/**
 * Channel subscription request validation schema
 */
export const SubscribeRequestSchema = z.object({
  channel_url: z
    .string()
    .url({ message: "Invalid URL format" })
    .regex(/^https?:\/\/(www\.)?(youtube\.com\/(channel\/|user\/|@|c\/)|youtu\.be\/)/, {
      message: "URL must be a valid YouTube channel URL",
    }),
});

/**
 * Manual summary generation request validation schema
 */
export const GenerateSummaryRequestSchema = z.object({
  video_url: z
    .string()
    .url({ message: "Invalid URL format" })
    .regex(/^https?:\/\/(www\.)?(youtube\.com\/watch\?|youtu\.be\/)/, {
      message: "URL must be a valid YouTube video URL",
    }),
});

/**
 * Summary rating request validation schema
 */
export const RateSummaryRequestSchema = z.object({
  rating: z.boolean({ message: "Rating must be true (upvote) or false (downvote)" }),
});

/**
 * UUID validation schema for path parameters
 */
export const UUIDSchema = z.string().uuid({ message: "Invalid UUID format" });

/**
 * Pagination query parameters validation schema
 */
export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Summary list filter validation schema
 */
export const SummaryListFiltersSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  channel_id: z.string().uuid().optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]).optional(),
  sort: z.enum(["published_at_desc", "published_at_asc", "generated_at_desc"]).default("published_at_desc"),
  // Fix: z.coerce.boolean() treats "false" string as true! Use custom transform
  include_hidden: z.preprocess((val) => {
    if (val === "false" || val === "0" || val === "" || val === null || val === undefined) return false;
    if (val === "true" || val === "1") return true;
    return Boolean(val);
  }, z.boolean().default(false)),
  hidden_only: z.preprocess((val) => {
    if (val === "false" || val === "0" || val === "" || val === null || val === undefined) return false;
    if (val === "true" || val === "1") return true;
    return Boolean(val);
  }, z.boolean().default(false)),
  search: z.string().min(3).optional(),
  generated_at_from: z.string().datetime({ message: "Invalid ISO date format for generated_at_from" }).optional(),
  generated_at_to: z.string().datetime({ message: "Invalid ISO date format for generated_at_to" }).optional(),
});

/**
 * Video list filter validation schema
 */
export const VideoListFiltersSchema = PaginationSchema.extend({
  channel_id: UUIDSchema.optional(),
  status: z.enum(["all", "with", "without"]).optional(),
  search: z.string().optional(),
  sort: z.enum(["published_at_desc", "published_at_asc"]).default("published_at_desc"),
  published_at_from: z.string().datetime({ message: "Invalid ISO date format for published_at_from" }).optional(),
  published_at_to: z.string().datetime({ message: "Invalid ISO date format for published_at_to" }).optional(),
});

/**
 * User profile update request validation schema
 */
export const UpdateProfileRequestSchema = z.object({
  email: EmailSchema.optional(),
  username: UsernameSchema.optional(),
});

/**
 * Summary update request validation schema (admin only)
 */
export const UpdateSummaryRequestSchema = z.object({
  tldr: z.string().min(10).max(500).optional(),
  full_summary: z.any().optional(), // JSON summary data
  status: z.enum(["pending", "in_progress", "completed", "failed"]).optional(),
  error_code: z.enum(["TRANSCRIPT_NOT_AVAILABLE", "NO_SUBTITLES", "VIDEO_TOO_LONG", "AI_ERROR", "UNKNOWN_ERROR"]).optional(),
});

/**
 * Subscription update request validation schema
 */
export const UpdateSubscriptionRequestSchema = z.object({
  // Currently no fields to update, but structure ready for future extensions
  // Example: notification preferences, auto-generate settings, etc.
});
