-- Migration: Fix videos_with_summaries view to include summary_status column
-- Purpose: The view was recreated in security fixes but lost the summary_status column
-- This caused 500 errors when the videos API tried to select summary_status

-- Drop and recreate the view with both summary_id and summary_status columns
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
  -- Computed column: get the ID of the most recent summary (any status)
  (
    SELECT s.id
    FROM summaries s
    WHERE s.video_id = v.id
    ORDER BY
      CASE s.status
        WHEN 'pending' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'completed' THEN 3
        WHEN 'failed' THEN 4
        ELSE 5
      END ASC,
      s.generated_at DESC NULLS LAST,
      s.id DESC
    LIMIT 1
  ) as summary_id,
  -- Computed column: get the status of the most recent summary
  (
    SELECT s.status
    FROM summaries s
    WHERE s.video_id = v.id
    ORDER BY
      CASE s.status
        WHEN 'pending' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'completed' THEN 3
        WHEN 'failed' THEN 4
        ELSE 5
      END ASC,
      s.generated_at DESC NULLS LAST,
      s.id DESC
    LIMIT 1
  ) as summary_status
FROM videos v;

-- Grant select permissions to authenticated users
GRANT SELECT ON videos_with_summaries TO authenticated;

-- Update comment for documentation
COMMENT ON VIEW videos_with_summaries IS 'View that includes videos with computed summary_id and summary_status columns. Uses SECURITY INVOKER to run with caller privileges. Security is enforced through RLS policies on the underlying videos table.';
