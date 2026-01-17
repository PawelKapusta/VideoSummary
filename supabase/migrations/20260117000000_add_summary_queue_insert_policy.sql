-- Add INSERT policy for authenticated users to add items to summary_queue
-- This allows users to queue summaries for videos from their subscribed channels

-- Users can insert queue items for videos from channels they subscribe to
CREATE POLICY "Users can insert queue items for subscribed videos" ON summary_queue
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN videos v ON v.channel_id = s.channel_id
      WHERE s.user_id = auth.uid()
      AND v.id = video_id
    )
  );
