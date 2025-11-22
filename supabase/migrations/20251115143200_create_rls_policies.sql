-- Migration: Create RLS Policies
-- Purpose: Define row-level security policies for data access control
-- Affected: profiles, channels, subscriptions, videos, summaries, summary_ratings, generation_requests, hidden_summaries tables
-- Special Considerations:
--   - Backend operations use service_role_key to bypass RLS
--   - Policies are granular: separate for each operation and role
--   - Users can only access videos/summaries from subscribed channels
--   - Shared resources (channels, videos, summaries) are preserved across user deletions
--   - Users can only manage their own hidden summaries

-- ============================================================================
-- PROFILES TABLE RLS POLICIES
-- ============================================================================

-- policy: authenticated users can read all profiles
create policy "auth users select all profiles"
  on profiles
  for select
  to authenticated
  using (true);

-- policy: anonymous users can read all profiles
create policy "anon users select all profiles"
  on profiles
  for select
  to anon
  using (true);

-- policy: authenticated users can update only their own profile
create policy "auth users update own profile"
  on profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- policy: authenticated users can insert only their own profile
create policy "auth users insert own profile"
  on profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- ============================================================================
-- CHANNELS TABLE RLS POLICIES
-- ============================================================================

-- policy: authenticated users can read all channels
-- channels are public shared resources
create policy "auth users select all channels"
  on channels
  for select
  to authenticated
  using (true);

-- policy: anonymous users can read all channels
create policy "anon users select all channels"
  on channels
  for select
  to anon
  using (true);

-- note: insert/update/delete on channels should only be done by backend with service_role_key

-- ============================================================================
-- SUBSCRIPTIONS TABLE RLS POLICIES
-- ============================================================================

-- policy: authenticated users can read only their own subscriptions
create policy "auth users select own subscriptions"
  on subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- policy: authenticated users can insert only their own subscriptions
create policy "auth users insert own subscriptions"
  on subscriptions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- policy: authenticated users can update only their own subscriptions
create policy "auth users update own subscriptions"
  on subscriptions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- policy: authenticated users can delete only their own subscriptions
create policy "auth users delete own subscriptions"
  on subscriptions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- VIDEOS TABLE RLS POLICIES
-- ============================================================================

-- policy: authenticated users can read videos from channels they are subscribed to
-- this policy checks for existence of a subscription record
create policy "auth users select videos from subscribed channels"
  on videos
  for select
  to authenticated
  using (
    exists (
      select 1
      from subscriptions
      where subscriptions.channel_id = videos.channel_id
        and subscriptions.user_id = (select auth.uid())
    )
  );

-- note: insert/update/delete on videos should only be done by backend with service_role_key

-- ============================================================================
-- SUMMARIES TABLE RLS POLICIES
-- ============================================================================

-- policy: authenticated users can read summaries for videos from subscribed channels
-- this policy requires joining through videos to check channel subscription
create policy "auth users select summaries from subscribed channels"
  on summaries
  for select
  to authenticated
  using (
    exists (
      select 1
      from videos
      inner join subscriptions on subscriptions.channel_id = videos.channel_id
      where videos.id = summaries.video_id
        and subscriptions.user_id = (select auth.uid())
    )
  );

-- note: insert/update/delete on summaries should only be done by backend with service_role_key

-- ============================================================================
-- SUMMARY_RATINGS TABLE RLS POLICIES
-- ============================================================================

-- policy: authenticated users can read all ratings
-- allows users to see vote counts and rating information
create policy "auth users select all ratings"
  on summary_ratings
  for select
  to authenticated
  using (true);

-- policy: anonymous users can read all ratings
create policy "anon users select all ratings"
  on summary_ratings
  for select
  to anon
  using (true);

-- policy: authenticated users can insert only their own ratings
create policy "auth users insert own ratings"
  on summary_ratings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- policy: authenticated users can update only their own ratings
create policy "auth users update own ratings"
  on summary_ratings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- policy: authenticated users can delete only their own ratings
create policy "auth users delete own ratings"
  on summary_ratings
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- GENERATION_REQUESTS TABLE RLS POLICIES
-- ============================================================================

-- policy: authenticated users can read only their own generation requests
create policy "auth users select own generation requests"
  on generation_requests
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- policy: authenticated users can insert only their own generation requests
create policy "auth users insert own generation requests"
  on generation_requests
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- note: update/delete on generation_requests should only be done by backend with service_role_key

-- ============================================================================
-- HIDDEN_SUMMARIES TABLE RLS POLICIES
-- ============================================================================

-- policy: authenticated users can read only their own hidden summaries
create policy "auth users select own hidden summaries"
  on hidden_summaries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- policy: authenticated users can insert only their own hidden summaries
-- users can only hide summaries for themselves
create policy "auth users insert own hidden summaries"
  on hidden_summaries
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- policy: authenticated users can delete only their own hidden summaries
-- users can unhide summaries they previously hidden
create policy "auth users delete own hidden summaries"
  on hidden_summaries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- note: update on hidden_summaries is not needed - users can only hide/unhide (insert/delete)

