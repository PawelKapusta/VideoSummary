# View Implementation Plan: Generate Summary

## 1. Overview

This document outlines the implementation plan for the "Generate Summary" view, which allows authenticated users to manually initiate the generation of a summary for a specific YouTube video. The view includes a form for the video URL, a preview of the video details, a real-time validation checklist, and a button to submit the request. The entire process is designed to be interactive and provide clear feedback to the user at every step.

## 2. View Routing

The view will be accessible at the following path:
- **Path:** `/generate`

This will be handled by a `generate.astro` file in the `src/pages/` directory, which will render the main React client component.

## 3. Component Structure

The view will be composed of a main container component that manages state and several child components responsible for specific parts of the UI.

```
/src/pages/generate.astro
└── /src/components/views/GenerateSummaryView.tsx
    ├── /src/components/summaries/VideoUrlForm.tsx
    │   ├── <Input /> (from shadcn/ui)
    │   └── <Button /> (from shadcn/ui)
    ├── /src/components/summaries/VideoPreview.tsx
    │   ├── <img /> (for thumbnail)
    │   └── <p /> (for title, channel name, etc.)
    └── /src/components/summaries/ValidationStatus.tsx
        └── <ul /> (list of validation checks)
```

## 4. Component Details

### `GenerateSummaryView.tsx`
- **Component description:** The main container component for the `/generate` page. It orchestrates all state management, API calls via a custom hook, and renders its child components, passing down necessary state and props.
- **Main elements:** A `div` that structures the layout, containing the `VideoUrlForm`, `VideoPreview`, and `ValidationStatus` components.
- **Handled interactions:** None directly. It manages the state that results from child component interactions.
- **Handled validation:** None directly. It holds the validation state derived from API calls.
- **Types:** `GenerateSummaryViewModel`
- **Props:** None.

### `VideoUrlForm.tsx`
- **Component description:** A form consisting of a single text input for the YouTube video URL and a submit button. It captures user input and signals submission events.
- **Main elements:** An HTML `<form>` element, a shadcn/ui `Input` for the URL, and a shadcn/ui `Button` for submission.
- **Handled interactions:**
  - `onChange` on the input field.
  - `onSubmit` on the form.
- **Handled validation:** Can perform basic client-side URL pattern matching for immediate feedback.
- **Types:** Uses `GenerateSummaryViewModel` for button state.
- **Props:**
  ```typescript
  interface VideoUrlFormProps {
    url: string;
    onUrlChange: (url: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    canSubmit: boolean;
  }
  ```

### `VideoPreview.tsx`
- **Component description:** A display component that shows metadata of the YouTube video fetched from the backend, including the thumbnail, title, channel name, and duration. It is only rendered when video data is available.
- **Main elements:** An `img` tag for the thumbnail, and `h3`/`p` tags for text content.
- **Handled interactions:** None.
- **Handled validation:** None.
- **Types:** `VideoPreviewViewModel`
- **Props:**
  ```typescript
  interface VideoPreviewProps {
    video: VideoPreviewViewModel | null;
  }
  ```

### `ValidationStatus.tsx`
- **Component description:** Displays a checklist of the conditions required to generate a summary. Each item in the list shows its current status (pending, checking, success, or error) to give the user real-time feedback.
- **Main elements:** A `ul` containing `li` elements for each validation step, with icons and text indicating the status.
- **Handled interactions:** None.
- **Handled validation:** None; it is a visual representation of the validation state.
- **Types:** `ValidationStatusViewModel`
- **Props:**
  ```typescript
  interface ValidationStatusProps {
    status: ValidationStatusViewModel;
  }
  ```

## 5. Types

A new endpoint and several new ViewModel types are required for this view.

### DTOs (Data Transfer Objects)

A new backend endpoint `GET /api/videos/meta` will be required to fetch video details and check subscription status in a single call.

- **Request:** `GET /api/videos/meta?url={youtube-video-url}`
- **Response Type:** `VideoMetaResponse`
  ```typescript
  // src/types.ts
  export interface VideoMetaResponse {
    youtube_video_id: string;
    title: string;
    thumbnail_url: string;
    duration_seconds: number;
    channel: {
      id: string; // Database UUID for the channel
      youtube_channel_id: string;
      name: string;
    };
    is_subscribed: boolean;
  }
  ```

### ViewModels

- **`VideoPreviewViewModel`**
  - **Description:** Shape of the data required by the `VideoPreview` component.
  ```typescript
  // src/types.ts
  export interface VideoPreviewViewModel {
    title: string;
    channelName: string;
    thumbnailUrl: string;
    durationInMinutes: number;
  }
  ```

- **`ValidationStatusViewModel`**
  - **Description:** Represents the complete state of all pre-submission validation checks.
  ```typescript
  // src/types.ts
  export interface ValidationStep {
    text: string;
    status: 'pending' | 'checking' | 'success' | 'error';
    error_message?: string;
  }

  export interface ValidationStatusViewModel {
    isUrlValid: ValidationStep;
    isSubscribed: ValidationStep;
    isWithinLimit: ValidationStep;
    isDurationValid: ValidationStep;
  }
  ```

## 6. State Management

State will be managed within a custom hook, `useGenerateSummary`, to encapsulate all business logic, API calls, and state transitions, keeping the `GenerateSummaryView` component clean.

### `useGenerateSummary` Custom Hook
- **Purpose:** To handle the entire lifecycle of the generate summary process, from user input to final submission.
- **Internal State:**
  - `url`: The raw string from the input.
  - `debouncedUrl`: The debounced URL value used to trigger API calls.
  - The hook will manage a comprehensive state object conforming to `GenerateSummaryViewModel`.
- **Logic:**
  1. Uses `useDebounce` to delay API calls until the user stops typing.
  2. Uses `useQuery` from React Query to fetch video metadata from `/api/videos/meta` when `debouncedUrl` changes.
  3. Uses a second, dependent `useQuery` (with the `enabled` option) to fetch the generation status from `/api/generation-requests/status` once the `channel_id` is available.
  4. Derives the `ValidationStatusViewModel` and `canSubmit` boolean from the results of the queries.
  5. Exposes a `submit` function that calls a `useMutation` hook to `POST` to `/api/summaries`.

## 7. API Integration

Integration will rely on three endpoints and be managed by React Query.

1.  **Fetch Video Metadata**
    -   **Endpoint:** `GET /api/videos/meta`
    -   **Trigger:** Debounced URL input change.
    -   **Request:** Query parameter `url`.
    -   **Response:** `VideoMetaResponse`
    -   **Hook:** `useQuery`

2.  **Check Generation Status**
    -   **Endpoint:** `GET /api/generation-requests/status`
    -   **Trigger:** Successful fetch of video metadata.
    -   **Request:** Query parameter `channel_id`.
    -   **Response:** `GenerationStatusResponse` (existing type).
    -   **Hook:** `useQuery` (chained with `enabled` option).

3.  **Initiate Summary Generation**
    -   **Endpoint:** `POST /api/summaries`
    -   **Trigger:** User clicks the "Generate Summary" button.
    -   **Request Type:** `GenerateSummaryRequest` (`{ video_url: string }`).
    -   **Response Type:** `ApiSuccess<SummaryBasic & { message: string }>`.
    -   **Hook:** `useMutation`

## 8. User Interactions

- **Typing in the URL Field:** As the user types, the input is debounced. After a short delay, an API call is made to fetch video metadata. The `ValidationStatus` and `VideoPreview` components update in real-time to reflect the loading and success/error states of the API calls.
- **Clicking "Generate Summary":** This action is only possible if all validation checks have passed (`canSubmit` is true).
  - The button enters a loading state.
  - The `POST` request is sent to `/api/summaries`.
  - **On Success (202):** A success toast ("Generation in progress...") is displayed, and the user is redirected to the `/dashboard` page.
  - **On Error:** An error toast is displayed with the specific message from the API response. The button returns to its normal state.

## 9. Conditions and Validation

The "Generate Summary" button will be disabled until all of the following conditions, verified through a sequence of API calls, are met:

1.  **Valid YouTube URL:** Verified when `GET /api/videos/meta` returns a `200 OK`. If it fails, this check is marked as an error.
2.  **User is Subscribed:** Verified by the `is_subscribed: true` flag in the `VideoMetaResponse`.
3.  **Video Duration is Valid:** Verified by checking `duration_seconds <= 2700` in the `VideoMetaResponse`.
4.  **Daily Limit Not Reached:** Verified by the `can_generate: true` flag in the `GenerationStatusResponse` from `GET /api/generation-requests/status`.

The `ValidationStatus` component will provide transparent, real-time feedback on each of these checks.

## 10. Error Handling

- **Form-level Errors:** Invalid URL format can be flagged immediately on the client side.
- **API Errors (Queries):** `useQuery`'s `isError` status will be used to update the `ValidationStatusViewModel`. Specific error messages (e.g., "Video not found," "You are not subscribed") will be displayed for each validation step.
- **API Errors (Mutation):** The `onError` callback of `useMutation` will handle submission errors. The error object will be parsed to extract the message from the `ApiError` response body, which will then be displayed in a toast notification.
- **Network Errors:** Generic "A network error occurred" messages will be shown if an API call fails without a specific backend error response.

## 11. Implementation Steps

1.  **Backend:** Create the new API endpoint `GET /api/videos/meta` that accepts a `video_url`, fetches video metadata from the YouTube API, and checks if the current authenticated user is subscribed to the video's channel.
2.  **Types:** Add the new `VideoMetaResponse`, `VideoPreviewViewModel`, and `ValidationStatusViewModel` types to `src/types.ts`.
3.  **Component Scaffolding:** Create the files for `GenerateSummaryView.tsx`, `VideoUrlForm.tsx`, `VideoPreview.tsx`, and `ValidationStatus.tsx` with basic JSX structure.
4.  **Astro Page:** Create `src/pages/generate.astro` and render the `GenerateSummaryView` component with `client:load`.
5.  **Custom Hook:** Implement the `useGenerateSummary` custom hook, including the state logic and the chained `useQuery` and `useMutation` calls.
6.  **Component Implementation:** Build out the UI for each component, using shadcn/ui components. Connect them to the state and handlers provided by the `useGenerateSummary` hook.
7.  **Styling:** Apply Tailwind CSS for layout and styling to match the application's design system.
8.  **Testing:** Write tests for the `useGenerateSummary` hook to verify the complex state logic and API call orchestration.
