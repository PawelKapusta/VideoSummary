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
Tracks summary generation requests by users for rate-limiting purposes.

| Column     | Data Type   | Constraints                                     | Description                                   |
|------------|-------------|-------------------------------------------------|-----------------------------------------------|
| `id`       | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`          | Unique identifier for the request.            |
| `user_id`  | UUID        | REFERENCES `auth.users(id)` ON DELETE CASCADE   | Foreign key to the user making the request.   |
| `video_id` | UUID        | REFERENCES `videos(id)` ON DELETE CASCADE       | Foreign key to the video requested for summary. |
| `created_at`| TIMESTAMPTZ | NOT NULL, DEFAULT `now()`                       | Timestamp of request creation.                |

## 2. Relationships

- **`profiles` and `auth.users`**: One-to-One. Each user in `auth.users` can have one profile.
- **`users` and `channels`**: Many-to-Many, facilitated by the `subscriptions` join table. A user can subscribe to many channels, and a channel can be subscribed to by many users.
- **`channels` and `videos`**: One-to-Many. A channel can have many videos.
- **`videos` and `summaries`**: One-to-One. Each video can have at most one summary.
- **`users` and `summaries` (for ratings)**: Many-to-Many, facilitated by the `summary_ratings` join table. A user can rate many summaries, and a summary can be rated by many users.
- **`users` and `generation_requests`**: One-to-Many. A user can make multiple generation requests.
- **`videos` and `generation_requests`**: One-to-Many. A video can be the subject of multiple generation requests.

## 3. Indexes

- **`subscriptions`**: A composite unique index on `(user_id, channel_id)` to ensure subscription uniqueness and speed up lookups.
- **`videos`**: An index on `published_at DESC` to optimize sorting for the main dashboard view.
- **`summary_ratings`**: A composite unique index on `(user_id, summary_id)` to enforce the one-vote-per-user rule and speed up checks.
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

- **`generation_requests`**:
  - `SELECT`, `INSERT`: A user can only create and read their own generation requests (`auth.uid() = user_id`).

## 5. Additional Notes and Design Decisions

- **Subscription Limit**: A database trigger will be implemented on the `subscriptions` table. Before an `INSERT` operation, it will check if the user has reached the 10-channel subscription limit and abort the transaction if the limit is exceeded.
- **Shared Resources**: `channels`, `videos`, and `summaries` are treated as global, shared resources. They are not deleted when a user unsubscribes or deletes their account. This preserves data integrity and reduces redundant data storage.
- **Data Anonymization**: When a user account is deleted, their `user_id` in the `summary_ratings` table will be set to `NULL`. This preserves the rating data for analytical purposes while removing the direct link to the deleted user.
