-- Migration: Add Hidden Summaries Cleanup Trigger
-- Purpose: Automatically clean up hidden_summaries when user unsubscribes from a channel
-- Affected: subscriptions, hidden_summaries tables
-- Special Considerations:
--   - Trigger runs BEFORE DELETE on subscriptions
--   - Finds all summaries belonging to the unsubscribed channel
--   - Removes only those hidden_summaries that belong to that channel
--   - Prevents accumulation of orphaned records
--   - Does NOT affect other channels' hidden summaries

-- ============================================================================
-- TRIGGER FUNCTION
-- ============================================================================

-- Create function to cleanup hidden summaries when user unsubscribes
-- This function is called by the trigger before a subscription is deleted
create or replace function cleanup_hidden_summaries_on_unsubscribe()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  -- Delete hidden_summaries records for summaries from the unsubscribed channel
  -- OLD contains the subscription record being deleted
  delete from hidden_summaries
  where user_id = old.user_id
  and summary_id in (
    -- Find all summaries that belong to videos from the unsubscribed channel
    select s.id 
    from summaries s
    join videos v on v.id = s.video_id
    where v.channel_id = old.channel_id
  );
  
  -- Return OLD is required for BEFORE DELETE triggers
  -- This allows the original DELETE operation to proceed
  return old;
end;
$$;

comment on function cleanup_hidden_summaries_on_unsubscribe() is 
  'Automatically removes hidden_summaries records when user unsubscribes from a channel to prevent orphaned data';

-- ============================================================================
-- TRIGGER
-- ============================================================================

-- Create trigger that runs before subscription deletion
-- This ensures cleanup happens atomically with the unsubscribe operation
create trigger on_subscription_deleted
  before delete on subscriptions
  for each row
  execute function cleanup_hidden_summaries_on_unsubscribe();

comment on trigger on_subscription_deleted on subscriptions is 
  'Cleans up hidden_summaries for the unsubscribed channel to maintain database hygiene';


