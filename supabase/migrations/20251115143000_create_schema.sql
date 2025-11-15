-- Migration: Create Schema
-- Purpose: Create ENUM types and all core tables for YTInsights application
-- Affected: ENUM types, profiles, channels, subscriptions, videos, summaries, summary_ratings, generation_requests tables
-- Special Considerations: 
--   - RLS is enabled on all tables but policies are added in a separate migration
--   - Uses auth.users from Supabase Auth for user management
--   - All timestamps use timestamptz for timezone awareness

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- create enum type for tracking summary generation status
create type summary_status as enum (
  'pending',
  'in_progress',
  'completed',
  'failed'
);

-- create enum type for summary generation error codes
create type summary_error_code as enum (
  'NO_SUBTITLES',
  'VIDEO_PRIVATE',
  'VIDEO_TOO_LONG'
);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- create profiles table to store public user data
-- extends auth.users with additional user information
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- enable row level security on profiles table
alter table profiles enable row level security;

-- ============================================================================
-- CHANNELS TABLE
-- ============================================================================

-- create channels table to store youtube channel information
-- channels are shared resources across all users
create table channels (
  id uuid primary key default gen_random_uuid(),
  youtube_channel_id text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- enable row level security on channels table
alter table channels enable row level security;

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

-- create subscriptions table to model many-to-many relationship between users and channels
-- a user can subscribe to multiple channels, and a channel can have multiple subscribers
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid not null references channels(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- ensure each user can only subscribe to a channel once
  constraint unique_user_channel_subscription unique (user_id, channel_id)
);

-- enable row level security on subscriptions table
alter table subscriptions enable row level security;

-- ============================================================================
-- VIDEOS TABLE
-- ============================================================================

-- create videos table to store youtube video information and metadata
-- videos belong to channels and are shared resources
create table videos (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null unique,
  channel_id uuid not null references channels(id) on delete cascade,
  title text not null,
  thumbnail_url text,
  published_at timestamptz,
  -- track when we last checked/updated the video metadata from youtube
  metadata_last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

-- enable row level security on videos table
alter table videos enable row level security;

-- ============================================================================
-- SUMMARIES TABLE
-- ============================================================================

-- create summaries table to store generated video summaries
-- summaries are shared resources with a 1-to-1 relationship with videos
create table summaries (
  id uuid primary key default gen_random_uuid(),
  -- one-to-one relationship: each video can have at most one summary
  video_id uuid not null unique references videos(id) on delete cascade,
  -- short tldr summary
  tldr text,
  -- full summary stored as json with summary, conclusions, and key_points
  full_summary jsonb,
  -- current status of the summary generation process
  status summary_status not null default 'pending',
  -- error code if generation failed
  error_code summary_error_code,
  generated_at timestamptz default now()
);

-- enable row level security on summaries table
alter table summaries enable row level security;

-- ============================================================================
-- SUMMARY_RATINGS TABLE
-- ============================================================================

-- create summary_ratings table to store user ratings for summaries
-- allows users to upvote or downvote summaries
create table summary_ratings (
  id uuid primary key default gen_random_uuid(),
  -- user_id is set to null when user is deleted to preserve rating data
  user_id uuid references auth.users(id) on delete set null,
  summary_id uuid references summaries(id) on delete cascade,
  -- true for upvote, false for downvote
  rating boolean not null,
  created_at timestamptz not null default now(),
  -- ensure each user can only rate a summary once
  constraint unique_user_summary_rating unique (user_id, summary_id)
);

-- enable row level security on summary_ratings table
alter table summary_ratings enable row level security;

-- ============================================================================
-- GENERATION_REQUESTS TABLE
-- ============================================================================

-- create generation_requests table to track summary generation requests
-- used for rate limiting and analytics
create table generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  video_id uuid references videos(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- enable row level security on generation_requests table
alter table generation_requests enable row level security;

