-- Reset stuck bulk generation status
-- This script can be run in Supabase SQL Editor

-- Find and reset bulk generations that have been in_progress for more than 1 hour
UPDATE bulk_generation_status
SET
  status = 'failed',
  error_message = 'Automatically reset - stuck in in_progress for more than 1 hour',
  completed_at = NOW()
WHERE
  status = 'in_progress'
  AND started_at < NOW() - INTERVAL '1 hour';

-- Show results
SELECT
  id,
  status,
  started_at,
  completed_at,
  error_message,
  total_channels,
  processed_channels,
  successful_summaries,
  failed_summaries
FROM bulk_generation_status
WHERE status = 'failed'
  AND error_message LIKE '%stuck in in_progress%'
  AND completed_at >= NOW() - INTERVAL '5 minutes'
ORDER BY completed_at DESC;