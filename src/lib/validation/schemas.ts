import { z } from 'zod';

/**
 * Email validation schema - RFC 5322 compliant format
 */
export const EmailSchema = z
  .string()
  .email({ message: 'Invalid email format' })
  .min(1, { message: 'Email is required' })
  .max(254, { message: 'Email is too long' }); // RFC 5321 limit

/**
 * Password validation schema - minimum 8 characters with complexity requirements
 */
export const PasswordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  })
  .max(128, { message: 'Password is too long' }); // Reasonable limit for security

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
  password: z.string().min(1, { message: 'Password is required' }),
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
  token: z.string().min(1, { message: 'Reset token is required' }),
  password: PasswordSchema,
});

/**
 * Channel subscription request validation schema
 */
export const SubscribeRequestSchema = z.object({
  channel_url: z
    .string()
    .url({ message: 'Invalid URL format' })
    .regex(/^https?:\/\/(www\.)?(youtube\.com\/(channel\/|user\/|@|c\/)|youtu\.be\/)/, {
      message: 'URL must be a valid YouTube channel URL'
    }),
});

/**
 * Manual summary generation request validation schema
 */
export const GenerateSummaryRequestSchema = z.object({
  video_url: z
    .string()
    .url({ message: 'Invalid URL format' })
    .regex(/^https?:\/\/(www\.)?(youtube\.com\/watch\?|youtu\.be\/)/, {
      message: 'URL must be a valid YouTube video URL'
    }),
});

/**
 * Summary rating request validation schema
 */
export const RateSummaryRequestSchema = z.object({
  rating: z.boolean({ message: 'Rating must be true (upvote) or false (downvote)' }),
});

/**
 * UUID validation schema for path parameters
 */
export const UUIDSchema = z.string().uuid({ message: 'Invalid UUID format' });

/**
 * Pagination query parameters validation schema
 */
export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Summary list filter validation schema
 */
export const SummaryListFiltersSchema = PaginationSchema.extend({
  channel_id: UUIDSchema.optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
  sort: z.enum(['published_at_desc', 'published_at_asc', 'generated_at_desc']).default('published_at_desc'),
  include_hidden: z.coerce.boolean().default(false),
});

/**
 * Video list filter validation schema
 */
export const VideoListFiltersSchema = PaginationSchema.extend({
  channel_id: UUIDSchema.optional(),
  sort: z.enum(['published_at_desc', 'published_at_asc']).default('published_at_desc'),
});
