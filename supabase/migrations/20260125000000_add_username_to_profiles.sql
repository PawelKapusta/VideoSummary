-- Add username column to profiles table
-- This allows users to have a custom display name separate from their email

alter table profiles add column username text;

-- Add unique constraint on username (allow nulls but unique when present)
alter table profiles add constraint profiles_username_unique unique (username);

-- Add check constraint for username length (3-30 characters)
alter table profiles add constraint profiles_username_length check (
  length(username) >= 3 and length(username) <= 30
);

-- Add check constraint for username format (alphanumeric, underscore, dash only)
alter table profiles add constraint profiles_username_format check (
  username ~ '^[a-zA-Z0-9_-]+$'
);

-- Add comment for documentation
comment on column profiles.username is 'User-defined display name (3-30 characters, alphanumeric + underscore/dash only)';