# Final Database Schema for YTInsights

This document outlines the comprehensive database schema for the YTInsights application, designed for PostgreSQL and Supabase.

## 1. Tables and Data Structures

### ENUM Types

- **`summary_status`**:
  - `pending`
  - `in_progress`
  - `completed`
  - `failed`

- **`summary_error_code`**:
  - `NO_SUBTITLES`
  - `VIDEO_PRIVATE`
  - `VIDEO_TOO_LONG`

### Tables

#### `users`

This table is managed by Supabase Auth.

#### `profiles`
Stores public user data, extending the `auth.users` table.

| Column      | Data Type     | Constraints                                            | Description                    |
|-------------|---------------|--------------------------------------------------------|--------------------------------|
| `id`        | UUID          | PRIMARY KEY, REFERENCES `auth.users(id)` ON DELETE CASCADE | Foreign key to `auth.users`.     |
| `created_at`| TIMESTAMPTZ   | NOT NULL, DEFAULT `now()`                              | Timestamp of profile creation. |

#### `channels`
Stores unique information about YouTube channels.

| Column             | Data Type   | Constraints                       | Description                     |
|--------------------|-------------|-----------------------------------|---------------------------------|
| `id`               | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier for the channel. |
| `youtube_channel_id`| TEXT        | NOT NULL, UNIQUE                  | The unique ID from YouTube.     |
| `name`             | TEXT        | NOT NULL                          | The name of the channel.        |
| `created_at`       | TIMESTAMPTZ | NOT NULL, DEFAULT `now()`         | Timestamp of channel creation.  |

#### `subscriptions`
A join table modeling the many-to-many relationship between users and channels.

| Column     | Data Type   | Constraints                                     | Description                                |
|------------|-------------|-------------------------------------------------|--------------------------------------------|
| `id`       | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`          | Unique identifier for the subscription.    |
| `user_id`  | UUID        | NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE | Foreign key to the user.                 |
| `channel_id`| UUID        | NOT NULL, REFERENCES `channels(id)` ON DELETE CASCADE | Foreign key to the channel.              |
| `created_at`| TIMESTAMPTZ | NOT NULL, DEFAULT `now()`                       | Timestamp of subscription creation.        |
| **Constraint** | -         | `UNIQUE(user_id, channel_id)`                   | Prevents duplicate subscriptions.          |

#### `videos`
Stores unique information and metadata about videos from channels.

| Column                     | Data Type   | Constraints                                   | Description                                      |
|----------------------------|-------------|-----------------------------------------------|--------------------------------------------------|
| `id`                       | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`        | Unique identifier for the video.                 |
| `youtube_video_id`         | TEXT        | NOT NULL, UNIQUE                              | The unique ID from YouTube.                      |
| `channel_id`               | UUID        | NOT NULL, REFERENCES `channels(id)` ON DELETE CASCADE | Foreign key to the channel this video belongs to. |
| `title`                    | TEXT        | NOT NULL                                      | The title of the video.                          |
| `thumbnail_url`            | TEXT        | NULLABLE                                      | URL for the video thumbnail.                     |
| `published_at`             | TIMESTAMPTZ | NULLABLE                                      | Publication date on YouTube.                     |
| `metadata_last_checked_at` | TIMESTAMPTZ | NULLABLE                                      | When video metadata was last checked/updated.    |
| `created_at`               | TIMESTAMPTZ | NOT NULL, DEFAULT `now()`                     | Timestamp of video record creation.              |

#### `summaries`
Stores generated summaries for videos. This is a shared resource.

| Column         | Data Type          | Constraints                                 | Description                                                         |
|----------------|--------------------|---------------------------------------------|---------------------------------------------------------------------|
| `id`           | UUID               | PRIMARY KEY, DEFAULT `gen_random_uuid()`      | Unique identifier for the summary.                                  |
| `video_id`     | UUID               | NOT NULL, UNIQUE, REFERENCES `videos(id)` ON DELETE CASCADE | Foreign key to the video (1-to-1 relationship).                 |
| `tldr`         | TEXT               | NULLABLE                                    | A short summary (Too Long; Didn't Read).                            |
| `full_summary` | JSONB              | NULLABLE                                    | The full summary in JSON format (`{summary, conclusions, key_points}`). |
| `status`       | `summary_status`   | NOT NULL, DEFAULT `'pending'`               | The current status of the summary generation process.               |
| `error_code`   | `summary_error_code`| NULLABLE                                    | An error code if the generation failed.                             |
| `generated_at` | TIMESTAMPTZ        | DEFAULT `now()`                             | Timestamp of summary generation.                                    |

#### `summary_ratings`
Stores user ratings for summaries.

| Column     | Data Type   | Constraints                                   | Description                                             |
|------------|-------------|-----------------------------------------------|---------------------------------------------------------|
| `id`       | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`        | Unique identifier for the rating.                       |
| `user_id`  | UUID        | REFERENCES `auth.users(id)` ON DELETE SET NULL  | Foreign key to the user who rated. Becomes NULL on user deletion. |
| `summary_id`| UUID        | REFERENCES `summaries(id)` ON DELETE CASCADE  | Foreign key to the summary being rated.                 |
| `rating`   | BOOLEAN     | NOT NULL                                      | `true` for upvote, `false` for downvote.                |
| `created_at`| TIMESTAMPTZ | NOT NULL, DEFAULT `now()`                     | Timestamp of rating creation.                           |
| **Constraint** | -         | `UNIQUE(user_id, summary_id)`                 | A user can rate a summary only once.                    |

#### `generation_requests`
Tracks summary generation requests by users for analytics purposes. Note: Rate limiting is enforced by checking `summaries` table status, not this table.

| Column     | Data Type   | Constraints                                     | Description                                   |
|------------|-------------|-------------------------------------------------|-----------------------------------------------|
| `id`       | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`          | Unique identifier for the request.            |
| `user_id`  | UUID        | REFERENCES `auth.users(id)` ON DELETE CASCADE   | Foreign key to the user making the request.   |
| `video_id` | UUID        | REFERENCES `videos(id)` ON DELETE CASCADE       | Foreign key to the video requested for summary. |
| `created_at`| TIMESTAMPTZ | NOT NULL, DEFAULT `now()`                       | Timestamp of request creation.                |

#### `hidden_summaries`
Stores user-specific hidden summaries. Allows users to hide summaries from their dashboard without affecting other users (since summaries are shared resources).

| Column      | Data Type   | Constraints                                   | Description                                |
|-------------|-------------|-----------------------------------------------|--------------------------------------------|
| `id`        | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`        | Unique identifier for the hidden record.   |
| `user_id`   | UUID        | NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE | Foreign key to the user.         |
| `summary_id`| UUID        | NOT NULL, REFERENCES `summaries(id)` ON DELETE CASCADE | Foreign key to the hidden summary. |
| `hidden_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()`                     | Timestamp when summary was hidden.         |
| **Constraint** | -        | `UNIQUE(user_id, summary_id)`                 | A user can hide a summary only once.       |

## 2. Relationships

- **`profiles` and `auth.users`**: One-to-One. Each user in `auth.users` can have one profile. Profile is automatically created via database trigger on user registration.
- **`users` and `channels`**: Many-to-Many, facilitated by the `subscriptions` join table. A user can subscribe to many channels, and a channel can be subscribed to by many users.
- **`channels` and `videos`**: One-to-Many. A channel can have many videos.
- **`videos` and `summaries`**: One-to-One. Each video can have at most one summary.
- **`users` and `summaries` (for ratings)**: Many-to-Many, facilitated by the `summary_ratings` join table. A user can rate many summaries, and a summary can be rated by many users.
- **`users` and `summaries` (for hiding)**: Many-to-Many, facilitated by the `hidden_summaries` join table. A user can hide many summaries, and a summary can be hidden by many users independently.
- **`users` and `generation_requests`**: One-to-Many. A user can make multiple generation requests.
- **`videos` and `generation_requests`**: One-to-Many. A video can be the subject of multiple generation requests.

## 3. Indexes

- **`subscriptions`**: A composite unique index on `(user_id, channel_id)` to ensure subscription uniqueness and speed up lookups.
- **`videos`**: 
  - Index on `published_at DESC` to optimize sorting for the main dashboard view.
  - Index on `youtube_video_id` for fast lookups when processing YouTube URLs.
- **`channels`**:
  - Index on `youtube_channel_id` for fast lookups when processing YouTube channel URLs.
- **`summaries`**: 
  - Partial index on `(status, generated_at DESC)` with `WHERE status = 'completed'` for efficient rate limiting checks. Note: summaries table doesn't have `channel_id` directly - rate limiting queries join through `videos` table to get channel information.
- **`summary_ratings`**: A composite unique index on `(user_id, summary_id)` to enforce the one-vote-per-user rule and speed up checks.
- **`hidden_summaries`**: A composite unique index on `(user_id, summary_id)` to enforce uniqueness and optimize lookup of hidden summaries for each user.
- **Foreign Keys**: All foreign key columns will be automatically indexed by PostgreSQL to improve join performance.

## 4. Row-Level Security (RLS) Policies

RLS will be enabled on all tables containing user-specific data. Backend operations will use the `service_role_key` to bypass RLS.

- **`profiles`**:
  - `SELECT`: Any authenticated user can read all profiles.
  - `UPDATE`: A user can only update their own profile (`auth.uid() = id`).

- **`subscriptions`**:
  - `ALL`: A user can perform `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations only on their own subscriptions (`auth.uid() = user_id`).

- **`summaries` and `videos`**:
  - `SELECT`: A user can only read summaries and video details for channels they are subscribed to. This requires a policy that checks for the existence of a corresponding record in the `subscriptions` table.
    ```sql
    -- Example policy for videos
    (EXISTS (SELECT 1 FROM subscriptions WHERE ((subscriptions.channel_id = videos.channel_id) AND (subscriptions.user_id = auth.uid()))))
    ```

- **`summary_ratings`**:
  - `SELECT`: Any authenticated user can read all ratings (e.g., to see vote counts).
  - `INSERT`, `DELETE`: A user can only create and delete their own ratings (`auth.uid() = user_id`).

- **`hidden_summaries`**:
  - `SELECT`: A user can only view their own hidden summaries (`auth.uid() = user_id`).
  - `INSERT`: A user can only hide summaries for themselves (`auth.uid() = user_id`).
  - `DELETE`: A user can only unhide their own summaries (`auth.uid() = user_id`).

- **`generation_requests`**:
  - `SELECT`, `INSERT`: A user can only create and read their own generation requests (`auth.uid() = user_id`).

## 5. Additional Notes and Design Decisions

- **Profile Creation**: A database trigger automatically creates a `profiles` record when a new user registers in `auth.users`. This ensures every user has a profile without requiring API-level logic.
  ```sql
  CREATE OR REPLACE FUNCTION create_profile_for_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, created_at)
    VALUES (NEW.id, NEW.created_at);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_new_user();
  ```

- **Subscription Limit**: A database trigger (`enforce_subscription_limit`) is implemented on the `subscriptions` table. Before an `INSERT` operation, it checks if the user has reached the 10-channel subscription limit and aborts the transaction if the limit is exceeded.

- **Hidden Summaries Cleanup**: A database trigger (`on_subscription_deleted`) automatically cleans up `hidden_summaries` records when a user unsubscribes from a channel. This prevents accumulation of orphaned records and keeps the database clean. The trigger finds all summaries belonging to the unsubscribed channel and removes them from the user's hidden list.
  ```sql
  CREATE OR REPLACE FUNCTION cleanup_hidden_summaries_on_unsubscribe()
  RETURNS TRIGGER AS $$
  BEGIN
    DELETE FROM hidden_summaries
    WHERE user_id = OLD.user_id
    AND summary_id IN (
      SELECT s.id 
      FROM summaries s
      JOIN videos v ON v.id = s.video_id
      WHERE v.channel_id = OLD.channel_id
    );
    RETURN OLD;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER on_subscription_deleted
    BEFORE DELETE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_hidden_summaries_on_unsubscribe();
  ```

- **Shared Resources**: `channels`, `videos`, and `summaries` are treated as global, shared resources. They are not deleted when a user unsubscribes or deletes their account. This preserves data integrity and reduces redundant data storage. Multiple users subscribed to the same channel will see the same summaries.

- **Rate Limiting Strategy**: Summary generation is limited to **one successful summary per channel per day GLOBALLY** (not per-user). This is because summaries are shared resources - one summary serves all users subscribed to that channel. Rate limiting is enforced by checking for existing summaries with `status = 'completed'` within the current calendar day (UTC). Failed summaries (`status = 'failed'`) do NOT count toward the limit and can be retried.

- **Hidden Summaries vs Deletion**: Users cannot delete summaries (as they are shared resources), but can hide them from their personal dashboard using the `hidden_summaries` table. This allows each user to personalize their view without affecting other users subscribed to the same channel.

- **Data Anonymization**: When a user account is deleted, their `user_id` in the `summary_ratings` table will be set to `NULL`. This preserves the rating data for analytical purposes while removing the direct link to the deleted user. Records in `hidden_summaries` and `generation_requests` are CASCADE deleted with the user.

- **Cascade Deletion Rules**:
  - User deletion: Cascades to `profiles`, `subscriptions`, `generation_requests`, `hidden_summaries`
  - User deletion: Sets `user_id` to NULL in `summary_ratings` (preserves analytics)
  - Channel deletion: Cascades to `subscriptions`, `videos`
  - Video deletion: Cascades to `summaries`, `generation_requests`
  - Summary deletion: Cascades to `summary_ratings`, `hidden_summaries`
  - Note: Channels, videos, and summaries should rarely (if ever) be deleted as they are shared resources
