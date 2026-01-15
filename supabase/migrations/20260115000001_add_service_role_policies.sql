-- Migration: Add service role policies for bulk generation tables
-- Purpose: Ensure service role can access bulk_generation_status and summary_queue
-- Background: Service role should bypass RLS, but explicit policies ensure reliability

-- Drop existing policies if they exist (safe recreation)
DROP POLICY IF EXISTS "Service role full access bulk_generation_status" ON bulk_generation_status;
DROP POLICY IF EXISTS "Service role full access summary_queue" ON summary_queue;

-- Allow service role full access to bulk_generation_status
-- This is needed for the cron job that generates daily summaries
CREATE POLICY "Service role full access bulk_generation_status" 
ON bulk_generation_status
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Allow service role full access to summary_queue
-- This is needed for queue-based summary generation processing
CREATE POLICY "Service role full access summary_queue" 
ON summary_queue
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);
