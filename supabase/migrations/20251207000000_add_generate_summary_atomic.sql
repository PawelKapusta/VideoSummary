-- Function to atomically check rate limits and create a summary
-- Handles concurrency using advisory locks based on channel ID
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

