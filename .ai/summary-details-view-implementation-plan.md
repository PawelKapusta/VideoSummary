# View Implementation Plan: Summary Details

## 1. Overview

This document outlines the implementation plan for the "Summary Details" view. The purpose of this view is to display the complete, structured content of a single video summary. It provides users with an in-depth look at the generated summary, including key points and conclusions, and allows them to interact with it by rating it, hiding it from their dashboard, or navigating to the original YouTube video.

## 2. View Routing

The view will be accessible at the following dynamic path:

- **Path:** `/summaries/[summaryId]`
- **Example:** `/summaries/123e4567-e89b-12d3-a456-426614174000`

This will be implemented as an Astro page located at `src/pages/summaries/[summaryId].astro`.

## 3. Component Structure

The view will be built using a combination of a server-rendered Astro page and client-rendered React components for interactivity.

```
src/pages/summaries/[summaryId].astro
└── <Layout>
    └── <SummaryDetailsView summaryId={id} /> (client:load)
        ├── <LoadingSpinner />
        ├── <ErrorMessage />
        └── <div>
            ├── <SummaryHeader />
            ├── <SummaryActions />
            │   └── <RatingControl />
            └── <SummaryContent />
```

## 4. Component Details

### `SummaryDetailsView.tsx` (Client Component)

- **Component description:** The main parent component that orchestrates the entire view. It is responsible for fetching the summary data using the `summaryId` prop, managing the view's state (loading, error, data), and passing data down to its children.
- **Main elements:** Contains conditional rendering logic to display a loading indicator, an error message, or the main content layout which includes the header, actions, and content components.
- **Handled interactions:** None directly. It delegates state changes and user interactions to the `useSummaryDetails` hook.
- **Handled validation:**
  - Validates that the `summaryId` prop is a valid UUID before initiating an API call.
- **Types:**
  - DTO: `DetailedSummary`
  - ViewModel: `SummaryDetailsViewModel`
- **Props:**
  - `summaryId: string`

### `SummaryHeader.tsx`

- **Component description:** A presentational component that displays the primary metadata of the summary, such as the video title, channel name, and relevant dates.
- **Main elements:** Uses `<h1>` for the title, `<p>` tags for channel name and dates, and potentially a link to the channel page.
- **Handled interactions:** None.
- **Handled validation:** None.
- **Types:**
  - ViewModel: `SummaryDetailsViewModel['video']`, `SummaryDetailsViewModel['channel']`, `SummaryDetailsViewModel['generated_at']`
- **Props:**
  - `video: { title: string, published_at: string }`
  - `channel: { name: string }`
  - `generated_at: string | null`

### `SummaryContent.tsx`

- **Component description:** Renders the structured `full_summary` content. It will format the main summary, key points, and conclusions into a readable, sectioned layout.
- **Main elements:** Uses `<h2>` for section titles ("Summary", "Key Points", "Conclusions") and `<ul>`/`<li>` for rendering the lists of key points and conclusions.
- **Handled interactions:** None.
- **Handled validation:**
  - Gracefully handles cases where `full_summary` or its properties are null or undefined.
- **Types:**
  - ViewModel: `FullSummaryContent`
- **Props:**
  - `full_summary: FullSummaryContent | null`

### `SummaryActions.tsx`

- **Component description:** A functional component that groups all user-interactive elements related to the summary. This includes the rating controls, the "hide" button, and a link to the original video.
- **Main elements:** Contains the `<RatingControl />` component, a `Button` (from Shadcn/ui) for hiding the summary, and an `<a>` tag styled as a button to link to the YouTube video.
- **Handled interactions:**
  - `onRate(rating: boolean)`: Callback prop to pass rating actions up to the parent.
  - `onHide()`: Callback prop to handle the hide action.
- **Handled validation:** None.
- **Types:**
  - ViewModel: `SummaryDetailsViewModel['user_rating']`
- **Props:**
  - `youtube_url: string`
  - `user_rating: boolean | null`
  - `onRate: (rating: boolean) => void`
  - `onHide: () => void`

### `RatingControl.tsx`

- **Component description:** A sub-component dedicated to the "thumb up" and "thumb down" rating functionality. It displays the current user rating and handles click events to change it.
- **Main elements:** Two `Button` components (from Shadcn/ui) with thumb icons. The buttons' visual state (e.g., color, variant) will reflect the user's current rating.
- **Handled interactions:**
  - Click events on the thumb icons trigger the `onRate` prop with `true` (for up) or `false` (for down).
- **Handled validation:** None.
- **Types:**
  - Prop Type: `boolean | null`
- **Props:**
  - `user_rating: boolean | null`
  - `onRate: (rating: boolean) => void`

## 5. Types

### `FullSummaryContent`

A new type to provide a strict structure for the `full_summary` JSON object.

```typescript
interface FullSummaryContent {
  summary: string; // The main, detailed summary text.
  conclusions: string[]; // An array of concluding points.
  key_points: string[]; // An array of key takeaways.
}
```

### `SummaryDetailsViewModel`

A comprehensive ViewModel to represent the complete state of the view, derived from the `DetailedSummary` DTO for easier use within components.

```typescript
interface SummaryDetailsViewModel {
  id: string;
  video: {
    id: string;
    title: string;
    youtube_url: string;
    published_at: string;
  };
  channel: {
    id: string;
    name: string;
  };
  tldr: string | null;
  full_summary: FullSummaryContent | null;
  status: SummaryStatus;
  generated_at: string | null;
  rating_stats: {
    upvotes: number;
    downvotes: number;
  };
  user_rating: boolean | null;
}
```

## 6. State Management

State will be managed within the `SummaryDetailsView.tsx` component, encapsulated and controlled by a custom hook, `useSummaryDetails`.

### `useSummaryDetails(summaryId: string)` Custom Hook

- **Purpose:** To abstract all business logic from the view component. This includes data fetching, state management (loading, error), and handling API calls for user actions (rating, hiding).
- **Exposed Values:**
  - `summary: SummaryDetailsViewModel | null`: The processed data for the view.
  - `isLoading: boolean`: The current loading state.
  - `error: ApiError | null`: Any error object from the API.
  - `rateSummary: (rating: boolean) => Promise<void>`: A function to call the rating API endpoint, which will handle optimistic UI updates.
  - `hideSummary: () => Promise<void>`: A function to call the hide summary API endpoint.

## 7. API Integration

The view will primarily interact with one existing endpoint and requires two new endpoints for user actions.

1.  **Get Summary Details (Existing)**
    - **Request:** `GET /api/summaries/:summaryId`
    - **Response Type:** `DetailedSummary` (from `src/types.ts`)

2.  **Rate Summary (New Endpoint Required)**
    - **Request:** `POST /api/summaries/:summaryId/ratings`
    - **Request Body:** `{ rating: boolean }`
    - **Response Type:** `RatingResponse`

3.  **Hide Summary (New Endpoint Required)**
    - **Request:** `POST /api/summaries/:summaryId/hide`
    - **Request Body:** None
    - **Response Type:** `ApiSuccess`

## 8. User Interactions

- **Viewing Content:** The user scrolls to read the summary details. No special handling is required.
- **Rating:** The user clicks the "thumb up" or "thumb down" icon. The UI will optimistically update to reflect the new rating, and an API call will be sent in the background. If the call fails, the UI will revert to its previous state and show an error toast.
- **Hiding:** The user clicks the "Hide" button. A confirmation dialog should appear. If confirmed, an API call is made. On success, the user is redirected to the dashboard (`/dashboard`), and a success toast is shown.
- **Viewing on YouTube:** The user clicks the "Watch on YouTube" link, which opens the original video in a new browser tab.

## 9. Conditions and Validation

- **Authentication:** The `SummaryDetailsView` component will be rendered inside a protected route layout. The `GET /api/summaries/:summaryId` endpoint will verify the user's session. If the user is not authenticated, they will be redirected to the login page.
- **Authorization:** The API will ensure the user is subscribed to the channel associated with the summary. If not, a `403 Forbidden` error will be returned, and the UI will display a corresponding error message.
- **Data Existence:** If the `summaryId` does not correspond to an existing summary, the API will return a `404 Not Found` error. The UI will display a "Summary not found" message.

## 10. Error Handling

- **Loading State:** A skeleton loader or spinner will be displayed while the initial summary data is being fetched.
- **Not Found (404):** If the API returns a 404 error, the UI will display a clear message like "Summary not found" with an option to return to the dashboard.
- **Forbidden (403) / Unauthorized (401):** The UI will show a generic error message like "You do not have permission to view this summary" and suggest returning to the dashboard.
- **Server Error (5xx):** For any other server-side errors, a generic error message ("An unexpected error occurred. Please try again later.") will be displayed.
- **Action Failures:** If rating or hiding fails, a "toast" notification will appear explaining the failure, and the UI will revert any optimistic updates.

## 11. Implementation Steps

1.  **Create New API Endpoints:** Implement the backend logic and routes for `POST /api/summaries/:summaryId/ratings` and `POST /api/summaries/:summaryId/hide`.
2.  **Define New Types:** Add the `FullSummaryContent` and `SummaryDetailsViewModel` types to a relevant file (e.g., `src/types.ts` or a new view-specific types file).
3.  **Create Astro Page:** Create the file `src/pages/summaries/[summaryId].astro`. Implement basic data fetching on the server to handle the initial page load and pass the `summaryId` to the client component.
4.  **Develop `useSummaryDetails` Hook:** Create the custom hook to handle all data fetching, state management, and API interactions for rating and hiding.
5.  **Build React Components:**
    - Develop `SummaryDetailsView.tsx` to use the `useSummaryDetails` hook and manage the overall layout and conditional rendering.
    - Create the presentational components: `SummaryHeader.tsx`, `SummaryContent.tsx`, `SummaryActions.tsx`, and `RatingControl.tsx`.
6.  **Style Components:** Apply Tailwind CSS and use Shadcn/ui components to style the view according to the design specifications, ensuring it is fully responsive.
7.  **Integrate and Test:** Assemble all components in the Astro page, test all user interactions, and verify all error handling and edge cases.
