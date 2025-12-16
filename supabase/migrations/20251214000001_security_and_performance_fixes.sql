-- Migration: Security and Performance Fixes
-- Purpose: Address critical security issues and optimize database performance
-- Issues Fixed:
--   1. Remove SECURITY DEFINER from videos_with_summaries view (unnecessary privilege escalation)
--   2. Fix mutable search path in generate_summary_atomic function (security vulnerability)
--   3. Remove potentially unused indexes that don't provide value

-- ============================================================================
-- SECURITY FIXES
-- ============================================================================

-- Fix 1: Recreate videos_with_summaries view with explicit SECURITY INVOKER
-- This ensures the view runs with the privileges of the calling user, not the view owner
-- SECURITY DEFINER can be dangerous as it elevates privileges unnecessarily

-- Drop and recreate the view with explicit SECURITY INVOKER using correct syntax
DROP VIEW IF EXISTS videos_with_summaries;

CREATE VIEW videos_with_summaries
WITH (security_invoker = true)
AS
SELECT
  v.id,
  v.youtube_video_id,
  v.title,
  v.thumbnail_url,
  v.published_at,
  v.channel_id,
  v.metadata_last_checked_at,
  v.created_at,
  -- Computed column: get the ID of the completed summary if it exists
  (
    SELECT s.id
    FROM summaries s
    WHERE s.video_id = v.id
      AND s.status = 'completed'
    LIMIT 1
  ) as summary_id
FROM videos v;

-- Grant select permissions only to authenticated users (anon access was revoked in previous migration)
GRANT SELECT ON videos_with_summaries TO authenticated;

-- Update comment to reflect the security model
COMMENT ON VIEW videos_with_summaries IS 'View that includes videos with a computed summary_id column. Uses SECURITY INVOKER to run with caller privileges. Security is enforced through RLS policies on the underlying videos table.';

-- Fix 2: Fix mutable search path in generate_summary_atomic function
-- This prevents search path attacks where malicious functions with same name could be called
CREATE OR REPLACE FUNCTION generate_summary_atomic(
  p_user_id UUID,
  p_video_id UUID,
  p_channel_id UUID,
  p_lock_key BIGINT
)
RETURNS TABLE (
  id UUID,
  status summary_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary_id UUID;
  v_status summary_status;
  v_daily_count INTEGER;
  v_limit INTEGER := 1;
BEGIN
  -- Acquire advisory lock for the channel to prevent race conditions
  -- pg_advisory_xact_lock releases automatically at the end of the transaction
  PERFORM pg_advisory_xact_lock(p_lock_key);

  -- Check if a summary already exists for this video
  SELECT s.id, s.status INTO v_summary_id, v_status
  FROM summaries s
  WHERE s.video_id = p_video_id;

  -- If summary exists, return it immediately
  IF v_summary_id IS NOT NULL THEN
    RETURN QUERY SELECT v_summary_id, v_status;
    RETURN;
  END IF;

  -- Check daily limit for the channel (GLOBAL limit across all users)
  -- Only count COMPLETED summaries generated TODAY (UTC)
  -- Note: This assumes the database timezone is set appropriately or uses UTC by default
  SELECT COUNT(*) INTO v_daily_count
  FROM summaries s
  JOIN videos v ON s.video_id = v.id
  WHERE v.channel_id = p_channel_id
    AND s.status = 'completed'
    AND s.generated_at >= (CURRENT_DATE AT TIME ZONE 'UTC')
    AND s.generated_at < (CURRENT_DATE AT TIME ZONE 'UTC' + INTERVAL '1 day');

  IF v_daily_count >= v_limit THEN
    RAISE EXCEPTION 'GENERATION_LIMIT_REACHED';
  END IF;

  -- Insert new summary record
  INSERT INTO summaries (video_id, status)
  VALUES (p_video_id, 'pending')
  RETURNING summaries.id, summaries.status INTO v_summary_id, v_status;

  -- Track the generation request
  INSERT INTO generation_requests (user_id, video_id)
  VALUES (p_user_id, p_video_id);

  RETURN QUERY SELECT v_summary_id, v_status;
END;
$$;

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS - REMOVE UNUSED INDEXES
-- ============================================================================

-- Analysis of index usage:
-- 1. Foreign key indexes are generally kept as they support referential integrity
-- 2. Lookup indexes are kept if they support common query patterns
-- 3. After analysis, the following indexes appear to be unused based on query patterns:

-- Remove unused index on subscriptions.channel_id if it's truly unused
-- Note: This index supports the RLS policy on videos table, so it might be needed
-- DROP INDEX IF EXISTS idx_subscriptions_channel_id;

-- Remove unused indexes on generation_requests if they're not used for FK constraints
-- These support foreign key constraints, so they should be kept for performance
-- DROP INDEX IF EXISTS idx_generation_requests_user_id;
-- DROP INDEX IF EXISTS idx_generation_requests_video_id;

-- Remove unused index on hidden_summaries if it's not used for FK constraints
-- This supports foreign key constraints, so it should be kept for performance
-- DROP INDEX IF EXISTS idx_hidden_summaries_summary_id;

-- Note: After reviewing the indexes, they all appear to support either:
-- 1. Foreign key constraints (which need indexes for performance)
-- 2. Common query patterns in the application
-- 3. RLS policy enforcement
-- Therefore, no indexes are being removed in this migration.

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================

-- Verify view security settings
-- SELECT schemaname, viewname, definition
-- FROM pg_views
-- WHERE viewname = 'videos_with_summaries';

-- Verify function search path
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE proname = 'generate_summary_atomic';

-- Verify indexes still exist and are valid
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
