# View Implementation Plan: Dashboard

## 1. Overview

The Dashboard is the main view for authenticated users, displaying a list of generated video summaries from their subscribed channels. The primary purpose is to allow users to quickly catch up on new content. The view features an infinite-scrolling list of summary cards, a loading state with skeleton placeholders, and an empty state for new users or users with no generated summaries.

## 2. View Routing

The Dashboard view will be accessible at the following path:
- **Path**: `/dashboard`

This will be handled by a `dashboard.astro` file inside the `src/pages/` directory.

## 3. Component Structure

The view will be composed of a main Astro page that renders a root React component. The component hierarchy is as follows:

```
src/pages/dashboard.astro
└── src/components/views/DashboardView.tsx
    ├── src/components/summaries/SummaryList.tsx
    │   ├── src/components/summaries/SummaryCard.tsx
    │   └── src/components/summaries/SummaryCardSkeleton.tsx
    └── src/components/shared/EmptyState.tsx
```

## 4. Component Details

### `DashboardView.tsx`
- **Component description**: This is the main container component for the dashboard. It is responsible for orchestrating data fetching, state management, and rendering the appropriate child components based on the current state (loading, success, empty, or error).
- **Main elements**: It will render the `SummaryList` component when summaries are available or loading, or the `EmptyState` component if no summaries are found. It will also contain a title heading (e.g., `<h1>Dashboard</h1>`).
- **Handled interactions**: None directly. It manages the state that child components use.
- **Handled validation**: None.
- **Types**: Uses the state and data types defined in the `useSummaries` hook.
- **Props**: None.

### `SummaryList.tsx`
- **Component description**: This component is responsible for rendering the list of summaries. It implements the infinite scroll functionality, triggering a callback to load more data when the user scrolls near the end of the list. It also displays skeleton loaders while new data is being fetched.
- **Main elements**: A `div` or `ul` element that maps over the `summaries` array to render `SummaryCard` components. It will use a sentinel element at the bottom of the list and the `react-intersection-observer` hook to detect when it becomes visible, triggering the `onLoadMore` callback. It will also render a set of `SummaryCardSkeleton` components when `isLoading` is true.
- **Handled interactions**: User scrolling to the bottom of the list.
- **Handled validation**: None.
- **Types**: `SummaryWithVideo[]`, `ApiError`.
- **Props**:
  ```typescript
  interface SummaryListProps {
    summaries: SummaryWithVideo[];
    isLoading: boolean;
    hasMore: boolean;
    error: ApiError | null;
    onLoadMore: () => void;
  }
  ```

### `SummaryCard.tsx`
- **Component description**: A presentational component that displays information for a single video summary. The entire card will be clickable and link to the detailed summary view.
- **Main elements**: It will be built using the `Card` component from `shadcn/ui`. It will contain an `img` for the video thumbnail, and text elements for the video title, channel name, video publication date, and the TL;DR summary. The component will be wrapped in an Astro `<a>` tag or a client-side routing link.
- **Handled interactions**: User click on the card to navigate.
- **Handled validation**: None.
- **Types**: `SummaryWithVideo`.
- **Props**:
  ```typescript
  interface SummaryCardProps {
    summary: SummaryWithVideo;
  }
  ```

### `SummaryCardSkeleton.tsx`
- **Component description**: A placeholder component that mimics the layout of the `SummaryCard`. It is displayed during data fetching to improve perceived performance and prevent layout shifts.
- **Main elements**: It will use the `Card` and `Skeleton` components from `shadcn/ui` to create a visual placeholder with shapes corresponding to the thumbnail, title, and text lines of a real `SummaryCard`.
- **Handled interactions**: None.
- **Handled validation**: None.
- **Types**: None.
- **Props**: None.

### `EmptyState.tsx`
- **Component description**: A component displayed when the initial API call returns no summaries. It should inform the user why the dashboard is empty and guide them on what to do next.
- **Main elements**: It will contain an icon or illustration, a heading (e.g., "No summaries yet"), a descriptive paragraph (e.g., "Subscribe to YouTube channels on your profile page to start generating summaries."), and a call-to-action button linking to the profile page.
- **Handled interactions**: User click on the CTA button.
- **Handled validation**: None.
- **Types**: None.
- **Props**: None.

## 5. Types

The primary DTOs provided by the API are sufficient for this view. No new custom ViewModel types are required. The key types are:

- **`PaginatedResponse<SummaryWithVideo>`**: The top-level object returned by the API.
  ```typescript
  interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
  }
  ```
- **`SummaryWithVideo`**: The object representing a single summary item in the list.
  ```typescript
  interface SummaryWithVideo {
    id: string;
    video: VideoBasic;
    channel: Channel;
    tldr: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    generated_at: string | null;
    user_rating: boolean | null;
  }
  ```
- **`PaginationMeta`**: The object containing pagination details.
  ```typescript
  interface PaginationMeta {
    total: number;
    limit: number;
    offset: number;
  }
  ```

## 6. State Management

State will be encapsulated within a custom React hook, `useSummaries`, to keep the data-fetching logic separate from the UI components.

### `useSummaries()` Hook
- **Purpose**: To handle fetching summaries, managing pagination state, and tracking loading/error states.
- **State**:
  - `summaries: SummaryWithVideo[]`: An array of all loaded summary items.
  - `status: 'idle' | 'loading' | 'success' | 'error'`: The current status of the API request.
  - `error: ApiError | null`: Stores any error response from the API.
  - `hasMore: boolean`: `true` if more summaries can be fetched from the server.
- **Functions**:
  - `loadMore()`: A function exposed by the hook to trigger fetching the next page of results. It will be called by the `SummaryList` component.
- **Logic**: It will use `useEffect` for the initial data fetch. The `loadMore` function will manage the `offset` internally, append new results to the `summaries` array, and update the `hasMore` flag based on the `total` from the API's pagination metadata.

## 7. API Integration

The view will integrate with a single backend endpoint to fetch summary data.

- **Endpoint**: `GET /api/summaries`
- **Request**:
  - The frontend will make a `GET` request to this endpoint.
  - **Headers**: It must include an `Authorization` header with the user's JWT Bearer token, retrieved from the active Supabase session.
  - **Query Parameters**:
    - `limit` (e.g., 20)
    - `offset` (starts at 0, increments by `limit` for each subsequent request)
- **Response Type**: The expected response will be of type `PaginatedResponse<SummaryWithVideo>`.

A utility function will be created to handle the `fetch` call, including adding the auth header and parsing the JSON response.

## 8. User Interactions

- **Initial Load**: The view fetches the first page of summaries automatically. A skeleton loader is shown.
- **Scrolling**: As the user scrolls to the bottom of the `SummaryList`, the `loadMore` function is triggered, fetching the next page. Skeletons are shown below the existing content while loading.
- **Card Click**: Clicking on any `SummaryCard` navigates the user to the detailed view for that summary at `/dashboard/{summary.id}`.
- **Empty State Action**: If no summaries are present, the user can click a CTA in the `EmptyState` component to navigate to their profile page to add channel subscriptions.

## 9. Conditions and Validation

The primary condition verified by the interface is user authentication.

- **Authentication**: Before attempting to fetch data, the `useSummaries` hook will check for an active user session via the Supabase client. If no session exists, the request will not be sent, and the component can either show an "Unauthorized" error or trigger a redirect to the login page.
- **API Response**: The fetch utility will check if the response `ok` status is true. If not, it will parse the JSON error body and propagate an `ApiError` object.

## 10. Error Handling

The view must gracefully handle several potential error scenarios:

- **Network Error**: If the `fetch` call fails due to a network issue, the `useSummaries` hook will set its status to `error`. The `DashboardView` will display a generic error message like "Failed to connect. Please check your network and try again."
- **Unauthorized (401)**: If the API returns a 401 status, the `DashboardView` will display an error message prompting the user to log in again.
- **Server Error (500+)**: For any server-side errors, a user-friendly message like "An unexpected error occurred. Please try again later." will be displayed.
- **Empty State**: While not an error, the case where the API returns an empty `data` array on the initial load will be handled by displaying the `EmptyState` component.

## 11. Implementation Steps

1.  **Create Astro Page**: Create the file `src/pages/dashboard.astro`. Add basic layout and render the main React component, `DashboardView`, with the `client:load` directive.
2.  **Component Scaffolding**: Create empty files for all the React components: `DashboardView.tsx`, `SummaryList.tsx`, `SummaryCard.tsx`, `SummaryCardSkeleton.tsx`, and `EmptyState.tsx`.
3.  **Implement `useSummaries` Hook**: Create the custom hook in `src/hooks/useSummaries.ts`. Implement the state logic and the `loadMore` function. Add a placeholder fetch utility.
4.  **Implement API Utility**: Create a function `api.ts` in `src/lib` that handles making authenticated `fetch` requests to the application's backend, retrieving the token from the Supabase client.
5.  **Build UI Components**:
    - Implement `SummaryCardSkeleton.tsx` using `shadcn/ui` `Card` and `Skeleton` components.
    - Implement `SummaryCard.tsx`, populating it with props of type `SummaryWithVideo`.
    - Implement `EmptyState.tsx` with appropriate messaging and a CTA.
6.  **Implement `SummaryList.tsx`**:
    - Take props as defined in section 4.
    - Render `SummaryCard` or `SummaryCardSkeleton` based on props.
    - Add the `react-intersection-observer` hook to detect the end of the list and call the `onLoadMore` prop.
7.  **Implement `DashboardView.tsx`**:
    - Use the `useSummaries` hook to get data and state.
    - Implement the conditional rendering logic:
      - If `status` is `loading` and `summaries` is empty, show skeletons.
      - If `status` is `success` and `summaries` is empty, show `EmptyState`.
      - If `summaries` has items, render `SummaryList`.
      - If `status` is `error`, show an error message.
8.  **Styling and Final Touches**: Apply Tailwind CSS classes to all components to match the desired UI. Ensure the view is responsive. Add ARIA attributes for accessibility.
9.  **Testing**: Write unit tests for the `useSummaries` hook and component tests for the UI components to verify correct rendering in all states.
