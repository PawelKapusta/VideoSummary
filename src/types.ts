import type { Database, Tables } from './db/database.types';

// ============================================================================
// BASE ENTITY TYPES (derived from database tables)
// ============================================================================

/** Basic channel information for responses */
export type Channel = Pick<Tables<'channels'>, 'id' | 'youtube_channel_id' | 'name' | 'created_at'>;

/** Basic video information for list views */
export type VideoBasic = Pick<Tables<'videos'>, 'id' | 'youtube_video_id' | 'title' | 'thumbnail_url' | 'published_at'>;

/** Video with computed YouTube URL for detailed views */
export type VideoWithUrl = VideoBasic & {
  youtube_url: string;
};

/** Basic summary information */
export type SummaryBasic = Pick<Tables<'summaries'>, 'id' | 'status' | 'generated_at'>;

/** Complete summary information with all fields */
export type SummaryFull = Pick<Tables<'summaries'>, 'id' | 'video_id' | 'tldr' | 'full_summary' | 'status' | 'error_code' | 'generated_at'>;

/** Basic profile information */
export type Profile = Pick<Tables<'profiles'>, 'id' | 'created_at'>;

/** Subscription information */
export type Subscription = Pick<Tables<'subscriptions'>, 'id' | 'user_id' | 'channel_id' | 'created_at'>;

/** Summary rating information */
export type SummaryRating = Pick<Tables<'summary_ratings'>, 'id' | 'user_id' | 'summary_id' | 'rating' | 'created_at'>;

/** Hidden summary information */
export type HiddenSummary = Pick<Tables<'hidden_summaries'>, 'id' | 'user_id' | 'summary_id' | 'hidden_at'>;

/** Generation request information */
export type GenerationRequest = Pick<Tables<'generation_requests'>, 'id' | 'user_id' | 'video_id' | 'created_at'>;

/** Aggregated rating statistics */
export type RatingStats = {
  upvotes: number;
  downvotes: number;
};

// ============================================================================
// REQUEST DTOs (Command Models)
// ============================================================================

/** User registration request payload */
export interface RegisterRequest {
  email: string;
  password: string;
}

/** User login request payload */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Password reset request payload */
export interface ResetPasswordRequest {
  email: string;
}

/** Password reset confirmation request payload */
export interface ConfirmResetPasswordRequest {
  token: string;
  password: string;
}

/** Channel subscription request payload */
export interface SubscribeRequest {
  channel_url: string;
}

/** Manual summary generation request payload */
export interface GenerateSummaryRequest {
  video_url: string;
}

/** Summary rating request payload */
export interface RateSummaryRequest {
  rating: boolean;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/** Authentication response with user and session data */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/** User profile with subscription information */
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  subscribed_channels: SubscriptionWithChannel[];
  subscription_count: number;
}

/** Subscription data with embedded channel information */
export interface SubscriptionWithChannel {
  subscription_id: string;
  channel: Channel;
  subscribed_at: string;
}

/** Video summary for list views (includes summary existence flag) */
export interface VideoSummary {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
  channel: Channel;
  summary_id: string | null;
  summary_status: SummaryStatus | null;
}

/** Summary with video information for list views */
export interface SummaryWithVideo {
  id: string;
  video: VideoBasic;
  channel: Channel;
  tldr: string | null;
  status: Database['public']['Enums']['summary_status'];
  generated_at: string | null;
  user_rating: boolean | null;
  error_code?: SummaryErrorCode | null; // Add optional for failed
  summary_data?: Pick<SummaryData, 'duration' | 'language'>;
}

/** Detailed summary with full information */
export interface DetailedSummary {
  id: string;
  video: VideoWithUrl;
  channel: Channel;
  tldr: string | null;
  full_summary: SummaryData | null;
  status: Database['public']['Enums']['summary_status'];
  error_code: Database['public']['Enums']['summary_error_code'] | null;
  generated_at: string | null;
  rating_stats: RatingStats;
  user_rating: boolean | null;
  is_hidden: boolean;
}

/** Detailed video information with optional summary */
export interface DetailedVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
  metadata_last_checked_at: string | null;
  channel: Channel;
  summary: SummaryBasic | null;
}

/** Summary generation status response */
export interface GenerationStatusResponse {
  channel_id: string;
  can_generate: boolean;
  successful_summaries_today_global: number;
  limit: number;
  last_successful_generation_at: string | null;
  note: string;
}

/** Rating creation/update response */
export interface RatingResponse {
  id: string;
  summary_id: string;
  rating: boolean;
  created_at: string;
  message: string;
}

/** Atomic subscription function result */
export interface AtomicSubscriptionResult {
  id: string;
  user_id: string;
  channel_id: string;
  created_at: string;
  channels: {
    id: string;
    youtube_channel_id: string;
    name: string;
    created_at: string;
  };
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/** Standard pagination metadata */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Summary status enum values */
export type SummaryStatus = Database['public']['Enums']['summary_status'];

/** Summary error code enum values */
export type SummaryErrorCode = Database['public']['Enums']['summary_error_code'];

/** Standard API error response */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

/** Standard API success response */
export interface ApiSuccess<T = void> {
  data?: T;
  message?: string;
}

// ============================================================================
// LOGIN VIEW SPECIFIC TYPES
// ============================================================================

/** Form data type for login form (matches LoginRequest but can be extended with UI-specific fields) */
export interface LoginFormData {
  email: string;
  password: string;
}

/** Form validation errors type for login form */
export interface LoginFormErrors {
  email?: string;
  password?: string;
  form?: string; // General form-level errors
}

/** Form state type for login form */
export interface LoginFormState {
  data: LoginFormData;
  errors: LoginFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

/** Error codes from login API for type-safe error handling */
export type LoginErrorCode = 
  | 'INVALID_INPUT'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

/** Toast notification type */
export interface ToastNotification {
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

// ============================================================================
// REGISTER VIEW SPECIFIC TYPES
// ============================================================================

/** Form data type for register form (extends RegisterRequest with confirmPassword for UI) */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

/** Form validation errors type for register form */
export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string; // General form-level errors
}

/** Form state type for register form */
export interface RegisterFormState {
  data: RegisterFormData;
  errors: RegisterFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

/** Error codes from register API for type-safe error handling */
export type RegisterErrorCode = 
  | 'INVALID_INPUT'
  | 'EMAIL_ALREADY_EXISTS'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

// ============================================================================
// RESET PASSWORD VIEW SPECIFIC TYPES
// ============================================================================

/** Form data type for reset password form */
export interface ResetFormData {
  email: string;
}

/** Form validation errors type for reset password form */
export interface ResetFormErrors {
  email?: string;
  form?: string; // General form-level errors
}

/** Form state type for reset password form */
export interface ResetFormState {
  data: ResetFormData;
  errors: ResetFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// CONFIRM PASSWORD RESET VIEW SPECIFIC TYPES
// ============================================================================

/** Form data type for confirm reset password form */
export interface ConfirmResetFormData {
  password: string;
  confirmPassword: string;
}

/** Form validation errors type for confirm reset password form */
export interface ConfirmResetFormErrors {
  password?: string;
  confirmPassword?: string;
  form?: string; // General form-level errors
}

/** Form state type for confirm reset password form */
export interface ConfirmResetFormState {
  data: ConfirmResetFormData;
  errors: ConfirmResetFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// DATABASE INSERT/UPDATE TYPES (for internal use)
// ============================================================================

/** Insert types for database operations */
export type ChannelInsert = Database['public']['Tables']['channels']['Insert'];
export type ChannelUpdate = Database['public']['Tables']['channels']['Update'];
export type VideoInsert = Database['public']['Tables']['videos']['Insert'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];
export type SummaryInsert = Database['public']['Tables']['summaries']['Insert'];
export type SummaryUpdate = Database['public']['Tables']['summaries']['Update'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];
export type SummaryRatingInsert = Database['public']['Tables']['summary_ratings']['Insert'];
export type SummaryRatingUpdate = Database['public']['Tables']['summary_ratings']['Update'];
export type HiddenSummaryInsert = Database['public']['Tables']['hidden_summaries']['Insert'];
export type HiddenSummaryUpdate = Database['public']['Tables']['hidden_summaries']['Update'];
export type GenerationRequestInsert = Database['public']['Tables']['generation_requests']['Insert'];
export type GenerationRequestUpdate = Database['public']['Tables']['generation_requests']['Update'];

export interface FilterOptions {
  search?: string;
  channel_id?: string | null;
  status?: SummaryStatus;
  sort?: string;
  include_hidden?: boolean;
  hidden_only?: boolean;
  limit?: number;
}

export interface SummaryData {
  genre: string;
  key_points: string[];
  detailed_summary: string;
  conclusions: string[];
  memorable_quotes: string[];
  duration: string;
  language: string;
  worth_watching: string;
}

export interface SummaryDetailsViewModel {
  id: string;
  video: {
    id: string;
    title: string;
    youtube_url: string;
    published_at: string;
  };
  channel: {
    id: string;
    name: string;
  };
  tldr: string | null;
  full_summary: SummaryData | null;
  status: SummaryStatus;
  generated_at: string | null;
  rating_stats: RatingStats;
  user_rating: boolean | null;
}

// ============================================================================
// GENERATE SUMMARY VIEW SPECIFIC TYPES
// ============================================================================

export interface VideoMetaResponse {
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  duration_seconds: number;
  channel: {
    id: string; // Database UUID for the channel
    youtube_channel_id: string;
    name: string;
  };
  is_subscribed: boolean;
  summary_status: string | null;
}

export interface VideoPreviewViewModel {
  title: string;
  channelName: string;
  thumbnailUrl: string;
  durationInMinutes: number;
}

export interface ValidationStep {
  text: string;
  status: 'pending' | 'checking' | 'success' | 'error';
  error_message?: string;
}

export interface ValidationStatusViewModel {
  isUrlValid: ValidationStep;
  isSubscribed: ValidationStep;
  isWithinLimit: ValidationStep;
  isDurationValid: ValidationStep;
  isNotAlreadyGenerating: ValidationStep;
}

// ============================================================================
// VIDEOS VIEW SPECIFIC TYPES
// ============================================================================

/**
 * Represents the state of the filters applied to the videos list.
 */
export interface VideosFilterState {
  channelId: string | 'all';
  summaryStatus: 'all' | 'with' | 'without';
  searchQuery?: string;
  sort?: 'published_at_desc' | 'published_at_asc';
}
