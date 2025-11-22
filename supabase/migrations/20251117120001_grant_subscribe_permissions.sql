-- Migration: Grant Execute Permissions for Atomic Subscription Function
-- Purpose: Grant execute permission to authenticated users for the subscribe_to_channel_atomic function
-- This is separated from the function creation to avoid prepared statement issues

-- Grant execute permission to authenticated users
grant execute on function subscribe_to_channel_atomic(uuid, uuid, integer) to authenticated;

