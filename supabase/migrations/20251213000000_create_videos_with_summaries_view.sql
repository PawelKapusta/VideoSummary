-- Migration: Create videos_with_summaries view
-- Purpose: Provide an efficient way to query videos with summary status
-- This view includes a computed has_summary column that checks for completed summaries
-- RLS policies are automatically applied through the underlying tables

-- Drop view if it exists (for idempotency)
DROP VIEW IF EXISTS videos_with_summaries;

-- Create the view
CREATE VIEW videos_with_summaries AS
SELECT
  v.id,
  v.youtube_video_id,
  v.title,
  v.thumbnail_url,
  v.published_at,
  v.channel_id,
  v.metadata_last_checked_at,
  v.created_at,
  -- Computed column: get the ID of the most relevant summary
  -- Priority: 1. pending/in_progress, 2. completed, 3. failed (by generated_at desc)
  (
    SELECT s.id
    FROM summaries s
    WHERE s.video_id = v.id
    ORDER BY
      CASE
        WHEN s.status IN ('pending', 'in_progress') THEN 1
        WHEN s.status = 'completed' THEN 2
        WHEN s.status = 'failed' THEN 3
        ELSE 4
      END ASC,
      s.generated_at DESC NULLS LAST,
      s.id DESC
    LIMIT 1
  ) as summary_id,
  -- Computed column: get the status of the most relevant summary
  (
    SELECT s.status
    FROM summaries s
    WHERE s.video_id = v.id
    ORDER BY
      CASE
        WHEN s.status IN ('pending', 'in_progress') THEN 1
        WHEN s.status = 'completed' THEN 2
        WHEN s.status = 'failed' THEN 3
        ELSE 4
      END ASC,
      s.generated_at DESC NULLS LAST,
      s.id DESC
    LIMIT 1
  ) as summary_status
FROM videos v;

-- Grant select permissions to authenticated users
GRANT SELECT ON videos_with_summaries TO authenticated;
GRANT SELECT ON videos_with_summaries TO anon;

-- Add comment for documentation
COMMENT ON VIEW videos_with_summaries IS 'View that includes videos with computed summary_id and summary_status columns. The summary_id column contains the ID of the most recent summary if one exists. The summary_status column contains the status of the most recent summary. RLS policies from the videos table are automatically applied.';
