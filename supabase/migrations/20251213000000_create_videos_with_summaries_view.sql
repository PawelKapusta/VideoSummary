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
  -- Computed column: get the ID of the completed summary if it exists
  (
    SELECT s.id 
    FROM summaries s 
    WHERE s.video_id = v.id 
      AND s.status = 'completed'
    LIMIT 1
  ) as summary_id
FROM videos v;

-- Grant select permissions to authenticated users
GRANT SELECT ON videos_with_summaries TO authenticated;
GRANT SELECT ON videos_with_summaries TO anon;

-- Add comment for documentation
COMMENT ON VIEW videos_with_summaries IS 'View that includes videos with a computed summary_id column. The summary_id column contains the ID of a completed summary if one exists. RLS policies from the videos table are automatically applied.';
