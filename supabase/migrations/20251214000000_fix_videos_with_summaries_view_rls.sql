-- Migration: Fix videos_with_summaries view security
-- Purpose: Remove unrestricted access to prepare for view recreation
-- Issue: View was granting SELECT to both authenticated and anon users, bypassing subscription checks
-- Solution: Remove anon permissions before recreating the view in the next migration

-- Remove unrestricted permissions (security fix)
REVOKE SELECT ON videos_with_summaries FROM anon;

-- Note: The view will be recreated with proper SECURITY INVOKER in the next migration
