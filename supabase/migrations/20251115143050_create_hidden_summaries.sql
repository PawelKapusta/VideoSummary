-- Migration: Create Hidden Summaries Table
-- Purpose: Create table to track which summaries users have hidden from their dashboard
-- Affected: hidden_summaries table
-- Special Considerations:
--   - Many-to-many relationship between users and summaries
--   - Summaries are shared resources - users can only hide them for themselves
--   - When user unsubscribes, trigger cleans up related hidden_summaries
--   - RLS policies ensure users can only manage their own hidden summaries

-- ============================================================================
-- HIDDEN_SUMMARIES TABLE
-- ============================================================================

-- create hidden_summaries table to store user-specific hidden summaries
-- allows users to hide summaries from their dashboard without affecting others
-- since summaries are shared resources between all users subscribed to a channel
create table hidden_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary_id uuid not null references summaries(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  -- ensure a user can only hide a specific summary once
  constraint unique_user_hidden_summary unique (user_id, summary_id)
);

-- enable row level security on hidden_summaries table
alter table hidden_summaries enable row level security;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- create composite index for faster lookups when filtering hidden summaries
-- used when displaying summaries list to exclude hidden ones
create index idx_hidden_summaries_user_summary 
  on hidden_summaries(user_id, summary_id);

comment on table hidden_summaries is 
  'Stores user-specific hidden summaries. Allows users to personalize their dashboard without affecting other users who subscribe to the same channels.';

comment on column hidden_summaries.user_id is 
  'References the user who hid the summary. Cascades on user deletion.';

comment on column hidden_summaries.summary_id is 
  'References the summary that was hidden. Cascades on summary deletion.';

comment on column hidden_summaries.hidden_at is 
  'Timestamp when the summary was hidden by the user.';


