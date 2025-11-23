-- Migration: Allow Channel Insert for Authenticated Users
-- Purpose: Allow authenticated users to insert new channels when subscribing
-- This is needed because the subscription flow creates channels on-demand

-- Policy: authenticated users can insert channels
-- This allows the backend to create channel records when users subscribe
create policy "auth users insert channels"
  on channels
  for insert
  to authenticated
  with check (true);

