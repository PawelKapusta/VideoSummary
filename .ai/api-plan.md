# REST API Plan for VideoSummary

## 1. Overview

This document outlines the complete REST API specification for the VideoSummary application.
The API is designed to be RESTful, secure, and scalable, using Supabase for the backend and database.

## 1. Resources

The API is organized around the following main resources:

| Resource                | Database Table        | Description                                    |
| ----------------------- | --------------------- | ---------------------------------------------- |
| **Auth**                | `auth.users`          | User authentication and account management     |
| **Profile**             | `profiles`            | User profile information                       |
| **Channels**            | `channels`            | YouTube channels (shared resource)             |
| **Subscriptions**       | `subscriptions`       | User's channel subscriptions                   |
| **Videos**              | `videos`              | YouTube videos from channels (shared resource) |
| **Summaries**           | `summaries`           | AI-generated video summaries (shared resource) |
| **Hidden Summaries**    | `hidden_summaries`    | User-specific hidden summaries                 |
| **Ratings**             | `summary_ratings`     | User ratings for summaries                     |
| **Generation Requests** | `generation_requests` | Summary generation tracking for analytics      |

## 2. Endpoints

### 2.1. Authentication

#### Register New User

- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Description:** Creates a new user account with email and password
- **Authentication:** None (public endpoint)
- **Request Payload:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

- **Response Payload (Success):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-11-15T10:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1700000000
  }
}
```

- **Success Code:** `201 Created`
- **Error Responses:**
  - `400 Bad Request` - Invalid email format or weak password
  - `409 Conflict` - Email already registered
  - `422 Unprocessable Entity` - Validation errors

#### Login

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Description:** Authenticates a user and returns session tokens
- **Authentication:** None (public endpoint)
- **Request Payload:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

- **Response Payload (Success):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1700000000
  }
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `401 Unauthorized` - Invalid credentials
  - `400 Bad Request` - Missing required fields

#### Logout

- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Description:** Terminates the current user session
- **Authentication:** Required (Bearer token)
- **Request Payload:** None
- **Response Payload (Success):**

```json
{
  "message": "Successfully logged out"
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token

#### Request Password Reset

- **Method:** `POST`
- **Path:** `/api/auth/reset-password`
- **Description:** Initiates password reset process by sending email with reset link
- **Authentication:** None (public endpoint)
- **Request Payload:**

```json
{
  "email": "user@example.com"
}
```

- **Response Payload (Success):**

```json
{
  "message": "Password reset email sent"
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `400 Bad Request` - Invalid email format
  - `404 Not Found` - Email not found (consider returning 200 for security)

#### Confirm Password Reset

- **Method:** `POST`
- **Path:** `/api/auth/reset-password/confirm`
- **Description:** Completes password reset with token from email
- **Authentication:** None (uses reset token)
- **Request Payload:**

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePassword123!"
}
```

- **Response Payload (Success):**

```json
{
  "message": "Password successfully reset"
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `400 Bad Request` - Invalid or expired token, or weak password
  - `422 Unprocessable Entity` - Validation errors

### 2.2. Profile

#### Get Current User Profile

- **Method:** `GET`
- **Path:** `/api/profile`
- **Description:** Retrieves the authenticated user's profile information
- **Authentication:** Required (Bearer token)
- **Query Parameters:** None
- **Response Payload (Success):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2025-11-15T10:00:00Z",
  "subscribed_channels": [
    {
      "id": "uuid",
      "youtube_channel_id": "UC...",
      "name": "Channel Name",
      "subscribed_at": "2025-11-15T10:00:00Z"
    }
  ],
  "subscription_count": 5
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token

### 2.3. Channels & Subscriptions

#### List Subscribed Channels

- **Method:** `GET`
- **Path:** `/api/subscriptions`
- **Description:** Retrieves all channels subscribed by the current user
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `limit` (optional, default: 50, max: 100)
  - `offset` (optional, default: 0)
- **Response Payload (Success):**

```json
{
  "data": [
    {
      "subscription_id": "uuid",
      "channel": {
        "id": "uuid",
        "youtube_channel_id": "UC...",
        "name": "Channel Name",
        "created_at": "2025-11-15T10:00:00Z"
      },
      "subscribed_at": "2025-11-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token

#### Subscribe to Channel

- **Method:** `POST`
- **Path:** `/api/subscriptions`
- **Description:** Adds a YouTube channel to user's subscriptions
- **Authentication:** Required (Bearer token)
- **Request Payload:**

```json
{
  "channel_url": "https://www.youtube.com/@channelname"
}
```

- **Response Payload (Success):**

```json
{
  "subscription_id": "uuid",
  "channel": {
    "id": "uuid",
    "youtube_channel_id": "UC...",
    "name": "Channel Name",
    "created_at": "2025-11-15T10:00:00Z"
  },
  "subscribed_at": "2025-11-15T10:00:00Z",
  "message": "Successfully subscribed to channel"
}
```

- **Success Code:** `201 Created`
- **Error Responses:**
  - `400 Bad Request` - Invalid YouTube channel URL
  - `409 Conflict` - Already subscribed to this channel
  - `422 Unprocessable Entity` - Subscription limit reached (10 channels max)
  - `404 Not Found` - YouTube channel not found or invalid
  - `401 Unauthorized` - Invalid or expired token

#### Unsubscribe from Channel

- **Method:** `DELETE`
- **Path:** `/api/subscriptions/:subscriptionId`
- **Description:** Removes a channel from user's subscriptions
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `subscriptionId` - UUID of the subscription
- **Response Payload (Success):**

```json
{
  "message": "Successfully unsubscribed from channel"
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `404 Not Found` - Subscription not found
  - `403 Forbidden` - Attempting to delete another user's subscription
  - `401 Unauthorized` - Invalid or expired token

### 2.4. Videos

#### List Videos from Subscribed Channels

- **Method:** `GET`
- **Path:** `/api/videos`
- **Description:** Retrieves videos from user's subscribed channels
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `limit` (optional, default: 20, max: 100)
  - `offset` (optional, default: 0)
  - `channel_id` (optional) - Filter by specific channel UUID (must be a channel user subscribes to)
  - `sort` (optional, default: "published_at_desc") - Options: "published_at_desc", "published_at_asc"
- **Note:** If `channel_id` is provided for a non-subscribed channel, returns empty list (not 403) due to RLS filtering
- **Response Payload (Success):**

```json
{
  "data": [
    {
      "id": "uuid",
      "youtube_video_id": "abc123",
      "title": "Video Title",
      "thumbnail_url": "https://...",
      "published_at": "2025-11-15T10:00:00Z",
      "channel": {
        "id": "uuid",
        "name": "Channel Name",
        "youtube_channel_id": "UC..."
      },
      "has_summary": true
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token
  - `400 Bad Request` - Invalid query parameters

#### Get Video Details

- **Method:** `GET`
- **Path:** `/api/videos/:videoId`
- **Description:** Retrieves detailed information about a specific video
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `videoId` - UUID of the video
- **Response Payload (Success):**

```json
{
  "id": "uuid",
  "youtube_video_id": "abc123",
  "title": "Video Title",
  "thumbnail_url": "https://...",
  "published_at": "2025-11-15T10:00:00Z",
  "metadata_last_checked_at": "2025-11-15T10:00:00Z",
  "channel": {
    "id": "uuid",
    "name": "Channel Name",
    "youtube_channel_id": "UC..."
  },
  "summary": {
    "id": "uuid",
    "status": "completed",
    "generated_at": "2025-11-15T10:00:00Z"
  }
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `404 Not Found` - Video not found
  - `403 Forbidden` - Video belongs to a channel not subscribed by user
  - `401 Unauthorized` - Invalid or expired token

### 2.5. Summaries

#### List Summaries

- **Method:** `GET`
- **Path:** `/api/summaries`
- **Description:** Retrieves summaries for videos from user's subscribed channels (excludes hidden summaries)
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `limit` (optional, default: 20, max: 100)
  - `offset` (optional, default: 0)
  - `channel_id` (optional) - Filter by specific channel UUID (must be a channel user subscribes to)
  - `status` (optional) - Filter by status: "pending", "in_progress", "completed", "failed"
  - `sort` (optional, default: "published_at_desc") - Options: "published_at_desc", "published_at_asc", "generated_at_desc"
  - `include_hidden` (optional, default: false) - If true, includes summaries user has hidden
- **Note:** If `channel_id` is provided for a non-subscribed channel, returns empty list (not 403) due to RLS filtering
- **Response Payload (Success):**

```json
{
  "data": [
    {
      "id": "uuid",
      "video": {
        "id": "uuid",
        "youtube_video_id": "abc123",
        "title": "Video Title",
        "thumbnail_url": "https://...",
        "published_at": "2025-11-15T10:00:00Z"
      },
      "channel": {
        "id": "uuid",
        "name": "Channel Name"
      },
      "tldr": "Brief summary text...",
      "status": "completed",
      "generated_at": "2025-11-15T10:00:00Z",
      "user_rating": null
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `401 Unauthorized` - Invalid or expired token
  - `400 Bad Request` - Invalid query parameters

#### Get Summary Details

- **Method:** `GET`
- **Path:** `/api/summaries/:summaryId`
- **Description:** Retrieves complete details of a specific summary
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `summaryId` - UUID of the summary
- **Response Payload (Success):**

```json
{
  "id": "uuid",
  "video": {
    "id": "uuid",
    "youtube_video_id": "abc123",
    "title": "Video Title",
    "thumbnail_url": "https://...",
    "published_at": "2025-11-15T10:00:00Z",
    "youtube_url": "https://www.youtube.com/watch?v=abc123"
  },
  "channel": {
    "id": "uuid",
    "name": "Channel Name",
    "youtube_channel_id": "UC..."
  },
  "tldr": "Brief summary text...",
  "full_summary": {
    "summary": "Detailed summary text...",
    "conclusions": ["Conclusion 1", "Conclusion 2"],
    "key_points": ["Point 1", "Point 2", "Point 3"]
  },
  "status": "completed",
  "error_code": null,
  "generated_at": "2025-11-15T10:00:00Z",
  "rating_stats": {
    "upvotes": 10,
    "downvotes": 2
  },
  "user_rating": true
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `404 Not Found` - Summary not found
  - `403 Forbidden` - Summary belongs to a video from non-subscribed channel
  - `401 Unauthorized` - Invalid or expired token

#### Generate Summary (Manual)

- **Method:** `POST`
- **Path:** `/api/summaries`
- **Description:** Manually initiates summary generation for a YouTube video
- **Authentication:** Required (Bearer token)
- **Request Payload:**

```json
{
  "video_url": "https://www.youtube.com/watch?v=abc123"
}
```

- **Response Payload (Success):**

```json
{
  "id": "uuid",
  "video": {
    "id": "uuid",
    "youtube_video_id": "abc123",
    "title": "Video Title"
  },
  "status": "pending",
  "message": "Summary generation initiated"
}
```

- **Success Code:** `202 Accepted`
- **Error Responses:**
  - `400 Bad Request` - Invalid YouTube video URL
  - `403 Forbidden` - Video belongs to a channel not subscribed by user
  - `404 Not Found` - YouTube video not found
  - `409 Conflict` - Summary already exists for this video (completed or in progress)
  - `422 Unprocessable Entity` - Video too long (>45 minutes) or no subtitles available
  - `429 Too Many Requests` - Daily successful generation limit reached for this channel (failed attempts can be retried)
  - `401 Unauthorized` - Invalid or expired token

#### Hide Summary

- **Method:** `POST`
- **Path:** `/api/summaries/:summaryId/hide`
- **Description:** Hides a summary from user's dashboard (does not delete from database as summaries are shared resources)
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `summaryId` - UUID of the summary
- **Request Payload:** None
- **Response Payload (Success):**

```json
{
  "message": "Summary hidden from your dashboard"
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `404 Not Found` - Summary not found
  - `403 Forbidden` - Cannot hide summaries from non-subscribed channels
  - `409 Conflict` - Summary already hidden
  - `401 Unauthorized` - Invalid or expired token

#### Unhide Summary

- **Method:** `DELETE`
- **Path:** `/api/summaries/:summaryId/hide`
- **Description:** Unhides a previously hidden summary
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `summaryId` - UUID of the summary
- **Response Payload (Success):**

```json
{
  "message": "Summary restored to your dashboard"
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `404 Not Found` - Summary not found or not hidden
  - `401 Unauthorized` - Invalid or expired token

### 2.6. Summary Ratings

#### Rate Summary

- **Method:** `POST`
- **Path:** `/api/summaries/:summaryId/ratings`
- **Description:** Creates or updates a user's rating for a summary
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `summaryId` - UUID of the summary
- **Request Payload:**

```json
{
  "rating": true
}
```

- **Response Payload (Success):**

```json
{
  "id": "uuid",
  "summary_id": "uuid",
  "rating": true,
  "created_at": "2025-11-15T10:00:00Z",
  "message": "Rating saved successfully"
}
```

- **Success Code:** `201 Created` (new rating) or `200 OK` (updated rating)
- **Error Responses:**
  - `404 Not Found` - Summary not found
  - `403 Forbidden` - Cannot rate summaries from non-subscribed channels
  - `400 Bad Request` - Invalid rating value (must be boolean)
  - `401 Unauthorized` - Invalid or expired token

#### Remove Rating

- **Method:** `DELETE`
- **Path:** `/api/summaries/:summaryId/ratings`
- **Description:** Removes the user's rating from a summary
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `summaryId` - UUID of the summary
- **Response Payload (Success):**

```json
{
  "message": "Rating removed successfully"
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `404 Not Found` - Rating not found
  - `401 Unauthorized` - Invalid or expired token

### 2.7. Generation Requests

#### Check Generation Status

- **Method:** `GET`
- **Path:** `/api/generation-requests/status`
- **Description:** Checks if a summary can be generated for a specific channel today (checks GLOBAL limit, not per-user)
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `channel_id` (required) - UUID of the channel
- **Response Payload (Success):**

```json
{
  "channel_id": "uuid",
  "can_generate": true,
  "successful_summaries_today_global": 0,
  "limit": 1,
  "last_successful_generation_at": null,
  "note": "This is a GLOBAL limit per channel (across all users). Only successful (completed) summaries count toward the daily limit. Failed generation attempts can be retried."
}
```

- **Success Code:** `200 OK`
- **Error Responses:**
  - `400 Bad Request` - Missing or invalid channel_id
  - `403 Forbidden` - Channel not subscribed by user
  - `401 Unauthorized` - Invalid or expired token

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

The API uses **Supabase Auth** with JWT (JSON Web Tokens) for authentication:

1. **Registration & Login:** Users authenticate with email/password. Supabase issues an `access_token` (JWT) and `refresh_token`.

2. **Token Usage:** All protected endpoints require the `access_token` in the `Authorization` header:

   ```
   Authorization: Bearer <access_token>
   ```

3. **Token Refresh:** When the `access_token` expires, clients use the `refresh_token` to obtain a new `access_token` through Supabase SDK.

4. **Password Reset:** Uses Supabase's built-in password reset flow with time-limited, single-use tokens sent via email.

### 3.2. Authorization Strategy

Authorization is implemented using **Supabase Row-Level Security (RLS)** policies:

#### User Context

- All RLS policies use `auth.uid()` to identify the authenticated user
- Backend operations use `service_role_key` to bypass RLS when needed

#### Resource-Level Policies

**Profiles:**

- `SELECT`: Any authenticated user can read all profiles
- `UPDATE`: Users can only update their own profile (`auth.uid() = id`)

**Subscriptions:**

- `ALL`: Users can only access their own subscriptions (`auth.uid() = user_id`)

**Channels:**

- `SELECT`: Publicly readable (shared resource)

**Videos:**

- `SELECT`: Users can only view videos from subscribed channels
  ```sql
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.channel_id = videos.channel_id
    AND subscriptions.user_id = auth.uid()
  )
  ```

**Summaries:**

- `SELECT`: Users can only read summaries for videos from subscribed channels
  ```sql
  EXISTS (
    SELECT 1 FROM videos v
    JOIN subscriptions s ON s.channel_id = v.channel_id
    WHERE v.id = summaries.video_id
    AND s.user_id = auth.uid()
  )
  ```
- `DELETE`: Controlled via API endpoint logic (not direct RLS)

**Summary Ratings:**

- `SELECT`: Any authenticated user can read all ratings (for vote counts)
- `INSERT`, `DELETE`: Users can only create/delete their own ratings (`auth.uid() = user_id`)

**Hidden Summaries:**

- `ALL`: Users can only access their own hidden summaries (`auth.uid() = user_id`)
- `SELECT`: User can only see their own hidden summaries
- `INSERT`: User can only hide summaries for themselves
- `DELETE`: User can only unhide their own hidden summaries

**Generation Requests:**

- `SELECT`, `INSERT`: Users can only access their own requests (`auth.uid() = user_id`)

### 3.3. Security Headers

All API responses include standard security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## 4. Validation and Business Logic

### 4.1. Validation Rules

#### Authentication

- **Email:** Must be valid email format (RFC 5322 compliant)
- **Password:**
  - Minimum 8 characters
  - Must contain at least one uppercase letter, one lowercase letter, one number
  - No maximum length enforced

#### Subscriptions

- **Channel URL:** Must be valid YouTube channel URL format:
  - `https://www.youtube.com/@username`
  - `https://www.youtube.com/channel/UC...`
  - `https://www.youtube.com/c/channelname`
- **Subscription Limit:** Maximum 10 channels per user (enforced by database trigger)
- **Uniqueness:** User cannot subscribe to the same channel twice

#### Summary Generation

- **Video URL:** Must be valid YouTube video URL format:
  - `https://www.youtube.com/watch?v=...`
  - `https://youtu.be/...`
- **Video Duration:** Maximum 45 minutes (2700 seconds)
- **Subtitles:** Video must have available subtitles/captions
- **Video Access:** Video must be public or unlisted (not private)
- **Rate Limit:** One successful summary per channel per day **GLOBALLY** (not per-user)
  - This is because summaries are shared resources between all users
  - If any user (or automatic system) successfully generates a summary for a channel today, no one else can generate another one for that channel until tomorrow
  - This prevents duplicate summaries and optimizes LLM costs

#### Ratings

- **Rating Value:** Must be boolean (true = upvote, false = downvote)
- **Uniqueness:** One rating per user per summary (upsert operation)

#### Pagination

- **Limit:** Minimum 1, maximum 100, default varies by endpoint
- **Offset:** Minimum 0, default 0

### 4.2. Business Logic Implementation

#### User Registration and Profile Creation

**Creating a New User:**

1. Validate email format and password strength
2. Check if email is already registered (Supabase Auth handles this)
3. Create user account in `auth.users` via Supabase Auth
4. Automatically create corresponding record in `profiles` table using database trigger or API logic
5. Profile record has same UUID as user (`id` field is foreign key to `auth.users(id)`)
6. Return session tokens and user data
7. User is automatically logged in after registration

**Database Trigger for Profile Creation (Recommended):**

```sql
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();
```

#### Subscription Management

**Adding a Subscription:**

1. Validate YouTube channel URL format
2. Extract channel ID from URL
3. Check if user already has 10 subscriptions (database trigger also enforces this)
4. Check if channel already exists in `channels` table
5. If not, fetch channel metadata from YouTube API and create record
6. Create subscription record linking user to channel
7. Return subscription details with channel information

**Removing a Subscription:**

1. Verify subscription exists and belongs to authenticated user
2. Delete subscription record from `subscriptions` table
3. **Database trigger automatically cleans up** `hidden_summaries` for that channel (see trigger `on_subscription_deleted`)
4. Keep channel, videos, and summaries intact (shared resources - other users may still be subscribed)
5. User immediately loses access to:
   - Videos from that channel (via RLS)
   - Summaries from that channel (via RLS)
   - Ability to generate new summaries for that channel
6. User's ratings for that channel remain in database but become inaccessible (preserved for analytics)
7. If user re-subscribes to the same channel later:
   - They regain access to all summaries (fresh start - no hidden summaries)
   - Their previous ratings are still there and accessible again

#### Summary Generation

**Automatic Generation (Daily at 19:00):**

1. Cron job triggers at 19:00 UTC
2. For each channel in `channels` table:
   - Fetch latest video from YouTube API
   - Check if video already exists in `videos` table
   - If new video found:
     - Check if a successful summary (`status = 'completed'`) was already generated for this channel today (current calendar day UTC)
     - Daily limit is shared between automatic and manual generation
     - If successful summary already exists for today, skip this channel
     - If limit not reached, create `summaries` record with status `pending`
     - Queue summary generation job
3. Background workers process pending summaries:
   - Fetch video subtitles
   - Send to LLM via OpenRouter API
   - Parse response into TL;DR and full summary (JSON)
   - Update `summaries` record with results
   - Set status to `completed` or `failed` with appropriate error code
   - Failed summaries do NOT prevent future generation attempts for the same channel on the same day

**Manual Generation:**

1. Validate video URL and extract video ID
2. Check if video exists in `videos` table, if not create it
3. Verify video belongs to a channel user subscribes to
4. **Atomic check and create** to prevent race conditions:
   - Use database transaction with appropriate locking
   - Query `summaries` table for videos from this channel with status `completed` and `generated_at` within current calendar day (UTC)
   - If a successful summary exists for today, return `429 Too Many Requests`
   - Failed summaries (`status = 'failed'`) do NOT count toward the limit and can be retried
5. Validate video constraints:
   - Duration ≤ 45 minutes
   - Has available subtitles
   - Is public/unlisted
6. Check if summary already exists for video:
   - If exists with status `completed`, return `409 Conflict`
   - If exists with status `failed`, allow regeneration (update existing record)
   - If exists with status `pending` or `in_progress`, return `409 Conflict` with message "Generation already in progress"
7. Within the same transaction:
   - Create `generation_requests` record for analytics/tracking
   - Create or update `summaries` record with status `pending`
   - Commit transaction
8. After successful transaction, queue summary generation job (same process as automatic)
9. Return `202 Accepted` with summary ID

**Race Condition Prevention:**

- Use database-level locking or UPSERT with conflict handling
- PostgreSQL advisory locks can be used for channel-level locking
- Example: `SELECT pg_advisory_xact_lock(hashtext(channel_id))` at start of transaction
- This ensures only one summary can be created per channel at a time
- If two users try to generate simultaneously, one will succeed and the other will get `429` or `409`

#### Hidden Summaries Management

**Why Hidden Summaries Instead of Deletion:**

- Summaries are shared resources between all users subscribed to a channel
- Physical deletion would remove the summary for ALL users
- Hidden summaries allow each user to personalize their dashboard without affecting others

**Hiding a Summary:**

1. Verify user has access to summary (via RLS - must be subscribed to channel)
2. Check if summary is already hidden for this user
3. If already hidden, return `409 Conflict`
4. Create record in `hidden_summaries` table with `user_id` and `summary_id`
5. Summary will no longer appear in user's dashboard queries

**Unhiding a Summary:**

1. Check if summary is hidden for this user
2. If not hidden, return `404 Not Found`
3. Delete record from `hidden_summaries` table
4. Summary will reappear in user's dashboard queries

**Listing Summaries (with Hidden Filter):**

- All list summary queries must exclude summaries that exist in `hidden_summaries` for the authenticated user
- SQL pattern: `WHERE NOT EXISTS (SELECT 1 FROM hidden_summaries WHERE user_id = auth.uid() AND summary_id = summaries.id)`

**Database Schema for Hidden Summaries:**

```sql
CREATE TABLE hidden_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_id)
);
```

#### Rating System

**Creating/Updating Rating:**

1. Verify user has access to summary (via RLS)
2. Use UPSERT operation (`INSERT ... ON CONFLICT ... UPDATE`)
3. If rating exists for user+summary, update it
4. If not, create new rating record
5. Return rating details

**Retrieving Rating Statistics:**

1. Aggregate counts from `summary_ratings` table
2. Group by `rating` value (true/false)
3. Return upvote and downvote counts
4. Include authenticated user's personal rating if exists

#### Error Handling Logic

**Summary Generation Errors:**

- `NO_SUBTITLES`: Video has no available subtitles or captions
  - Check subtitle availability before processing
  - Store error code in `summaries.error_code`
  - Display user-friendly message: "Unable to generate summary: No subtitles available"

- `VIDEO_PRIVATE`: Video is private, deleted, or unavailable
  - Catch YouTube API 404 or access errors
  - Store error code in `summaries.error_code`
  - Display: "Unable to generate summary: Video is private or unavailable"

- `VIDEO_TOO_LONG`: Video exceeds 45-minute limit
  - Check duration before processing
  - Store error code in `summaries.error_code`
  - Display: "Unable to generate summary: Videos longer than 45 minutes are not currently supported"

**Rate Limiting:**

- Daily limit enforced by checking successful summaries in `summaries` table
- Only `completed` status summaries count toward the daily limit
- Failed summaries (`failed` status) do NOT count toward the limit
- Check for existing summary with `completed` status for channel within current calendar day (UTC)
- If successful summary exists for today, reject with `429 Too Many Requests`
- Include `Retry-After` header with seconds until next day
- `generation_requests` table is used for analytics/tracking, not for rate limiting enforcement

#### Data Integrity

**Cascade Deletions:**

- User deletion: Cascades to `profiles`, `subscriptions`, `generation_requests`, `hidden_summaries`
- User deletion: Sets `user_id` to NULL in `summary_ratings` (preserves rating data for analytics)
- Subscription deletion: Triggers automatic cleanup of `hidden_summaries` for that channel (via `on_subscription_deleted` trigger)
- Channel deletion: Cascades to `subscriptions`, `videos`
- Video deletion: Cascades to `summaries`, `generation_requests`
- Summary deletion: Cascades to `summary_ratings`, `hidden_summaries`
- Note: Channels, videos, and summaries should rarely (if ever) be deleted as they are shared resources

**Shared Resources:**

- Channels, videos, and summaries are global resources
- Not deleted when user unsubscribes or deletes account
- Multiple users can access same summaries if subscribed to channel
- Optimizes storage and LLM costs (one summary serves many users)

### 4.3. Performance Considerations

#### Indexes

- Composite index on `subscriptions(user_id, channel_id)` for subscription lookups
- Index on `videos.published_at DESC` for chronological sorting
- Composite index on `summary_ratings(user_id, summary_id)` for rating checks
- Composite index on `hidden_summaries(user_id, summary_id)` for hidden summary lookups
- Index on `summaries(channel_id, generated_at, status)` for rate limiting checks
- Automatic indexes on all foreign keys for join optimization

#### Pagination

- All list endpoints implement offset-based pagination with `limit` and `offset` parameters
- Default page size: 20 items (varies by endpoint)
- Maximum page size: 100 items
- Include total count in pagination metadata
- Note: For high-performance requirements, consider migrating to cursor-based pagination in future versions

#### Caching Strategy (Future Enhancement)

- Cache channel metadata for 24 hours
- Cache summary list responses for 5 minutes
- Invalidate cache on new summary creation
- Use ETags for conditional requests

### 4.4. Rate Limiting

#### Per-Channel Limits (Global, not per-user)

- Summary generation: 1 successful summary per channel per day (24-hour UTC period) **GLOBALLY**
  - This is a global limit across ALL users, not per-user
  - Only `completed` status summaries count toward this limit
  - Failed generation attempts can be retried without penalty
  - Rationale: Summaries are shared resources - one summary serves all users subscribed to that channel
  - Prevents duplicate LLM API calls and optimizes costs
  - If user A generates a summary for Channel X today, user B cannot generate another one for Channel X today (they will see user A's summary)

#### Per-User Limits

- API requests: 100 requests per minute per user (to be implemented)
- Failed login attempts: 5 attempts per 15 minutes (Supabase Auth default)
- Subscription limit: Maximum 10 channels per user

#### Global Limits

- LLM API calls: Controlled via OpenRouter API key limits
- YouTube API quota: Monitor daily quota usage

## 5. API Response Format Standards

### 5.1. Success Response Structure

All successful responses follow consistent structure:

```json
{
  "data": {},
  "message": "Optional success message",
  "pagination": {}
}
```

### 5.2. Error Response Structure

All error responses follow consistent structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### 5.3. Common Error Codes

- `INVALID_CREDENTIALS` - Login failed
- `INVALID_TOKEN` - JWT token invalid or expired
- `SUBSCRIPTION_LIMIT_REACHED` - User has 10 channels already
- `ALREADY_SUBSCRIBED` - Duplicate subscription attempt
- `GENERATION_LIMIT_REACHED` - Daily successful summary limit exceeded (failed attempts can be retried)
- `VIDEO_TOO_LONG` - Video exceeds 45 minutes
- `NO_SUBTITLES` - Video has no available subtitles
- `VIDEO_PRIVATE` - Video is private or unavailable
- `INVALID_URL` - Malformed URL provided
- `CHANNEL_NOT_SUBSCRIBED` - Attempting action on non-subscribed channel
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `UNAUTHORIZED_ACCESS` - User lacks permission for resource

## 6. API Versioning

Currently implementing **v1** of the API. Versioning strategy:

- **URL Path Versioning:** All endpoints are prefixed with `/api/` (implicit v1)
- **Future Versions:** Will use `/api/v2/` prefix for breaking changes
- **Backward Compatibility:** v1 endpoints will be maintained for minimum 12 months after v2 release
- **Deprecation:** Deprecated endpoints return `X-API-Deprecated: true` header with deprecation date

## 7. CORS Policy

**Allowed Origins:**

- Production: `https://videosummary.app` (to be determined)
- Development: `http://localhost:4321` (Astro default)

**Allowed Methods:** `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS`

**Allowed Headers:** `Content-Type`, `Authorization`, `X-Requested-With`

**Exposed Headers:** `X-Total-Count`, `X-API-Deprecated`

**Credentials:** `true` (allows cookies and authorization headers)

## 8. Webhooks and Background Jobs

### 8.1. Scheduled Jobs

**Daily Summary Generation (Cron):**

- **Schedule:** Every day at 19:00 UTC
- **Implementation:** GitHub Actions cron workflow or cloud scheduler
- **Endpoint:** `POST /api/internal/jobs/generate-daily-summaries` (service role auth)
- **Process:**
  1. Fetch all channels
  2. For each channel, get latest video
  3. Check if summary needed
  4. Queue summary generation jobs

### 8.2. Background Jobs

**Summary Generation Worker:**

- Processes `summaries` with status `pending`
- Fetches video subtitles via YouTube API
- Sends to LLM via OpenRouter
- Updates summary record with results
- Implements exponential backoff for failures
- Maximum 3 retry attempts

### 8.3. Internal Endpoints

These endpoints are protected by service role key and not accessible to users:

- `POST /api/internal/jobs/generate-daily-summaries` - Trigger daily generation
- `POST /api/internal/jobs/process-pending-summaries` - Process pending queue
- `POST /api/internal/channels/sync-metadata` - Sync channel metadata from YouTube

## 9. API Documentation

Interactive API documentation will be provided using:

- **OpenAPI 3.0 Specification:** Complete API schema in `openapi.yaml`
- **Swagger UI:** Interactive documentation at `/api/docs`
- **Postman Collection:** Importable collection for testing

Each endpoint includes:

- Description and use cases
- Request/response examples
- Authentication requirements
- Error scenarios
- Rate limiting information

## 10. Testing Strategy

**API Testing Levels:**

1. **Unit Tests (Vitest):** Test individual functions and validation logic
2. **Integration Tests:** Test API endpoints with test database
3. **E2E Tests (Playwright):** Test complete user workflows through UI

**Test Coverage Goals:**

- Minimum 80% code coverage for business logic
- 100% coverage for critical paths (auth, data deletion, rate limiting)
- All error conditions tested

**Test Data:**

- Use separate test Supabase project
- Seed with consistent test data
- Clean up after test runs

## 11. Database Schema Updates Required

Based on this API plan, the following additions are needed to the database schema:

### New Table: `hidden_summaries`

This table was not in the original database schema but is required for the API implementation:

```sql
CREATE TABLE hidden_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_id)
);

-- Index for performance
CREATE INDEX idx_hidden_summaries_user_summary
  ON hidden_summaries(user_id, summary_id);

-- RLS Policies
ALTER TABLE hidden_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hidden summaries"
  ON hidden_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can hide summaries for themselves"
  ON hidden_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide their own summaries"
  ON hidden_summaries FOR DELETE
  USING (auth.uid() = user_id);
```

### Recommended Index Additions

Add these indexes to existing tables for optimal performance:

```sql
-- For rate limiting checks (channel + date + status)
CREATE INDEX idx_summaries_rate_limit
  ON summaries(channel_id, generated_at DESC, status)
  WHERE status = 'completed';

-- For video lookup by YouTube ID
CREATE INDEX idx_videos_youtube_id
  ON videos(youtube_video_id);

-- For channel lookup by YouTube ID
CREATE INDEX idx_channels_youtube_id
  ON channels(youtube_channel_id);
```

### Profile Creation Trigger

Add trigger to automatically create profile when user registers:

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

## 12. Key Design Decisions and Problem Resolutions

This section documents important design decisions made during API planning and problems that were identified and resolved:

### 12.1. Summary Deletion → Hidden Summaries

**Problem:** Original plan included DELETE endpoint for summaries, but summaries are shared resources between all users subscribed to a channel. Deleting would affect all users.

**Solution:**

- Changed to "hide/unhide" functionality instead of physical deletion
- Added `hidden_summaries` table to track which summaries each user has hidden
- Each user can personalize their dashboard without affecting others
- Hidden summaries can be unhidden if user changes their mind

### 12.2. Rate Limiting - Global vs Per-User

**Problem:** Initial specification was ambiguous about whether rate limit was per-user or global.

**Solution:**

- Rate limit is **GLOBAL per channel** (not per-user)
- Rationale: Summaries are shared resources - one summary serves all users
- Prevents duplicate LLM API calls and optimizes costs
- If user A generates a summary for Channel X today, user B will see the same summary
- Only successful (`completed`) summaries count toward limit
- Failed attempts can be retried without penalty

### 12.3. Race Condition in Summary Generation

**Problem:** Two users could simultaneously try to generate a summary for the same channel, potentially creating duplicates or exceeding rate limits.

**Solution:**

- Use PostgreSQL advisory locks at channel level
- Wrap rate limit check and summary creation in atomic transaction
- Example: `SELECT pg_advisory_xact_lock(hashtext(channel_id))`
- Ensures only one summary can be created per channel at a time

### 12.4. Pagination Terminology

**Problem:** Document initially referred to "cursor-based pagination" while using offset/limit.

**Solution:**

- Corrected to "offset-based pagination"
- Offset-based uses `limit` and `offset` parameters
- Cursor-based would use cursor tokens (e.g., `after_id`, `before_id`)
- Noted that cursor-based might be considered for future versions

### 12.5. Profile Creation on Registration

**Problem:** No specification for how `profiles` table gets populated when user registers.

**Solution:**

- Added database trigger `on_auth_user_created` that automatically creates profile record
- Profile `id` matches user `id` from `auth.users`
- Trigger ensures consistency and eliminates need for API-level logic

### 12.6. Channel Filtering in List Endpoints

**Problem:** Unclear behavior when user filters by `channel_id` they don't subscribe to.

**Solution:**

- Returns empty list (not 403 Forbidden)
- RLS policies automatically filter out non-subscribed channels
- Consistent with zero-trust security model
- Prevents information leakage about channel existence

### 12.7. Unsubscribe Behavior

**Problem:** Unclear what happens to user's ratings and hidden summaries when they unsubscribe.

**Solution:**

- Subscription deletion removes the subscription record
- Database trigger (`on_subscription_deleted`) automatically cleans up `hidden_summaries` for that channel
- User's ratings remain in database but become inaccessible via RLS (preserved for analytics)
- If user re-subscribes:
  - They regain access to all summaries (fresh start - no hidden summaries)
  - Their previous ratings are still there and accessible again
- This prevents accumulation of orphaned data while preserving valuable analytics

### 12.8. Failed Generation Attempts and Rate Limiting

**Problem:** Original logic would block users from retrying if generation failed due to missing subtitles or other errors.

**Solution:**

- Only `completed` status summaries count toward daily limit
- `failed` status summaries do NOT count
- Users can retry with different videos from the same channel
- Prevents frustration when videos don't meet requirements
- System can automatically retry same video if failure was temporary (e.g., YouTube API error)

### 12.9. Summary Visibility After Unsubscribe

**Problem:** Should users keep access to summaries after unsubscribing from a channel?

**Solution:**

- Users immediately lose access via RLS when they unsubscribe
- This is correct behavior because:
  - They are no longer paying the "cost" of being subscribed (channel slot in 10-limit)
  - Summaries belong to the channel subscription, not to the user
  - Prevents users from subscribing, getting summaries, then unsubscribing to free up slots
  - If they want to keep summaries, they should keep the subscription

### 12.10. Automatic Generation Conflicts with Manual Generation

**Problem:** If user manually generates a summary today, should automatic generation try to generate another one at 19:00?

**Solution:**

- Daily limit is shared between automatic and manual generation
- Before automatic generation, system checks if successful summary already exists for today
- If yes (whether created manually or automatically), skip that channel
- This is globally enforced, not per-user
- Optimizes LLM costs and respects rate limits
