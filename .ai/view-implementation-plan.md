# REST API Implementation Plans - VideoSummary

This document provides comprehensive implementation plans for all REST API endpoints in the VideoSummary application.

## Table of Contents

1. [Authentication Endpoints](#1-authentication-endpoints)
2. [Profile Endpoints](#2-profile-endpoints)
3. [Channels & Subscriptions Endpoints](#3-channels--subscriptions-endpoints)
4. [Videos Endpoints](#4-videos-endpoints)
5. [Summaries Endpoints](#5-summaries-endpoints)
6. [Summary Ratings Endpoints](#6-summary-ratings-endpoints)
7. [Generation Requests Endpoints](#7-generation-requests-endpoints)

---

## 1. Authentication Endpoints

### 1.1. Register New User

#### Endpoint Overview

Creates a new user account with email and password. Upon successful registration, automatically creates a user profile and returns session tokens for immediate authentication.

#### Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/auth/register`
- **Authentication:** None (public endpoint)
- **Parameters:**
  - Required: None (body only)
  - Optional: None
- **Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

#### Used Types

- **Request DTO:** `RegisterRequest`
- **Response DTO:** `AuthResponse`
- **Error DTO:** `ApiError`

#### Response Details

- **Success (201 Created):**

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

#### Data Flow

1. Receive and parse request body
2. Validate email format and password strength using Zod schema
3. Call `supabase.auth.signUp()` with email and password
4. If successful, Supabase Auth creates user in `auth.users`
5. Database trigger `on_auth_user_created` automatically creates profile in `profiles` table
6. Return user data and session tokens
7. If error, return appropriate error response

#### Security Considerations

- **Input Validation:**
  - Email: RFC 5322 compliant format
  - Password: Minimum 8 characters, at least one uppercase, one lowercase, one number
- **Rate Limiting:** Implement per-IP rate limiting (suggested: 5 attempts per 15 minutes)
- **Data Sanitization:** Sanitize email input to prevent injection attacks
- **HTTPS Only:** Ensure endpoint only accessible via HTTPS in production
- **Password Security:** Never log or expose passwords; handled securely by Supabase Auth

#### Error Handling

- **400 Bad Request:**
  - Invalid email format
  - Password doesn't meet strength requirements
  - Missing required fields
  - Error code: `INVALID_INPUT`
- **409 Conflict:**
  - Email already registered
  - Error code: `EMAIL_ALREADY_EXISTS`
- **422 Unprocessable Entity:**
  - Validation errors from Zod schema
  - Error code: `VALIDATION_ERROR`
- **500 Internal Server Error:**
  - Database connection failure
  - Supabase Auth service error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Email validation is O(1) with regex
- Password hashing handled by Supabase Auth (bcrypt)
- Profile creation via trigger is atomic with user creation
- Response time target: <500ms

#### Implementation Steps

1. Create Zod schema for request validation (`RegisterRequestSchema`)
2. Create API route handler at `src/pages/api/auth/register.ts`
3. Parse and validate request body using Zod
4. Call `context.locals.supabase.auth.signUp({ email, password })`
5. Handle Supabase Auth errors and map to appropriate HTTP status codes
6. Format successful response according to `AuthResponse` type
7. Return response with appropriate status code
8. Add error logging for debugging (without sensitive data)
9. Test with various input scenarios (valid, invalid email, weak password, duplicate email)

---

### 1.2. Login

#### Endpoint Overview

Authenticates an existing user with email and password credentials and returns session tokens.

#### Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/auth/login`
- **Authentication:** None (public endpoint)
- **Parameters:**
  - Required: None (body only)
  - Optional: None
- **Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

#### Used Types

- **Request DTO:** `LoginRequest`
- **Response DTO:** `AuthResponse`
- **Error DTO:** `ApiError`

#### Response Details

- **Success (200 OK):**

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

#### Data Flow

1. Receive and parse request body
2. Validate email and password presence using Zod schema
3. Call `supabase.auth.signInWithPassword({ email, password })`
4. If credentials valid, return user data and session tokens
5. If invalid, return 401 Unauthorized
6. Log failed login attempts for security monitoring

#### Security Considerations

- **Authentication:** Credentials validated by Supabase Auth
- **Rate Limiting:** 5 failed login attempts per 15 minutes per email (Supabase default)
- **Brute Force Protection:** Consider implementing additional IP-based rate limiting
- **Timing Attacks:** Ensure consistent response time for valid/invalid credentials
- **Account Enumeration:** Consider returning generic error message for both invalid email and password

#### Error Handling

- **400 Bad Request:**
  - Missing email or password
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Invalid email or password combination
  - Account not confirmed
  - Error code: `INVALID_CREDENTIALS`
- **429 Too Many Requests:**
  - Rate limit exceeded
  - Error code: `RATE_LIMIT_EXCEEDED`
- **500 Internal Server Error:**
  - Supabase Auth service error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Password verification is O(1) with bcrypt
- Response time target: <300ms
- Failed login attempts should take similar time as successful ones (timing attack prevention)

#### Implementation Steps

1. Create Zod schema for request validation (`LoginRequestSchema`)
2. Create API route handler at `src/pages/api/auth/login.ts`
3. Parse and validate request body using Zod
4. Call `context.locals.supabase.auth.signInWithPassword({ email, password })`
5. Handle authentication errors and map to HTTP status codes
6. Format successful response according to `AuthResponse` type
7. Return response with appropriate status code
8. Log failed attempts (email only, never password) for security monitoring
9. Test various scenarios (valid credentials, invalid email, invalid password, unconfirmed account)

---

### 1.3. Logout

#### Endpoint Overview

Terminates the current authenticated user session by invalidating the access token.

#### Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/auth/logout`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required: None
  - Optional: None
- **Request Body:** None

#### Used Types

- **Request DTO:** None
- **Response DTO:** `ApiSuccess<void>`
- **Error DTO:** `ApiError`

#### Response Details

- **Success (200 OK):**

```json
{
  "message": "Successfully logged out"
}
```

#### Data Flow

1. Extract JWT token from Authorization header
2. Verify token is valid (handled by middleware)
3. Call `supabase.auth.signOut()`
4. Supabase invalidates the session
5. Return success message

#### Security Considerations

- **Authentication Required:** Endpoint protected by middleware checking `auth.uid()`
- **Token Invalidation:** Supabase Auth handles token blacklisting
- **Session Cleanup:** All active sessions for the user can be terminated
- **CSRF Protection:** Use standard CSRF tokens for state-changing operations

#### Error Handling

- **401 Unauthorized:**
  - Missing or invalid Bearer token
  - Token expired
  - Error code: `INVALID_TOKEN`
- **500 Internal Server Error:**
  - Supabase Auth service error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Token validation is O(1) operation
- Response time target: <200ms
- No database queries required (handled by Supabase Auth)

#### Implementation Steps

1. Create API route handler at `src/pages/api/auth/logout.ts`
2. Verify authentication in middleware (check `context.locals.supabase.auth.getUser()`)
3. Call `context.locals.supabase.auth.signOut()`
4. Return success response with message
5. Handle errors from Supabase Auth
6. Test with valid token, invalid token, and expired token

---

### 1.4. Request Password Reset

#### Endpoint Overview

Initiates the password reset process by sending an email with a time-limited, single-use reset link to the user.

#### Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/auth/reset-password`
- **Authentication:** None (public endpoint)
- **Parameters:**
  - Required: None (body only)
  - Optional: None
- **Request Body:**

```typescript
{
  email: string;
}
```

#### Used Types

- **Request DTO:** `ResetPasswordRequest`
- **Response DTO:** `ApiSuccess<void>`
- **Error DTO:** `ApiError`

#### Response Details

- **Success (200 OK):**

```json
{
  "message": "Password reset email sent"
}
```

#### Data Flow

1. Receive and parse request body
2. Validate email format using Zod schema
3. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
4. Supabase sends password reset email to user
5. Always return success message (even if email not found, for security)
6. Log request for security monitoring

#### Security Considerations

- **Account Enumeration Prevention:** Always return 200 OK, even if email doesn't exist
- **Rate Limiting:** Implement strict rate limiting (e.g., 3 requests per hour per email)
- **Token Expiration:** Reset tokens should expire quickly (default: 1 hour)
- **Single Use:** Tokens should be invalidated after use
- **Email Validation:** Sanitize and validate email input

#### Error Handling

- **400 Bad Request:**
  - Invalid email format
  - Error code: `INVALID_INPUT`
- **429 Too Many Requests:**
  - Rate limit exceeded
  - Error code: `RATE_LIMIT_EXCEEDED`
- **500 Internal Server Error:**
  - Email service error
  - Supabase Auth service error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Email validation is O(1) with regex
- Email sending is asynchronous (doesn't block response)
- Response time target: <300ms
- Consider queueing email sending for better performance

#### Implementation Steps

1. Create Zod schema for request validation (`ResetPasswordRequestSchema`)
2. Create API route handler at `src/pages/api/auth/reset-password.ts`
3. Parse and validate request body using Zod
4. Determine redirect URL for password reset page
5. Call `context.locals.supabase.auth.resetPasswordForEmail(email, { redirectTo })`
6. Always return success message regardless of email existence
7. Log request (email only) for security monitoring
8. Implement rate limiting per email and per IP
9. Test with valid email, invalid email, and rate limit scenarios

---

### 1.5. Confirm Password Reset

#### Endpoint Overview

Completes the password reset process by verifying the reset token from email and updating the user's password.

#### Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/auth/reset-password/confirm`
- **Authentication:** None (uses reset token)
- **Parameters:**
  - Required: None (body only)
  - Optional: None
- **Request Body:**

```typescript
{
  token: string;
  password: string;
}
```

#### Used Types

- **Request DTO:** `ConfirmResetPasswordRequest`
- **Response DTO:** `ApiSuccess<void>`
- **Error DTO:** `ApiError`

#### Response Details

- **Success (200 OK):**

```json
{
  "message": "Password successfully reset"
}
```

#### Data Flow

1. Receive and parse request body
2. Validate token and password using Zod schema
3. Verify password meets strength requirements
4. Call `supabase.auth.verifyOtp()` to validate token
5. If valid, call `supabase.auth.updateUser({ password })`
6. Token is automatically invalidated after successful use
7. Return success message

#### Security Considerations

- **Token Validation:** Verify token is valid, not expired, and not previously used
- **Password Strength:** Enforce same password policy as registration
- **Token Expiration:** Reset tokens expire after 1 hour (Supabase default)
- **Single Use:** Token automatically invalidated after successful reset
- **Rate Limiting:** Prevent brute force attacks on token

#### Error Handling

- **400 Bad Request:**
  - Invalid or expired token
  - Weak password that doesn't meet requirements
  - Missing required fields
  - Token already used
  - Error code: `INVALID_INPUT` or `INVALID_TOKEN`
- **422 Unprocessable Entity:**
  - Password validation errors
  - Error code: `VALIDATION_ERROR`
- **500 Internal Server Error:**
  - Database error
  - Supabase Auth service error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Token verification is O(1) operation
- Password hashing is O(1) with bcrypt
- Response time target: <500ms

#### Implementation Steps

1. Create Zod schema for request validation (`ConfirmResetPasswordRequestSchema`)
2. Create API route handler at `src/pages/api/auth/reset-password/confirm.ts`
3. Parse and validate request body using Zod
4. Extract token type and verification token from request
5. Call `context.locals.supabase.auth.verifyOtp({ token_hash, type: 'recovery' })`
6. If valid, update password with `context.locals.supabase.auth.updateUser({ password })`
7. Return success message
8. Handle various error scenarios (invalid token, expired token, weak password)
9. Test complete password reset flow end-to-end

---

## 2. Profile Endpoints

### 2.1. Get Current User Profile

#### Endpoint Overview

Retrieves the authenticated user's profile information including their subscribed channels and subscription count.

#### Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/profile`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required: None
  - Optional: None
- **Request Body:** None

#### Used Types

- **Request DTO:** None
- **Response DTO:** `UserProfile`
- **Error DTO:** `ApiError`
- **Internal Types:** `Profile`, `SubscriptionWithChannel`, `Channel`

#### Response Details

- **Success (200 OK):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2025-11-15T10:00:00Z",
  "subscribed_channels": [
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
  "subscription_count": 5
}
```

#### Data Flow

1. Extract user ID from authenticated session (`auth.uid()`)
2. Query `auth.users` table for user email and created_at
3. Query `subscriptions` table joined with `channels` for user's subscriptions
4. Count total subscriptions
5. Format response according to `UserProfile` type
6. Return profile data

#### Security Considerations

- **Authentication Required:** Verified by middleware checking `auth.uid()`
- **RLS Protection:** User can only access their own profile
- **Data Minimization:** Only return necessary profile fields
- **No Sensitive Data:** Never expose password or internal tokens

#### Error Handling

- **401 Unauthorized:**
  - Missing or invalid Bearer token
  - Token expired
  - Error code: `INVALID_TOKEN`
- **404 Not Found:**
  - User profile not found (shouldn't happen if auth is valid)
  - Error code: `RESOURCE_NOT_FOUND`
- **500 Internal Server Error:**
  - Database connection error
  - Query execution error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Single query with JOIN is more efficient than multiple queries
- RLS policies automatically filter subscriptions
- Index on `subscriptions(user_id)` ensures fast lookup
- Response time target: <200ms
- Consider caching profile data for 5 minutes

#### Implementation Steps

1. Create service function `getUserProfile(userId: string)` in `src/lib/profile.service.ts`
2. Create API route handler at `src/pages/api/profile.ts`
3. Verify authentication in middleware
4. Extract user ID from `context.locals.supabase.auth.getUser()`
5. Call service function to fetch user data from `auth.users`
6. Query subscriptions with channel data using Supabase query builder:
   ```typescript
   const { data: subscriptions } = await supabase
     .from("subscriptions")
     .select("id, created_at, channels(*)")
     .eq("user_id", userId);
   ```
7. Format response according to `UserProfile` type
8. Return 200 OK with profile data
9. Handle errors and return appropriate status codes
10. Test with authenticated user, unauthenticated request, and user with no subscriptions

---

## 3. Channels & Subscriptions Endpoints

### 3.1. List Subscribed Channels

#### Endpoint Overview

Retrieves all YouTube channels that the authenticated user is subscribed to, with pagination support.

#### Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/subscriptions`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required: None
  - Optional:
    - `limit` (query param, number, default: 50, max: 100)
    - `offset` (query param, number, default: 0, min: 0)
- **Request Body:** None

#### Used Types

- **Request DTO:** None (query params only)
- **Response DTO:** `PaginatedResponse<SubscriptionWithChannel>`
- **Error DTO:** `ApiError`
- **Internal Types:** `Subscription`, `Channel`, `PaginationMeta`

#### Response Details

- **Success (200 OK):**

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

#### Data Flow

1. Extract user ID from authenticated session
2. Parse and validate query parameters (limit, offset)
3. Query `subscriptions` table with JOIN to `channels`
4. Apply pagination (limit, offset)
5. Get total count of user's subscriptions
6. Format response with data and pagination metadata
7. Return paginated list

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **RLS Protection:** User can only see their own subscriptions via RLS policy
- **Input Validation:** Validate limit and offset to prevent abuse
- **Pagination Limits:** Enforce maximum page size (100) to prevent performance issues

#### Error Handling

- **400 Bad Request:**
  - Invalid limit or offset value (negative, non-numeric)
  - Limit exceeds maximum (100)
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **500 Internal Server Error:**
  - Database query error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Use index on `subscriptions(user_id)` for fast filtering
- Total count query can be cached for 1 minute
- Response time target: <200ms
- Consider using `SELECT count(*) OVER()` to get total in single query

#### Implementation Steps

1. Create Zod schema for query parameter validation
2. Create service function `listUserSubscriptions(userId, limit, offset)` in `src/lib/subscriptions.service.ts`
3. Create API route handler at `src/pages/api/subscriptions/index.ts`
4. Verify authentication in middleware
5. Parse and validate query parameters
6. Call service function with Supabase query:
   ```typescript
   const { data, count } = await supabase
     .from("subscriptions")
     .select("id, created_at, channels(*)", { count: "exact" })
     .eq("user_id", userId)
     .range(offset, offset + limit - 1);
   ```
7. Format response with pagination metadata
8. Return 200 OK with data
9. Test with various pagination scenarios and edge cases

---

### 3.2. Subscribe to Channel

#### Endpoint Overview

Adds a YouTube channel to the user's subscriptions. If the channel doesn't exist in the database, it fetches metadata from YouTube API and creates a new channel record before creating the subscription.

#### Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/subscriptions`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required: None (body only)
  - Optional: None
- **Request Body:**

```typescript
{
  channel_url: string; // YouTube channel URL
}
```

#### Used Types

- **Request DTO:** `SubscribeRequest`
- **Response DTO:** `ApiSuccess<SubscriptionWithChannel>`
- **Error DTO:** `ApiError`
- **Internal Types:** `ChannelInsert`, `SubscriptionInsert`

#### Response Details

- **Success (201 Created):**

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

#### Data Flow

1. Extract user ID from authenticated session
2. Parse and validate request body
3. Validate YouTube channel URL format
4. Extract YouTube channel ID from URL
5. Check if user already has 10 subscriptions (query count)
6. Check if channel exists in `channels` table
7. If not exists:
   - Fetch channel metadata from YouTube API
   - Create channel record in database
8. Check if subscription already exists
9. Create subscription record in `subscriptions` table
10. Return subscription details with channel information

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **URL Validation:** Validate YouTube channel URL format to prevent injection
- **Subscription Limit:** Enforce 10-channel limit (also enforced by database trigger)
- **RLS Protection:** User can only create subscriptions for themselves
- **YouTube API:** Validate channel exists and is accessible before creating subscription
- **Rate Limiting:** Protect against subscription spam

#### Error Handling

- **400 Bad Request:**
  - Invalid YouTube channel URL format
  - Malformed request body
  - Error code: `INVALID_URL`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **404 Not Found:**
  - YouTube channel not found or invalid
  - Channel deleted or made private
  - Error code: `CHANNEL_NOT_FOUND`
- **409 Conflict:**
  - User already subscribed to this channel
  - Error code: `ALREADY_SUBSCRIBED`
- **422 Unprocessable Entity:**
  - Subscription limit reached (10 channels max)
  - Database trigger prevents insertion
  - Error code: `SUBSCRIPTION_LIMIT_REACHED`
- **500 Internal Server Error:**
  - YouTube API error
  - Database error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- YouTube API call may add latency (500-1000ms)
- Cache channel metadata to avoid repeated API calls
- Use transaction for channel creation + subscription creation
- Response time target: <1500ms (including YouTube API)
- Index on `channels(youtube_channel_id)` for fast lookup

#### Implementation Steps

1. Create Zod schema for request validation (`SubscribeRequestSchema`)
2. Create utility function `extractYouTubeChannelId(url: string)` in `src/lib/youtube.utils.ts`
3. Create service function `subscribeToChannel(userId, channelUrl)` in `src/lib/subscriptions.service.ts`
4. Create API route handler at `src/pages/api/subscriptions/index.ts`
5. Verify authentication and extract user ID
6. Parse and validate request body
7. Extract YouTube channel ID from URL
8. Check subscription count for user:
   ```typescript
   const { count } = await supabase
     .from("subscriptions")
     .select("*", { count: "exact", head: true })
     .eq("user_id", userId);
   ```
9. If count >= 10, return 422 error
10. Check if channel exists in database
11. If not exists, fetch from YouTube API and create channel record
12. Check if subscription already exists
13. If exists, return 409 error
14. Create subscription record
15. Return 201 Created with subscription details
16. Test with valid URL, invalid URL, existing subscription, and limit scenarios

---

### 3.3. Unsubscribe from Channel

#### Endpoint Overview

Removes a channel from the user's subscriptions. This triggers automatic cleanup of the user's hidden summaries for that channel but preserves the channel, videos, and summaries for other users.

#### Request Details

- **HTTP Method:** `DELETE`
- **URL Structure:** `/api/subscriptions/:subscriptionId`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required:
    - `subscriptionId` (path param, UUID) - UUID of the subscription to delete
  - Optional: None
- **Request Body:** None

#### Used Types

- **Request DTO:** None (path param only)
- **Response DTO:** `ApiSuccess<void>`
- **Error DTO:** `ApiError`

#### Response Details

- **Success (200 OK):**

```json
{
  "message": "Successfully unsubscribed from channel"
}
```

#### Data Flow

1. Extract user ID from authenticated session
2. Extract subscription ID from URL path
3. Validate subscription ID format (UUID)
4. Query subscription to verify it exists and belongs to user
5. Delete subscription record
6. Database trigger `on_subscription_deleted` automatically:
   - Finds all summaries from that channel
   - Removes them from user's `hidden_summaries`
7. User immediately loses RLS access to:
   - Videos from that channel
   - Summaries from that channel
8. Return success message

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **Authorization:** User can only delete their own subscriptions
- **RLS Protection:** DELETE policy checks `auth.uid() = user_id`
- **Verify Ownership:** Double-check subscription belongs to user before deletion
- **UUID Validation:** Validate subscription ID format

#### Error Handling

- **400 Bad Request:**
  - Invalid subscription ID format (not a UUID)
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **403 Forbidden:**
  - Attempting to delete another user's subscription
  - Error code: `UNAUTHORIZED_ACCESS`
- **404 Not Found:**
  - Subscription not found
  - Subscription already deleted
  - Error code: `RESOURCE_NOT_FOUND`
- **500 Internal Server Error:**
  - Database error
  - Trigger execution error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- UUID lookup with index is O(1)
- Trigger cleanup is async and doesn't block response
- Response time target: <200ms
- Deletion cascades handled by database efficiently

#### Implementation Steps

1. Create Zod schema for path parameter validation
2. Create service function `unsubscribeFromChannel(userId, subscriptionId)` in `src/lib/subscriptions.service.ts`
3. Create API route handler at `src/pages/api/subscriptions/[subscriptionId].ts`
4. Verify authentication and extract user ID
5. Parse and validate subscription ID from path
6. Verify subscription exists and belongs to user:
   ```typescript
   const { data: subscription } = await supabase
     .from("subscriptions")
     .select("*")
     .eq("id", subscriptionId)
     .eq("user_id", userId)
     .single();
   ```
7. If not found or wrong user, return appropriate error
8. Delete subscription:
   ```typescript
   await supabase.from("subscriptions").delete().eq("id", subscriptionId).eq("user_id", userId);
   ```
9. Return 200 OK with success message
10. Test with valid subscription, invalid ID, another user's subscription

---

## 4. Videos Endpoints

### 4.1. List Videos from Subscribed Channels

#### Endpoint Overview

Retrieves videos from the user's subscribed channels with pagination, filtering, and sorting options. Only returns videos from channels the user is subscribed to (enforced by RLS).

#### Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/videos`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required: None
  - Optional:
    - `limit` (query param, number, default: 20, max: 100)
    - `offset` (query param, number, default: 0, min: 0)
    - `channel_id` (query param, UUID, optional) - Filter by specific channel
    - `sort` (query param, string, default: "published_at_desc") - Options: "published_at_desc", "published_at_asc"
- **Request Body:** None

#### Used Types

- **Request DTO:** None (query params only)
- **Response DTO:** `PaginatedResponse<VideoSummary>`
- **Error DTO:** `ApiError`
- **Internal Types:** `VideoBasic`, `Channel`, `PaginationMeta`

#### Response Details

- **Success (200 OK):**

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

#### Data Flow

1. Extract user ID from authenticated session
2. Parse and validate query parameters
3. Build query with filters:
   - RLS automatically filters to subscribed channels
   - Apply channel_id filter if provided
   - Apply sort order
   - Apply pagination (limit, offset)
4. Join with channels table for channel info
5. Check if summary exists for each video (LEFT JOIN summaries)
6. Get total count
7. Format response with VideoSummary type
8. Return paginated list

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **RLS Protection:** Videos filtered by subscription via RLS policy
- **Channel Filter:** If non-subscribed channel_id provided, returns empty list (not 403)
- **Input Validation:** Validate all query parameters
- **SQL Injection:** Use parameterized queries (Supabase handles this)

#### Error Handling

- **400 Bad Request:**
  - Invalid limit, offset, or sort value
  - Invalid channel_id format (not UUID)
  - Unknown sort option
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **500 Internal Server Error:**
  - Database query error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Index on `videos(published_at DESC)` for sorting
- Index on `videos(channel_id)` for filtering
- RLS policy uses indexed subscription lookup
- Response time target: <300ms
- Consider caching video lists for 1 minute
- Use `SELECT count(*) OVER()` for single-query pagination

#### Implementation Steps

1. Create Zod schema for query parameter validation
2. Create service function `listVideos(userId, filters)` in `src/lib/videos.service.ts`
3. Create API route handler at `src/pages/api/videos/index.ts`
4. Verify authentication and extract user ID
5. Parse and validate query parameters
6. Build Supabase query:

   ```typescript
   let query = supabase.from("videos").select(
     `
       id,
       youtube_video_id,
       title,
       thumbnail_url,
       published_at,
       channels (id, name, youtube_channel_id),
       summaries (id)
     `,
     { count: "exact" }
   );

   if (channel_id) {
     query = query.eq("channel_id", channel_id);
   }

   const orderColumn = "published_at";
   const ascending = sort === "published_at_asc";
   query = query.order(orderColumn, { ascending });

   query = query.range(offset, offset + limit - 1);
   ```

7. Map results to VideoSummary type (set has_summary based on summaries presence)
8. Format response with pagination metadata
9. Return 200 OK with data
10. Test various filter and sort combinations

---

### 4.2. Get Video Details

#### Endpoint Overview

Retrieves detailed information about a specific video, including its channel and summary status. User must be subscribed to the video's channel to access it.

#### Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/videos/:videoId`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required:
    - `videoId` (path param, UUID) - UUID of the video
  - Optional: None
- **Request Body:** None

#### Used Types

- **Request DTO:** None (path param only)
- **Response DTO:** `DetailedVideo`
- **Error DTO:** `ApiError`
- **Internal Types:** `Channel`, `SummaryBasic`

#### Response Details

- **Success (200 OK):**

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

#### Data Flow

1. Extract user ID from authenticated session
2. Extract video ID from URL path
3. Validate video ID format (UUID)
4. Query video with channel and summary information
5. RLS automatically checks if user is subscribed to channel
6. If not subscribed, query returns no results (treat as 403)
7. Format response according to DetailedVideo type
8. Return video details

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **RLS Protection:** Video only accessible if user subscribed to channel
- **Authorization Check:** 403 if video belongs to non-subscribed channel
- **UUID Validation:** Validate video ID format

#### Error Handling

- **400 Bad Request:**
  - Invalid video ID format (not UUID)
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **403 Forbidden:**
  - Video belongs to channel not subscribed by user
  - Error code: `UNAUTHORIZED_ACCESS`
- **404 Not Found:**
  - Video not found
  - Error code: `RESOURCE_NOT_FOUND`
- **500 Internal Server Error:**
  - Database query error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- UUID lookup with index is O(1)
- Single query with JOINs is efficient
- RLS policy check is indexed
- Response time target: <200ms

#### Implementation Steps

1. Create Zod schema for path parameter validation
2. Create service function `getVideoDetails(videoId)` in `src/lib/videos.service.ts`
3. Create API route handler at `src/pages/api/videos/[videoId].ts`
4. Verify authentication and extract user ID
5. Parse and validate video ID from path
6. Query video with joins:
   ```typescript
   const { data: video } = await supabase
     .from("videos")
     .select(
       `
       *,
       channels (id, name, youtube_channel_id),
       summaries (id, status, generated_at)
     `
     )
     .eq("id", videoId)
     .single();
   ```
7. If no data returned, check if video exists at all:
   - If exists (query without RLS), return 403 Forbidden
   - If doesn't exist, return 404 Not Found
8. Format response according to DetailedVideo type
9. Return 200 OK with video details
10. Test with subscribed channel, non-subscribed channel, invalid ID

---

## 5. Summaries Endpoints

### 5.1. List Summaries

#### Endpoint Overview

Retrieves summaries for videos from the user's subscribed channels with pagination, filtering, and sorting. By default excludes hidden summaries unless explicitly requested.

#### Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/summaries`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required: None
  - Optional:
    - `limit` (query param, number, default: 20, max: 100)
    - `offset` (query param, number, default: 0, min: 0)
    - `channel_id` (query param, UUID, optional) - Filter by channel
    - `status` (query param, string, optional) - Filter by status: "pending", "in_progress", "completed", "failed"
    - `sort` (query param, string, default: "published_at_desc") - Options: "published_at_desc", "published_at_asc", "generated_at_desc"
    - `include_hidden` (query param, boolean, default: false) - Include hidden summaries
- **Request Body:** None

#### Used Types

- **Request DTO:** None (query params only)
- **Response DTO:** `PaginatedResponse<SummaryWithVideo>`
- **Error DTO:** `ApiError`
- **Internal Types:** `VideoBasic`, `Channel`, `SummaryStatus`, `PaginationMeta`

#### Response Details

- **Success (200 OK):**

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

#### Data Flow

1. Extract user ID from authenticated session
2. Parse and validate query parameters
3. Build query with filters:
   - RLS filters summaries to subscribed channels
   - Apply channel_id filter if provided
   - Apply status filter if provided
   - Exclude hidden summaries (unless include_hidden=true)
   - Apply sort order
   - Apply pagination
4. Join with videos, channels, and summary_ratings tables
5. Get user's rating for each summary (LEFT JOIN)
6. Get total count
7. Format response with SummaryWithVideo type
8. Return paginated list

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **RLS Protection:** Summaries filtered by subscription via RLS
- **Hidden Summaries:** By default excludes user's hidden summaries
- **Input Validation:** Validate all query parameters
- **Channel Filter:** If non-subscribed channel_id, returns empty list

#### Error Handling

- **400 Bad Request:**
  - Invalid query parameters
  - Invalid status value
  - Invalid sort option
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **500 Internal Server Error:**
  - Database query error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Complex query with multiple JOINs
- Index on `summaries(video_id)` for video lookup
- Index on `hidden_summaries(user_id, summary_id)` for exclusion
- Response time target: <400ms
- Consider materialized view for frequently accessed summary lists
- Cache results for 1 minute

#### Implementation Steps

1. Create Zod schema for query parameter validation
2. Create service function `listSummaries(userId, filters)` in `src/lib/summaries.service.ts`
3. Create API route handler at `src/pages/api/summaries/index.ts`
4. Verify authentication and extract user ID
5. Parse and validate query parameters
6. Build complex Supabase query:

   ```typescript
   let query = supabase.from("summaries").select(
     `
       id,
       tldr,
       status,
       generated_at,
       videos (id, youtube_video_id, title, thumbnail_url, published_at, channel_id),
       channels:videos(channels(id, name))
     `,
     { count: "exact" }
   );

   // Filter by status if provided
   if (status) {
     query = query.eq("status", status);
   }

   // Exclude hidden summaries unless include_hidden=true
   if (!include_hidden) {
     query = query.not(
       "id",
       "in",
       `(
       SELECT summary_id FROM hidden_summaries WHERE user_id = '${userId}'
     )`
     );
   }

   // Apply sorting
   // Apply pagination
   ```

7. Fetch user's ratings for returned summaries in separate query
8. Merge rating data with summary data
9. Format response with pagination metadata
10. Return 200 OK with data
11. Test various filter, sort, and pagination scenarios

---

### 5.2. Get Summary Details

#### Endpoint Overview

Retrieves complete details of a specific summary including full summary content, video information, rating statistics, and the user's personal rating.

#### Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/summaries/:summaryId`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required:
    - `summaryId` (path param, UUID) - UUID of the summary
  - Optional: None
- **Request Body:** None

#### Used Types

- **Request DTO:** None (path param only)
- **Response DTO:** `DetailedSummary`
- **Error DTO:** `ApiError`
- **Internal Types:** `VideoWithUrl`, `Channel`, `RatingStats`, `SummaryStatus`, `SummaryErrorCode`

#### Response Details

- **Success (200 OK):**

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

#### Data Flow

1. Extract user ID from authenticated session
2. Extract summary ID from URL path
3. Validate summary ID format (UUID)
4. Query summary with video and channel information
5. RLS checks if user is subscribed to channel
6. Calculate rating statistics (aggregate upvotes/downvotes)
7. Get user's personal rating if exists
8. Construct YouTube URL from video ID
9. Format response according to DetailedSummary type
10. Return complete summary details

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **RLS Protection:** Summary only accessible if user subscribed to channel
- **Authorization Check:** 403 if summary belongs to non-subscribed channel
- **UUID Validation:** Validate summary ID format
- **Hidden Summaries:** User can still access hidden summary by direct ID (intentional)

#### Error Handling

- **400 Bad Request:**
  - Invalid summary ID format (not UUID)
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **403 Forbidden:**
  - Summary belongs to video from non-subscribed channel
  - Error code: `UNAUTHORIZED_ACCESS`
- **404 Not Found:**
  - Summary not found
  - Error code: `RESOURCE_NOT_FOUND`
- **500 Internal Server Error:**
  - Database query error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- UUID lookup with index is O(1)
- Rating aggregation uses indexed columns
- Single query with JOINs is efficient
- Response time target: <300ms
- Consider caching summary details for 5 minutes

#### Implementation Steps

1. Create Zod schema for path parameter validation
2. Create service function `getSummaryDetails(summaryId, userId)` in `src/lib/summaries.service.ts`
3. Create API route handler at `src/pages/api/summaries/[summaryId].ts`
4. Verify authentication and extract user ID
5. Parse and validate summary ID from path
6. Query summary with all related data:
   ```typescript
   const { data: summary } = await supabase
     .from("summaries")
     .select(
       `
       *,
       videos (*, channels (*))
     `
     )
     .eq("id", summaryId)
     .single();
   ```
7. Calculate rating statistics:

   ```typescript
   const { data: ratings } = await supabase.from("summary_ratings").select("rating").eq("summary_id", summaryId);

   const upvotes = ratings.filter((r) => r.rating === true).length;
   const downvotes = ratings.filter((r) => r.rating === false).length;
   ```

8. Get user's rating:
   ```typescript
   const { data: userRating } = await supabase
     .from("summary_ratings")
     .select("rating")
     .eq("summary_id", summaryId)
     .eq("user_id", userId)
     .maybeSingle();
   ```
9. Construct YouTube URL: `https://www.youtube.com/watch?v=${youtube_video_id}`
10. Format response according to DetailedSummary type
11. Handle 403 vs 404 scenarios (video check)
12. Return 200 OK with complete summary details
13. Test with various scenarios

---

### 5.3. Generate Summary (Manual)

#### Endpoint Overview

Manually initiates summary generation for a YouTube video. Enforces global daily rate limit (1 successful summary per channel per day). Validates video constraints and user subscription status.

#### Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/summaries`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required: None (body only)
  - Optional: None
- **Request Body:**

```typescript
{
  video_url: string; // YouTube video URL
}
```

#### Used Types

- **Request DTO:** `GenerateSummaryRequest`
- **Response DTO:** `ApiSuccess<{ id: string; video: { id: string; youtube_video_id: string; title: string }; status: string }>`
- **Error DTO:** `ApiError`
- **Internal Types:** `VideoInsert`, `SummaryInsert`, `GenerationRequestInsert`

#### Response Details

- **Success (202 Accepted):**

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

#### Data Flow

1. Extract user ID from authenticated session
2. Parse and validate request body
3. Validate YouTube video URL format
4. Extract YouTube video ID from URL
5. Check if video exists in database, if not create it:
   - Fetch video metadata from YouTube API
   - Validate duration ≤ 45 minutes
   - Validate subtitles available
   - Validate video is public/unlisted
   - Create video record
6. Verify video belongs to channel user is subscribed to
7. **ATOMIC CHECK**: In database transaction:
   - Lock channel for update (prevent race conditions)
   - Check if successful summary exists for this channel today (UTC)
   - If yes, return 429 Too Many Requests
   - Check if summary already exists for this video:
     - If completed: return 409 Conflict
     - If pending/in_progress: return 409 Conflict
     - If failed: allow regeneration (update existing)
   - Create generation_requests record
   - Create or update summaries record with status 'pending'
   - Commit transaction
8. Queue summary generation background job
9. Return 202 Accepted with summary ID

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **Subscription Check:** User must be subscribed to video's channel
- **URL Validation:** Validate and sanitize YouTube video URL
- **Rate Limiting:** Global 1 successful summary per channel per day
- **Race Condition Prevention:** Use PostgreSQL advisory locks
- **Video Validation:** Check duration, subtitles, and access before processing
- **Idempotency:** Handle duplicate requests gracefully

#### Error Handling

- **400 Bad Request:**
  - Invalid YouTube video URL format
  - Malformed request body
  - Error code: `INVALID_URL`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **403 Forbidden:**
  - Video belongs to channel not subscribed by user
  - Error code: `CHANNEL_NOT_SUBSCRIBED`
- **404 Not Found:**
  - YouTube video not found or deleted
  - Error code: `RESOURCE_NOT_FOUND`
- **409 Conflict:**
  - Summary already exists for this video (completed or in progress)
  - Error code: `SUMMARY_ALREADY_EXISTS`
- **422 Unprocessable Entity:**
  - Video too long (>45 minutes)
  - No subtitles available
  - Video is private
  - Error code: `VIDEO_TOO_LONG` | `NO_SUBTITLES` | `VIDEO_PRIVATE`
- **429 Too Many Requests:**
  - Daily successful generation limit reached for this channel (globally)
  - Include Retry-After header with seconds until next day
  - Error code: `GENERATION_LIMIT_REACHED`
- **500 Internal Server Error:**
  - YouTube API error
  - Database error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- YouTube API calls add significant latency (500-1500ms)
- Advisory lock prevents concurrent generation attempts
- Transaction ensures atomicity of rate limit check
- Background job for actual generation keeps response fast
- Response time target: <2000ms (including YouTube API)
- Cache video metadata to avoid repeated API calls

#### Implementation Steps

1. Create Zod schema for request validation (`GenerateSummaryRequestSchema`)
2. Create utility function `extractYouTubeVideoId(url: string)` in `src/lib/youtube.utils.ts`
3. Create utility function `fetchYouTubeVideoMetadata(videoId: string)` in `src/lib/youtube.service.ts`
4. Create service function `generateSummary(userId, videoUrl)` in `src/lib/summaries.service.ts`
5. Create API route handler at `src/pages/api/summaries/index.ts`
6. Verify authentication and extract user ID
7. Parse and validate request body
8. Extract YouTube video ID from URL
9. Check if video exists in database
10. If not, fetch from YouTube API:

    ```typescript
    const metadata = await fetchYouTubeVideoMetadata(videoId);

    // Validate constraints
    if (metadata.duration > 2700) {
      return error(422, "VIDEO_TOO_LONG");
    }
    if (!metadata.hasSubtitles) {
      return error(422, "NO_SUBTITLES");
    }
    if (metadata.isPrivate) {
      return error(422, "VIDEO_PRIVATE");
    }

    // Create video record
    const { data: video } = await supabase
      .from("videos")
      .insert({
        youtube_video_id: videoId,
        channel_id: metadata.channelId,
        title: metadata.title,
        thumbnail_url: metadata.thumbnail,
        published_at: metadata.publishedAt,
      })
      .select()
      .single();
    ```

11. Verify user is subscribed to video's channel
12. Start database transaction with advisory lock:
    ```typescript
    await supabase.rpc("pg_advisory_xact_lock", { key: hashChannelId(channelId) });
    ```
13. Check for successful summaries today:

    ```typescript
    const today = new Date().toISOString().split("T")[0];
    const { data: existingSummaries } = await supabase
      .from("summaries")
      .select("id")
      .eq("channel_id", channelId)
      .eq("status", "completed")
      .gte("generated_at", `${today}T00:00:00Z`)
      .lte("generated_at", `${today}T23:59:59Z`);

    if (existingSummaries.length > 0) {
      return error(429, "GENERATION_LIMIT_REACHED");
    }
    ```

14. Check if summary exists for this video
15. Create generation_requests record
16. Create or update summaries record
17. Commit transaction
18. Queue background job for processing
19. Return 202 Accepted
20. Test all error scenarios and edge cases

---

### 5.4. Hide Summary

#### Endpoint Overview

Hides a summary from the user's dashboard without deleting it from the database. Since summaries are shared resources, this allows personalization without affecting other users.

#### Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/summaries/:summaryId/hide`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required:
    - `summaryId` (path param, UUID) - UUID of the summary to hide
  - Optional: None
- **Request Body:** None

#### Used Types

- **Request DTO:** None (path param only)
- **Response DTO:** `ApiSuccess<void>`
- **Error DTO:** `ApiError`
- **Internal Types:** `HiddenSummaryInsert`

#### Response Details

- **Success (200 OK):**

```json
{
  "message": "Summary hidden from your dashboard"
}
```

#### Data Flow

1. Extract user ID from authenticated session
2. Extract summary ID from URL path
3. Validate summary ID format (UUID)
4. Verify summary exists and user has access (via RLS)
5. Check if summary is already hidden for this user
6. If already hidden, return 409 Conflict
7. Create record in `hidden_summaries` table
8. Return success message

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **RLS Protection:** Can only hide summaries from subscribed channels
- **Authorization:** User can only hide summaries for themselves
- **UUID Validation:** Validate summary ID format

#### Error Handling

- **400 Bad Request:**
  - Invalid summary ID format (not UUID)
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **403 Forbidden:**
  - Cannot hide summaries from non-subscribed channels
  - Error code: `UNAUTHORIZED_ACCESS`
- **404 Not Found:**
  - Summary not found
  - Error code: `RESOURCE_NOT_FOUND`
- **409 Conflict:**
  - Summary already hidden
  - Error code: `ALREADY_HIDDEN`
- **500 Internal Server Error:**
  - Database error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- UUID lookup with index is O(1)
- Duplicate check is efficient with unique constraint
- Response time target: <200ms

#### Implementation Steps

1. Create Zod schema for path parameter validation
2. Create service function `hideSummary(userId, summaryId)` in `src/lib/summaries.service.ts`
3. Create API route handler at `src/pages/api/summaries/[summaryId]/hide.ts`
4. Verify authentication and extract user ID
5. Parse and validate summary ID from path
6. Verify summary exists and user has access:
   ```typescript
   const { data: summary } = await supabase
     .from("summaries")
     .select("id, videos(channel_id)")
     .eq("id", summaryId)
     .single();
   ```
7. Check if already hidden:

   ```typescript
   const { data: existing } = await supabase
     .from("hidden_summaries")
     .select("id")
     .eq("user_id", userId)
     .eq("summary_id", summaryId)
     .maybeSingle();

   if (existing) {
     return error(409, "ALREADY_HIDDEN");
   }
   ```

8. Create hidden_summaries record:
   ```typescript
   await supabase.from("hidden_summaries").insert({
     user_id: userId,
     summary_id: summaryId,
   });
   ```
9. Return 200 OK with success message
10. Test with valid summary, non-subscribed channel, already hidden

---

### 5.5. Unhide Summary

#### Endpoint Overview

Removes a summary from the user's hidden list, making it appear in their dashboard again.

#### Request Details

- **HTTP Method:** `DELETE`
- **URL Structure:** `/api/summaries/:summaryId/hide`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required:
    - `summaryId` (path param, UUID) - UUID of the summary to unhide
  - Optional: None
- **Request Body:** None

#### Used Types

- **Request DTO:** None (path param only)
- **Response DTO:** `ApiSuccess<void>`
- **Error DTO:** `ApiError`

#### Response Details

- **Success (200 OK):**

```json
{
  "message": "Summary restored to your dashboard"
}
```

#### Data Flow

1. Extract user ID from authenticated session
2. Extract summary ID from URL path
3. Validate summary ID format (UUID)
4. Check if summary is hidden for this user
5. If not hidden, return 404 Not Found
6. Delete record from `hidden_summaries` table
7. Return success message

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **RLS Protection:** User can only unhide their own hidden summaries
- **UUID Validation:** Validate summary ID format

#### Error Handling

- **400 Bad Request:**
  - Invalid summary ID format (not UUID)
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **404 Not Found:**
  - Summary not found or not hidden
  - Error code: `RESOURCE_NOT_FOUND`
- **500 Internal Server Error:**
  - Database error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- UUID lookup with composite index is O(1)
- Response time target: <200ms

#### Implementation Steps

1. Create Zod schema for path parameter validation
2. Create service function `unhideSummary(userId, summaryId)` in `src/lib/summaries.service.ts`
3. Create API route handler at `src/pages/api/summaries/[summaryId]/hide.ts` (same file, handle DELETE method)
4. Verify authentication and extract user ID
5. Parse and validate summary ID from path
6. Delete hidden_summaries record:

   ```typescript
   const { count } = await supabase
     .from("hidden_summaries")
     .delete({ count: "exact" })
     .eq("user_id", userId)
     .eq("summary_id", summaryId);

   if (count === 0) {
     return error(404, "RESOURCE_NOT_FOUND");
   }
   ```

7. Return 200 OK with success message
8. Test with hidden summary, non-hidden summary, invalid ID

---

## 6. Summary Ratings Endpoints

### 6.1. Rate Summary

#### Endpoint Overview

Creates or updates the user's rating for a summary. Uses upsert operation to handle both new ratings and rating changes.

#### Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/summaries/:summaryId/ratings`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required:
    - `summaryId` (path param, UUID) - UUID of the summary to rate
  - Optional: None
- **Request Body:**

```typescript
{
  rating: boolean; // true = upvote, false = downvote
}
```

#### Used Types

- **Request DTO:** `RateSummaryRequest`
- **Response DTO:** `RatingResponse`
- **Error DTO:** `ApiError`
- **Internal Types:** `SummaryRatingInsert`

#### Response Details

- **Success (201 Created or 200 OK):**

```json
{
  "id": "uuid",
  "summary_id": "uuid",
  "rating": true,
  "created_at": "2025-11-15T10:00:00Z",
  "message": "Rating saved successfully"
}
```

#### Data Flow

1. Extract user ID from authenticated session
2. Extract summary ID from URL path
3. Parse and validate request body
4. Validate summary ID format (UUID)
5. Verify summary exists and user has access (via RLS)
6. Use UPSERT operation to create or update rating
7. Return rating details with appropriate status code (201 for new, 200 for update)

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **RLS Protection:** Can only rate summaries from subscribed channels
- **Authorization:** User can only create/update their own ratings
- **UUID Validation:** Validate summary ID format
- **Boolean Validation:** Ensure rating is boolean value

#### Error Handling

- **400 Bad Request:**
  - Invalid summary ID format (not UUID)
  - Invalid rating value (not boolean)
  - Missing rating field
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **403 Forbidden:**
  - Cannot rate summaries from non-subscribed channels
  - Error code: `UNAUTHORIZED_ACCESS`
- **404 Not Found:**
  - Summary not found
  - Error code: `RESOURCE_NOT_FOUND`
- **500 Internal Server Error:**
  - Database error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- UPSERT operation is atomic and efficient
- Unique constraint on (user_id, summary_id) prevents duplicates
- Response time target: <200ms

#### Implementation Steps

1. Create Zod schema for request validation (`RateSummaryRequestSchema`)
2. Create service function `rateSummary(userId, summaryId, rating)` in `src/lib/ratings.service.ts`
3. Create API route handler at `src/pages/api/summaries/[summaryId]/ratings.ts`
4. Verify authentication and extract user ID
5. Parse and validate summary ID and request body
6. Verify summary exists and user has access:

   ```typescript
   const { data: summary } = await supabase.from("summaries").select("id").eq("id", summaryId).single();

   if (!summary) {
     return error(404, "RESOURCE_NOT_FOUND");
   }
   ```

7. Check if rating already exists to determine status code:

   ```typescript
   const { data: existing } = await supabase
     .from("summary_ratings")
     .select("id")
     .eq("user_id", userId)
     .eq("summary_id", summaryId)
     .maybeSingle();

   const statusCode = existing ? 200 : 201;
   ```

8. Upsert rating:
   ```typescript
   const { data: ratingData } = await supabase
     .from("summary_ratings")
     .upsert(
       {
         user_id: userId,
         summary_id: summaryId,
         rating: rating,
       },
       { onConflict: "user_id,summary_id" }
     )
     .select()
     .single();
   ```
9. Format response according to RatingResponse type
10. Return with appropriate status code and success message
11. Test create new rating, update existing rating, invalid inputs

---

### 6.2. Remove Rating

#### Endpoint Overview

Removes the user's rating from a summary.

#### Request Details

- **HTTP Method:** `DELETE`
- **URL Structure:** `/api/summaries/:summaryId/ratings`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required:
    - `summaryId` (path param, UUID) - UUID of the summary
  - Optional: None
- **Request Body:** None

#### Used Types

- **Request DTO:** None (path param only)
- **Response DTO:** `ApiSuccess<void>`
- **Error DTO:** `ApiError`

#### Response Details

- **Success (200 OK):**

```json
{
  "message": "Rating removed successfully"
}
```

#### Data Flow

1. Extract user ID from authenticated session
2. Extract summary ID from URL path
3. Validate summary ID format (UUID)
4. Delete rating record from `summary_ratings` table
5. If no rows affected, return 404 Not Found
6. Return success message

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **RLS Protection:** User can only delete their own ratings
- **UUID Validation:** Validate summary ID format

#### Error Handling

- **400 Bad Request:**
  - Invalid summary ID format (not UUID)
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **404 Not Found:**
  - Rating not found (user hasn't rated this summary)
  - Error code: `RESOURCE_NOT_FOUND`
- **500 Internal Server Error:**
  - Database error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- UUID lookup with composite index is O(1)
- Response time target: <200ms

#### Implementation Steps

1. Create Zod schema for path parameter validation
2. Create service function `removeRating(userId, summaryId)` in `src/lib/ratings.service.ts`
3. Create API route handler at `src/pages/api/summaries/[summaryId]/ratings.ts` (same file, handle DELETE method)
4. Verify authentication and extract user ID
5. Parse and validate summary ID from path
6. Delete rating:

   ```typescript
   const { count } = await supabase
     .from("summary_ratings")
     .delete({ count: "exact" })
     .eq("user_id", userId)
     .eq("summary_id", summaryId);

   if (count === 0) {
     return error(404, "RESOURCE_NOT_FOUND");
   }
   ```

7. Return 200 OK with success message
8. Test with existing rating, non-existing rating, invalid ID

---

## 7. Generation Requests Endpoints

### 7.1. Check Generation Status

#### Endpoint Overview

Checks if a summary can be generated for a specific channel today by verifying the global daily limit (1 successful summary per channel per day across all users).

#### Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/generation-requests/status`
- **Authentication:** Required (Bearer token)
- **Parameters:**
  - Required:
    - `channel_id` (query param, UUID) - UUID of the channel to check
  - Optional: None
- **Request Body:** None

#### Used Types

- **Request DTO:** None (query param only)
- **Response DTO:** `GenerationStatusResponse`
- **Error DTO:** `ApiError`

#### Response Details

- **Success (200 OK):**

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

#### Data Flow

1. Extract user ID from authenticated session
2. Extract and validate channel_id from query params
3. Verify user is subscribed to the channel
4. Get current date (UTC)
5. Query summaries table for videos from this channel:
   - Filter by status = 'completed'
   - Filter by generated_at within current calendar day (UTC)
6. Count successful summaries today
7. Determine if can_generate (count < limit)
8. Get timestamp of last successful generation
9. Format response with status information
10. Return generation status

#### Security Considerations

- **Authentication Required:** Verified by middleware
- **Subscription Check:** User must be subscribed to channel to check status
- **UUID Validation:** Validate channel ID format
- **Global Limit:** Status reflects global limit, not per-user

#### Error Handling

- **400 Bad Request:**
  - Missing channel_id parameter
  - Invalid channel_id format (not UUID)
  - Error code: `INVALID_INPUT`
- **401 Unauthorized:**
  - Missing or invalid authentication token
  - Error code: `INVALID_TOKEN`
- **403 Forbidden:**
  - Channel not subscribed by user
  - Error code: `CHANNEL_NOT_SUBSCRIBED`
- **500 Internal Server Error:**
  - Database query error
  - Error code: `INTERNAL_ERROR`

#### Performance Considerations

- Query filtered by channel_id and date range
- Index on `summaries(channel_id, generated_at, status)` optimizes query
- Response time target: <200ms
- Consider caching status for 1 minute

#### Implementation Steps

1. Create Zod schema for query parameter validation
2. Create service function `checkGenerationStatus(userId, channelId)` in `src/lib/generation-requests.service.ts`
3. Create API route handler at `src/pages/api/generation-requests/status.ts`
4. Verify authentication and extract user ID
5. Parse and validate channel_id from query params
6. Verify user is subscribed to channel:

   ```typescript
   const { data: subscription } = await supabase
     .from("subscriptions")
     .select("id")
     .eq("user_id", userId)
     .eq("channel_id", channelId)
     .maybeSingle();

   if (!subscription) {
     return error(403, "CHANNEL_NOT_SUBSCRIBED");
   }
   ```

7. Get today's date range (UTC):
   ```typescript
   const today = new Date().toISOString().split("T")[0];
   const startOfDay = `${today}T00:00:00Z`;
   const endOfDay = `${today}T23:59:59Z`;
   ```
8. Count successful summaries today for this channel:

   ```typescript
   const { data: summaries } = await supabase
     .from("summaries")
     .select("id, generated_at")
     .eq("status", "completed")
     .gte("generated_at", startOfDay)
     .lte("generated_at", endOfDay)
     .in("video_id", supabase.from("videos").select("id").eq("channel_id", channelId));

   const count = summaries?.length || 0;
   const can_generate = count < 1;
   const last_generation = summaries?.[0]?.generated_at || null;
   ```

9. Format response according to GenerationStatusResponse type
10. Return 200 OK with status information
11. Test with subscribed channel, non-subscribed channel, various limit scenarios

---

## Common Implementation Patterns

### Middleware for Authentication

All authenticated endpoints should use a common middleware to verify JWT tokens:

```typescript
// src/middleware/index.ts
import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const {
    data: { user },
    error,
  } = await context.locals.supabase.auth.getUser();

  if (error || !user) {
    context.locals.user = null;
  } else {
    context.locals.user = user;
  }

  return next();
};
```

### Service Layer Pattern

Extract business logic into service functions:

```typescript
// src/lib/example.service.ts
import type { SupabaseClient } from "./db/supabase.client";

export async function serviceFunction(supabase: SupabaseClient, params: any) {
  // Business logic here
  // Return data or throw error
}
```

### Error Response Formatting

Use consistent error response format:

```typescript
// src/lib/errors.ts
import type { ApiError } from "./types";

export function formatError(code: string, message: string, details?: Record<string, any>): ApiError {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}
```

### Zod Validation Pattern

Create reusable validation schemas:

```typescript
// src/lib/validation/schemas.ts
import { z } from "zod";

export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const UUIDSchema = z.string().uuid();
```

### Response Formatting

Use consistent response formatting:

```typescript
// src/lib/responses.ts
import type { ApiSuccess, PaginatedResponse } from "./types";

export function formatSuccess<T>(data?: T, message?: string): ApiSuccess<T> {
  return { data, message };
}

export function formatPaginated<T>(data: T[], total: number, limit: number, offset: number): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      total,
      limit,
      offset,
    },
  };
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

Test service functions and utility functions in isolation:

```typescript
// src/lib/__tests__/youtube.utils.test.ts
import { describe, it, expect } from "vitest";
import { extractYouTubeVideoId } from "../youtube.utils";

describe("extractYouTubeVideoId", () => {
  it("extracts ID from standard URL", () => {
    const url = "https://www.youtube.com/watch?v=abc123";
    expect(extractYouTubeVideoId(url)).toBe("abc123");
  });

  it("extracts ID from shortened URL", () => {
    const url = "https://youtu.be/abc123";
    expect(extractYouTubeVideoId(url)).toBe("abc123");
  });

  it("throws error for invalid URL", () => {
    expect(() => extractYouTubeVideoId("invalid")).toThrow();
  });
});
```

### Integration Tests

Test API endpoints with test database:

```typescript
// src/pages/api/__tests__/auth.register.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { setupTestDatabase, createTestUser } from "../../../test/helpers";

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it("creates new user successfully", async () => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "SecurePassword123!",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user.email).toBe("test@example.com");
    expect(data.session.access_token).toBeDefined();
  });

  it("returns 409 for duplicate email", async () => {
    await createTestUser({ email: "test@example.com" });

    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "SecurePassword123!",
      }),
    });

    expect(response.status).toBe(409);
  });
});
```

### End-to-End Tests (Playwright)

Test complete user workflows:

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from "@playwright/test";

test("user can register, login, and subscribe to channel", async ({ page }) => {
  // Navigate to app
  await page.goto("/");

  // Register
  await page.click("text=Sign Up");
  await page.fill("[name=email]", "test@example.com");
  await page.fill("[name=password]", "SecurePassword123!");
  await page.click("button[type=submit]");

  // Should be logged in and redirected to dashboard
  await expect(page).toHaveURL("/dashboard");

  // Subscribe to channel
  await page.click("text=Add Channel");
  await page.fill("[name=channel_url]", "https://www.youtube.com/@example");
  await page.click("button[type=submit]");

  // Should see channel in list
  await expect(page.locator("text=example")).toBeVisible();
});
```

---

## Deployment Checklist

Before deploying the API to production:

- [ ] All endpoints have comprehensive tests (unit + integration)
- [ ] Environment variables properly configured (Supabase URL, keys, etc.)
- [ ] Rate limiting implemented for all public endpoints
- [ ] CORS policy configured correctly for production domain
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Error logging and monitoring setup (e.g., Sentry)
- [ ] Database migrations applied to production
- [ ] RLS policies tested and verified
- [ ] API documentation published (Swagger/OpenAPI)
- [ ] Performance testing completed (load testing, stress testing)
- [ ] Backup and recovery procedures documented
- [ ] SSL/TLS certificates configured for HTTPS
- [ ] Database indexes created and optimized
- [ ] Background job processing setup (for summary generation)
- [ ] YouTube API quota monitoring configured
- [ ] Compliance requirements met (GDPR, data retention, etc.)

---

## API Versioning Strategy

### Current Version (v1)

All endpoints are implicitly version 1, accessed via `/api/*` paths.

### Future Versions

When introducing breaking changes:

1. Create new endpoint paths with version prefix: `/api/v2/*`
2. Maintain v1 endpoints for at least 12 months
3. Add deprecation headers to v1 responses:
   ```
   X-API-Deprecated: true
   X-API-Deprecation-Date: 2026-01-01
   X-API-Sunset-Date: 2026-12-31
   ```
4. Update documentation to indicate deprecated endpoints
5. Communicate deprecation timeline to API consumers

### Breaking Changes Definition

Breaking changes include:

- Removing endpoints or fields
- Renaming endpoints or fields
- Changing field data types
- Changing authentication mechanisms
- Changing error response formats

### Non-Breaking Changes

Non-breaking changes can be made to v1:

- Adding new endpoints
- Adding optional parameters
- Adding new fields to responses
- Adding new error codes
- Performance improvements
- Bug fixes

---

## Security Best Practices

### Input Validation

- Always validate and sanitize user input
- Use Zod schemas for type-safe validation
- Validate UUID formats before database queries
- Sanitize URLs before external API calls

### Authentication & Authorization

- Verify JWT tokens on every protected endpoint
- Use RLS policies for defense-in-depth
- Implement proper session management
- Rotate tokens regularly

### Rate Limiting

- Implement per-user rate limits (100 req/min)
- Implement per-IP rate limits for auth endpoints
- Monitor and block suspicious activity
- Use exponential backoff for failed attempts

### Data Protection

- Never log sensitive data (passwords, tokens)
- Use HTTPS only in production
- Implement proper CORS policies
- Sanitize error messages (no stack traces in production)

### Database Security

- Use parameterized queries (Supabase handles this)
- Enable RLS on all user-facing tables
- Use service role key only for admin operations
- Regularly audit RLS policies

### API Security Headers

```typescript
// Add to all API responses
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'"
}
```

---

## Performance Optimization Guidelines

### Database Queries

- Use indexes on frequently queried columns
- Minimize number of queries (use JOINs)
- Use `SELECT` with specific columns (avoid `SELECT *`)
- Implement query result caching where appropriate
- Use connection pooling

### API Response Times

- Target response times:
  - Simple reads: <200ms
  - Complex queries: <400ms
  - External API calls: <2000ms
- Implement request timeouts
- Use background jobs for long-running tasks

### Caching Strategy

- Cache channel metadata: 24 hours
- Cache video lists: 1 minute
- Cache summary details: 5 minutes
- Cache generation status: 1 minute
- Use cache invalidation on updates

### Pagination

- Enforce maximum page size (100 items)
- Use efficient offset-based pagination
- Consider cursor-based pagination for large datasets
- Include total count only when necessary

### Background Jobs

- Use queue system for summary generation
- Implement retry logic with exponential backoff
- Monitor queue depth and processing times
- Set appropriate job timeouts

---

## Monitoring and Observability

### Metrics to Track

- API request rate and latency (p50, p95, p99)
- Error rates by endpoint and error code
- Authentication success/failure rates
- Database query performance
- Background job processing times
- YouTube API quota usage
- Cache hit/miss ratios

### Logging Strategy

- Log all errors with stack traces
- Log authentication failures
- Log rate limit violations
- Log slow queries (>1s)
- Never log sensitive data

### Alerting Thresholds

- Error rate > 5%
- P95 latency > 2s
- Database connection pool exhausted
- YouTube API quota > 80%
- Failed background jobs > 10%

### Health Check Endpoint

```typescript
// GET /api/health
{
  "status": "healthy",
  "timestamp": "2025-11-16T10:00:00Z",
  "services": {
    "database": "healthy",
    "auth": "healthy",
    "youtube_api": "healthy"
  }
}
```

---

## 1. Executive Summary

This comprehensive implementation plan covers all 19 REST API endpoints for the VideoSummary application. Each endpoint includes detailed specifications for request/response handling, security considerations, error handling, performance optimization, and implementation steps. The plan follows industry best practices and is tailored to the Astro + Supabase tech stack.
