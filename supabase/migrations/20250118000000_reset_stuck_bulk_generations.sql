-- Reset stuck bulk generation status
-- This function can be called to reset bulk generations that have been stuck in "in_progress" for too long

CREATE OR REPLACE FUNCTION reset_stuck_bulk_generations()
RETURNS TABLE (
  reset_count INTEGER,
  updated_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stuck_ids UUID[];
  reset_count INTEGER := 0;
BEGIN
  -- Find bulk generations stuck in "in_progress" for more than 1 hour
  SELECT array_agg(id)
  INTO stuck_ids
  FROM bulk_generation_status
  WHERE status = 'in_progress'
    AND started_at < NOW() - INTERVAL '1 hour';

  -- Reset them to failed status
  IF stuck_ids IS NOT NULL AND array_length(stuck_ids, 1) > 0 THEN
    UPDATE bulk_generation_status
    SET
      status = 'failed',
      error_message = 'Automatically reset - stuck in in_progress for more than 1 hour',
      completed_at = NOW()
    WHERE id = ANY(stuck_ids);

    reset_count := array_length(stuck_ids, 1);
  END IF;

  -- Return results
  RETURN QUERY SELECT reset_count, stuck_ids;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_stuck_bulk_generations() TO authenticated;