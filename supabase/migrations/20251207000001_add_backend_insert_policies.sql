-- Migration: Add INSERT policies for backend operations
-- Purpose: Allow authenticated users (backend API) to insert videos and summaries
-- Rationale: The backend API runs with user authentication but needs to create shared resources
-- Security: These operations are only accessible through secure backend endpoints, not directly from the client
-- Note: Channel insert policy already exists in migration 20251123140000_allow_channel_insert.sql

-- ============================================================================
-- VIDEOS TABLE - Add INSERT policy
-- ============================================================================

-- Policy: Authenticated users can insert videos
-- This is needed when the backend discovers a new YouTube video
-- The backend validates the video exists on YouTube and belongs to a valid channel
create policy "auth users insert videos"
  on videos
  for insert
  to authenticated
  with check (true);

-- ============================================================================
-- SUMMARIES TABLE - Add INSERT and UPDATE policies
-- ============================================================================

-- Policy: Authenticated users can insert summaries
-- This is needed when the backend creates a new summary for a video
-- The atomic function ensures proper rate limiting and validation
create policy "auth users insert summaries"
  on summaries
  for insert
  to authenticated
  with check (true);

-- Policy: Authenticated users can update summaries
-- This is needed when the backend updates the summary status and content
-- The backend ensures users can only update summaries for videos from subscribed channels
create policy "auth users update summaries"
  on summaries
  for update
  to authenticated
  using (true)
  with check (true);

