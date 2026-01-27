# Product Requirements Document (PRD) - VideoSummary

## Executive Summary

VideoSummary is a web application designed for users who subscribe to many valuable YouTube channels but lack the time to regularly watch all the published content. The application solves this problem by automatically generating concise, structured summaries of new videos from the user's subscribed channels. The product's vision is to enable users to efficiently acquire knowledge and stay up-to-date with key information in a fraction of the time required to watch the full materials, thereby eliminating the "fear of missing out" (FOMO).

## 1. Problem and Solution

The main problem that VideoSummary addresses is information overload and lack of time. Users follow educational, financial, or news-related channels to grow and stay informed. However, the hustle of daily life prevents them from regularly watching all interesting materials. As a result, valuable content is missed, and users feel frustrated and as if they are missing out on something important. VideoSummary aims to resolve this conflict by delivering the condensed value of long video materials in an accessible format.

## 2. Target Audience

The application is designed for users who:

- Have a strong interest in staying informed about various topics.
- Subscribe to multiple valuable YouTube channels.
- Lack the time to watch all the content they are interested in.
- Want to efficiently acquire knowledge and stay up-to-date with key information.
- Are comfortable with web applications and have basic technical skills.

## 3. Functional Requirements

### 3.1. Authentication and User Profile

- Registration and login using an email address and password.
- A complete password reset mechanism ("forgot password").
- A simple user profile page with a list of subscribed channels, an option to remove them, and a "Logout" button.

### 3.2. Channel Management

- Ability to add YouTube channels by pasting the full channel URL.
- Limit of 10 subscribed channels per user.

### 3.3. Summary Generation

- Automatic generation: Once a day (at 7:00 PM UTC), the system scans the channels and generates a summary for one, newest video from each channel.
- Manual generation: The user can manually generate a summary for a video from a channel they subscribe to.
- Daily limit of one **successful** summary per channel **globally** (shared by automatic, manual actions, and all users):
  - Summaries are shared resources - one summary serves all users subscribed to that channel.
  - If user A generates a summary for channel X today, user B will see the same summary (cannot generate another one for that channel today).
  - Failed generation attempts (e.g., no subtitles) do NOT count toward the limit and can be retried.
- Two summary formats generated in a single LLM query:
  - TL;DR (up to 100 tokens).
  - Full summary (up to 500 tokens, in JSON format with sections: `summary`, `conclusions`, `key_points`).

### 3.4. User Interface (Dashboard)

- A main dashboard displaying a list of summaries as cards, sorted chronologically.
- Each card includes: video title, channel name, YouTube publication date, and the TL;DR summary.
- A dedicated subpage for each summary (`/dashboard/[id]`) with the full, formatted content, a link to the original, and rating buttons (thumbs up/down).
- An option to hide individual summaries from the user's dashboard (summaries are shared resources between users, so they cannot be physically deleted).
- The interface is fully responsive (RWD) for mobile browsers.

### 3.5. Error Handling and Notifications

- Use of "toast" notifications to inform about statuses and errors.
- Clear error messages for summary generation failures (e.g., "Error: No subtitles", "Error: Video is private").
- A special message for videos longer than 45 minutes.

### 3.6. Technical Specification

- Frontend: Astro 5 + React 19, Tailwind CSS 4, shadcn/ui.
- Backend: Supabase (PostgreSQL + Auth) with Row-Level Security (RLS) implemented.
- Database: PostgreSQL (via Supabase).
- LLM Integration: OpenRouter.
- Testing: Unit tests (Vitest), E2E tests (Playwright).
- Automation: CI/CD (GitHub Actions).
- Hosting: DigitalOcean (Docker container).

## 4. Product Boundaries

The following functionalities are intentionally excluded from the MVP scope and will be considered in future product iterations:

- Generating summaries from any YouTube video link (without a channel subscription).
- An advanced system for categorizing and filtering summaries.
- The ability to edit user profile data (other than the password).
- Logging in via third-party providers (e.g., Google, GitHub).
- Support for videos longer than 45 minutes.
- Translating summaries into other languages.
- Paid subscription plans to increase limits.
- Optimizing LLM costs by generating a single summary for multiple users.
- A dedicated mobile application.

## 5. User Stories

### Authentication and Account Management

- ID: US-001
- Title: New user registration
- Description: As a new user, I want to be able to register for the application using my email address and password to gain access to its functionalities.
- Acceptance Criteria:
  - The registration form includes fields for email address and password (with confirmation).
  - Client-side and server-side validation checks the email format and password strength.
  - After a successful registration, the user is automatically logged in and redirected to the main dashboard.
  - In case of an error (e.g., email already taken), a clear message is displayed.

- ID: US-002
- Title: Logging into the application
- Description: As a registered user, I want to be able to log into my account by providing my email and password to continue using the application.
- Acceptance Criteria:
  - The login form includes fields for email and password.
  - After a successful login, the user is redirected to the main dashboard.
  - If incorrect credentials are provided, an appropriate message is displayed.

- ID: US-003
- Title: Logging out of the application
- Description: As a logged-in user, I want to be able to log out of the application to ensure my account's security.
- Acceptance Criteria:
  - There is a "Logout" button in the user interface (e.g., on the profile page).
  - After clicking the button, the user's session is terminated, and they are redirected to the login page.

- ID: US-004
- Title: Resetting a forgotten password
- Description: As a user who has forgotten their password, I want to be able to initiate the password reset process to regain access to my account.
- Acceptance Criteria:
  - There is a "Forgot password" link on the login page.
  - After clicking the link and providing an email address, a password reset link is sent to the user's inbox.
  - The link is unique, single-use, and has a limited validity period.
  - After following the link, the user can set a new password.

### Channel Management

- ID: US-005
- Title: Adding a new YouTube channel
- Description: As a logged-in user, I want to add a YouTube channel to my subscription list by pasting its URL, so the system can start monitoring it.
- Acceptance Criteria:
  - The interface includes a field to paste the channel URL.
  - The system validates whether the provided link is a correct YouTube channel URL.
  - After successfully adding it, the channel appears on the list of subscribed channels on the profile page.
  - The user receives a "toast" notification that the channel has been added successfully.

- ID: US-006
- Title: Limiting the number of subscribed channels
- Description: As a user who already has 10 subscribed channels, I want to see an error message about reaching the limit when I try to add another one.
- Acceptance Criteria:
  - The system does not allow adding more than 10 channels per user.
  - When trying to add an eleventh channel, a clear "toast" error message is displayed.

- ID: US-007
- Title: Removing a channel from subscriptions
- Description: As a logged-in user, I want to be able to remove a channel from my subscription list, so the system stops generating summaries for it.
- Acceptance Criteria:
  - There is a "Remove" option next to each item on the subscribed channels list (profile page).
  - After confirming the removal, the channel disappears from the list.
  - The system stops monitoring the removed channel.

### Interacting with Summaries

- ID: US-008
- Title: Browsing summaries on the dashboard
- Description: As a logged-in user, I want to see a list of generated summaries on the main dashboard as cards, sorted from newest, so I can quickly catch up on new content.
- Acceptance Criteria:
  - The dashboard is the default page after logging in.
  - Each card contains the video title, channel name, video publication date, and the TL;DR summary.
  - The list is paginated or uses infinite scroll if there are many summaries.

- ID: US-009
- Title: Viewing a full summary
- Description: As a user, I want to be able to click on a summary card to navigate to a dedicated page with its full, formatted content.
- Acceptance Criteria:
  - Clicking a card navigates to a unique URL (e.g., `/summaries/[id]`).
  - The page displays the full summary divided into sections (`summary`, `conclusions`, `key_points`).
  - The page also includes a link to the original YouTube video, the publication date, and the summary generation date.

- ID: US-010
- Title: Manually generating a summary
- Description: As a user, I want to be able to manually generate a summary for a video from a channel I subscribe to, so I don't have to wait for the daily automatic cycle.
- Acceptance Criteria:
  - The interface provides a form to paste the video link.
  - The system checks if the link leads to a video from a subscribed channel.
  - The system checks if the daily summary limit for that channel has not been used.
  - Upon initiation, the user sees a "toast" notification "Generation in progress...".
  - Once completed, the new summary appears at the top of the dashboard list.

- ID: US-011
- Title: Rating a summary
- Description: As a user, on the detailed summary page, I want to be able to rate it using "thumbs up" or "thumbs down" icons to provide feedback.
- Acceptance Criteria:
  - There are two clickable icons on the full summary page: "thumbs up" and "thumbs down".
  - The user can select one of the options. Their choice is saved in the database.
  - After voting, the interface may show a visual confirmation of the vote.

- ID: US-012
- Title: Hiding a generated summary
- Description: As a user, I want to be able to hide a single summary from my dashboard to keep it organized and personalize my view.
- Acceptance Criteria:
  - There is a "Hide" option on the summary card or its detailed page.
  - After confirmation, the summary disappears from the user's dashboard but remains in the database (it's shared with other users).
  - The summary can be unhidden (restored to view) in the future.
  - Other users subscribed to the same channel continue to see this summary on their dashboards.

### Edge Cases and Error Handling

- ID: US-013
- Title: Handling summary generation errors
- Description: As a user, when a summary for a given video cannot be generated, I want to see a clear message on the dashboard explaining the reason for the problem.
- Acceptance Criteria:
  - If generation fails, an error status appears on the video card instead of a summary.
  - The messages are clear to the user, e.g., "Error: Subtitles not available," "Error: Video is private or has been removed."

- ID: US-014
- Title: Handling videos that are too long
- Description: As a user, when trying to manually generate a summary for a video longer than 45 minutes, I want to receive a notification that the operation is not supported.
- Acceptance Criteria:
  - The system verifies the video's length before starting generation.
  - If the video exceeds 45 minutes, the process is aborted.
  - The user receives a "toast" notification with the message: "Support for videos longer than 45 minutes is not currently available."

## 6. Success Metrics

The success of the MVP will be measured using the following key indicators:

- Activity and Engagement: Users generate an average of at least 1 summary per subscribed channel per week.
- Quality of Generated Content: At least 70% of all rated summaries receive a positive rating ("thumbs up").
- Stability and Reliability: At least 80% of all channels added by users are actively and flawlessly monitored by the system (no API errors or other technical issues).
