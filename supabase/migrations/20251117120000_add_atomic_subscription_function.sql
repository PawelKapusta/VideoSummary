-- Migration: Add Atomic Subscription Function
-- Purpose: Create PostgreSQL function for atomic channel subscription with advisory locks
-- Prevents race conditions when multiple users try to subscribe to the same channel simultaneously
-- Enforces subscription limits and duplicate subscription checks

-- Create function for atomic channel subscription
create or replace function subscribe_to_channel_atomic(
  p_user_id uuid,
  p_channel_id uuid,
  p_lock_key integer
)
returns json
language plpgsql
security definer
as $$
declare
  v_subscription_count integer;
  v_existing_subscription uuid;
  v_new_subscription_id uuid;
  v_result json;
begin
  -- Acquire advisory lock to prevent race conditions
  -- This lock is held until the transaction commits or rolls back
  perform pg_advisory_xact_lock(p_lock_key);

  -- Check subscription limit (10 channels max per user)
  select count(*) into v_subscription_count
  from subscriptions
  where user_id = p_user_id;

  if v_subscription_count >= 10 then
    raise exception 'SUBSCRIPTION_LIMIT_REACHED';
  end if;

  -- Check if user already subscribed to this channel
  select id into v_existing_subscription
  from subscriptions
  where user_id = p_user_id and channel_id = p_channel_id;

  if v_existing_subscription is not null then
    raise exception 'ALREADY_SUBSCRIBED';
  end if;

  -- Create new subscription
  insert into subscriptions (user_id, channel_id)
  values (p_user_id, p_channel_id)
  returning id into v_new_subscription_id;

  -- Return subscription data with channel information
  select json_build_object(
    'id', s.id,
    'user_id', s.user_id,
    'channel_id', s.channel_id,
    'created_at', s.created_at,
    'channels', json_build_object(
      'id', c.id,
      'youtube_channel_id', c.youtube_channel_id,
      'name', c.name,
      'created_at', c.created_at
    )
  ) into v_result
  from subscriptions s
  join channels c on c.id = s.channel_id
  where s.id = v_new_subscription_id;

  return v_result;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function subscribe_to_channel_atomic(uuid, uuid, integer) to authenticated;
