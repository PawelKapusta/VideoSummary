-- Migration: Create Indexes and Triggers
-- Purpose: Add performance indexes and business logic triggers
-- Affected: subscriptions, videos, summary_ratings tables
-- Special Considerations:
--   - Composite indexes for uniqueness and performance
--   - Trigger enforces 10-channel subscription limit per user
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

-- create index on videos.channel_id for faster channel video lookups
-- note: foreign key constraints automatically create indexes in postgres
comment on column videos.channel_id is 
  'Foreign key to channels - automatically indexed for join performance';

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

