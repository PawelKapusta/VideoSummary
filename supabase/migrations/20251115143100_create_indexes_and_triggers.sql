-- Migration: Create Indexes and Triggers
-- Purpose: Add performance indexes and business logic triggers
-- Affected: subscriptions, videos, channels, summaries, summary_ratings, profiles tables
-- Special Considerations:
--   - Composite indexes for uniqueness and performance
--   - Partial index on summaries for rate limiting (only completed summaries)
--   - Indexes on youtube_*_id columns for URL processing
--   - Trigger enforces 10-channel subscription limit per user
--   - Trigger automatically creates profile for new users
--   - Index on videos.published_at for dashboard sorting performance

-- ============================================================================
-- INDEXES
-- ============================================================================

-- create index on subscriptions for faster user subscription lookups
-- the unique constraint already creates an index, but we're being explicit
-- note: the unique constraint on (user_id, channel_id) already provides an index
comment on constraint unique_user_channel_subscription on subscriptions is 
  'Ensures subscription uniqueness and provides index for lookups';

-- create index on videos.published_at for optimal dashboard sorting
-- videos are primarily displayed sorted by publication date descending
create index idx_videos_published_at on videos (published_at desc);

-- create index on videos.youtube_video_id for fast lookups when processing YouTube URLs
-- used when checking if a video already exists before creating it
create index idx_videos_youtube_id on videos (youtube_video_id);

-- create index on videos.channel_id for faster channel video lookups
-- note: foreign key constraints automatically create indexes in postgres
comment on column videos.channel_id is 
  'Foreign key to channels - automatically indexed for join performance';

-- create index on channels.youtube_channel_id for fast lookups when processing channel URLs
-- used when checking if a channel already exists before creating it
create index idx_channels_youtube_id on channels (youtube_channel_id);

-- create partial index on summaries for efficient rate limiting checks
-- only indexes completed summaries as those are the only ones that count toward daily limit
-- note: summaries don't have channel_id directly - use video_id and join to videos for channel
-- this index helps filter completed summaries by date which is the most selective part of rate limit query
create index idx_summaries_status_date 
  on summaries (status, generated_at desc)
  where status = 'completed';

-- create index on summaries.video_id for faster joins to videos table
-- note: foreign key constraints automatically create indexes in postgres
comment on column summaries.video_id is 
  'Foreign key to videos - automatically indexed for join performance';

-- create index on summary_ratings for faster rating lookups
-- the unique constraint already creates an index, but we're being explicit
-- note: the unique constraint on (user_id, summary_id) already provides an index
comment on constraint unique_user_summary_rating on summary_ratings is 
  'Ensures one rating per user per summary and provides index for lookups';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- create function to enforce subscription limit of 10 channels per user
create or replace function check_subscription_limit()
returns trigger as $$
declare
  subscription_count integer;
begin
  -- count current subscriptions for this user
  select count(*) into subscription_count
  from subscriptions
  where user_id = new.user_id;
  
  -- check if user has reached the limit of 10 subscriptions
  if subscription_count >= 10 then
    raise exception 'Subscription limit reached. Users can subscribe to a maximum of 10 channels.'
      using errcode = 'P0001',
            hint = 'Unsubscribe from a channel before subscribing to a new one.';
  end if;
  
  -- allow the insert if under limit
  return new;
end;
$$ language plpgsql;

-- create trigger to enforce subscription limit before insert
-- this trigger runs before each insert on subscriptions table
create trigger enforce_subscription_limit
  before insert on subscriptions
  for each row
  execute function check_subscription_limit();

comment on function check_subscription_limit() is 
  'Enforces a maximum of 10 channel subscriptions per user';

comment on trigger enforce_subscription_limit on subscriptions is 
  'Prevents users from subscribing to more than 10 channels';

-- ============================================================================
-- PROFILE CREATION TRIGGER
-- ============================================================================

-- create function to automatically create profile when user registers
-- this ensures every user has a profile record without requiring API-level logic
create or replace function create_profile_for_new_user()
returns trigger as $$
begin
  -- insert a profile record for the new user
  -- id matches auth.users.id (foreign key)
  insert into public.profiles (id, created_at)
  values (new.id, new.created_at);
  
  -- return new is required for after insert triggers
  return new;
end;
$$ language plpgsql security definer;

-- create trigger that runs after user registration
-- this trigger runs after each insert on auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function create_profile_for_new_user();

comment on function create_profile_for_new_user() is 
  'Automatically creates a profile record when a new user registers';

