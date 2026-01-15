-- Enum for bulk generation status
CREATE TYPE bulk_generation_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Table to track bulk summary generation status
-- Used to prevent concurrent bulk generations and show progress to users
CREATE TABLE bulk_generation_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Nullable for system generations
  status bulk_generation_status_enum DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_channels INTEGER DEFAULT 0,
  processed_channels INTEGER DEFAULT 0,
  successful_summaries INTEGER DEFAULT 0,
  failed_summaries INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queue table for summary generation jobs
-- Each row represents a summary that needs to be generated
CREATE TABLE summary_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0, -- Higher number = higher priority
  status summary_status DEFAULT 'pending',
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  worker_id TEXT, -- Identifier of the worker processing this job
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queue processing
CREATE INDEX idx_summary_queue_status_priority ON summary_queue(status, priority DESC, queued_at ASC);
CREATE INDEX idx_summary_queue_video_status ON summary_queue(video_id, status);
CREATE INDEX idx_summary_queue_worker_status ON summary_queue(worker_id, status);

-- RLS for summary_queue
ALTER TABLE summary_queue ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage queue" ON summary_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only see queue items for videos they have access to (through subscriptions)
CREATE POLICY "Users can view queue for subscribed videos" ON summary_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN videos v ON v.channel_id = s.channel_id
      WHERE s.user_id = auth.uid()
      AND v.id = summary_queue.video_id
    )
  );

-- Index for finding active bulk generations
CREATE INDEX idx_bulk_generation_status_user_status ON bulk_generation_status(user_id, status);
CREATE INDEX idx_bulk_generation_status_status_started ON bulk_generation_status(status, started_at DESC);

-- Enable RLS
ALTER TABLE bulk_generation_status ENABLE ROW LEVEL SECURITY;

-- Users can see their own bulk generation records and system generations (user_id IS NULL)
CREATE POLICY "Users can view bulk generation status" ON bulk_generation_status
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own records, system can insert without user_id
CREATE POLICY "Can insert bulk generation status" ON bulk_generation_status
  FOR INSERT WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

-- Users can update their own records, system can update system records
CREATE POLICY "Can update bulk generation status" ON bulk_generation_status
  FOR UPDATE USING (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));