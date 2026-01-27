# View Implementation Plan: Videos List

## 1. Overview

This document outlines the implementation plan for the "Videos List" view. The primary purpose of this view is to allow users to browse videos from their subscribed YouTube channels, see which ones already have a summary, and manually trigger summary generation for those that don't. The view will feature filtering options and an infinite scroll for a seamless browsing experience.

## 2. View Routing

The view will be accessible at the following application path:

- **Path**: `/videos`

This will be handled by creating a new Astro page at `src/pages/videos.astro`, which will render the main React component.

## 3. Component Structure

The view will be composed of several hierarchical components.

```
- VideosPage.astro
  - Layout.astro
    - VideosView.tsx (client:load)
      - Header (Shared UI Component)
      - VideosFilterBar.tsx
        - Select (Shadcn - for channels)
        - ToggleGroup (Shadcn - for summary status)
      - VideosGrid.tsx
        - SkeletonLoader.tsx (for initial load)
        - VideoCard.tsx (repeated for each video - clickable container)
          - Card (Shadcn)
          - Text labels ("See Summary" / "Generate Summary")
        - InfiniteScrollTrigger.tsx (to load more videos)
        - EmptyState.tsx (if no videos are found)
      - GenerateSummaryDialog.tsx (conditionally rendered)
        - Dialog (Shadcn)
```

## 4. Component Details

### `VideosView.tsx`

- **Component description**: The main container component for the view. It orchestrates data fetching, state management for filters, and renders all child components.
- **Main elements**: A `div` acting as the main container, rendering `<VideosFilterBar />`, `<VideosGrid />`, and `<GenerateSummaryDialog />`.
- **Handled interactions**: Manages the overall state of the view, passing down data and handlers to child components.
- **Handled validation**: None.
- **Types**: `VideosFilterState`, `VideoSummary`.
- **Props**: None.

### `VideosFilterBar.tsx`

- **Component description**: A horizontal bar at the top of the view that contains controls for filtering the list of videos.
- **Main elements**:
  - `Select` (Shadcn) for filtering by channel.
  - `ToggleGroup` (Shadcn) for filtering by summary status (`All`, `With`, `Without`).
- **Handled interactions**:
  - `onChannelChange`: When a user selects a channel from the dropdown.
  - `onSummaryStatusChange`: When a user selects a summary status.
- **Handled validation**: None.
- **Types**: `Channel`.
- **Props**:
  ```typescript
  interface VideosFilterBarProps {
    channels: Channel[];
    activeFilters: VideosFilterState;
    onFiltersChange: (filters: Partial<VideosFilterState>) => void;
    disabled: boolean;
  }
  ```

### `VideosGrid.tsx`

- **Component description**: Renders the videos in a responsive grid layout. It also handles the infinite scroll logic to fetch and display more videos as the user scrolls.
- **Main elements**:
  - A `div` with grid layout styles.
  - Maps over the `videos` array to render `<VideoCard />` components.
  - Renders `<SkeletonLoader />` when `isLoading` is true.
  - Renders `<EmptyState />` if the videos array is empty after loading.
  - An `InfiniteScrollTrigger` component at the bottom to detect when to load more videos.
- **Handled interactions**:
  - Detects when the user scrolls near the end of the list to trigger `fetchNextPage`.
- **Handled validation**: None.
- **Types**: `VideoSummary`.
- **Props**:
  ```typescript
  interface VideosGridProps {
    videos: VideoSummary[];
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    onSelectVideo: (video: VideoSummary) => void;
  }
  ```

### `VideoCard.tsx`

- **Component description**: A card that displays the thumbnail, title, and channel name for a single video. It includes a button to initiate summary generation if a summary is not available.
- **Main elements**:
  - `Card` (Shadcn) as the main container, fully clickable.
  - An `img` for the video thumbnail.
  - Text elements for title and channel name.
  - A `Badge` (Shadcn) to indicate if a summary `is available`.
  - A text indicator ("See Summary" or "Generate Summary") instead of a button.
- **Handled interactions**:
  - `onClick`: Navigates to `/summaries/:id` if a summary exists, or opens the `GenerateSummaryDialog` if not.
- **Handled validation**: Visual status indicates if generation is possible.
- **Types**: `VideoSummary`.
- **Props**:
  ```typescript
  interface VideoCardProps {
    video: VideoSummary;
    onGenerate: (video: VideoSummary) => void;
  }
  ```

### `GenerateSummaryDialog.tsx`

- **Component description**: A modal dialog that appears when a user intends to generate a summary. It displays video details and asks for confirmation before proceeding. It should also perform pre-flight checks (e.g., generation limits).
- **Main elements**:
  - `Dialog` (Shadcn) components.
  - Displays video thumbnail, title, and channel.
  - Shows validation steps (e.g., checking limits, video duration).
  - A "Confirm & Generate" button and a "Cancel" button.
- **Handled interactions**:
  - `onConfirm`: Triggers the summary generation mutation.
  - `onCancel` or `onClose`: Closes the dialog.
- **Handled validation**:
  - Before allowing generation, it must verify against API conditions:
    1. Check if the daily generation limit for the channel has been reached.
    2. Check if the video duration is within the acceptable limit (< 45 minutes).
- **Types**: `VideoSummary`, `GenerationStatusResponse`.
- **Props**:
  ```typescript
  interface GenerateSummaryDialogProps {
    video: VideoSummary | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (video: VideoSummary) => void;
  }
  ```

## 5. Types

### DTOs (from API)

- `VideoSummary`: The core data object for each video in the list.
- `Channel`: Used for the channel filter dropdown.
- `UserProfile`: Fetched to get the list of subscribed channels.
- `PaginatedResponse<T>`: The generic wrapper for paginated API responses.
- `GenerateSummaryRequest`: The payload for the summary generation request.
- `GenerationStatusResponse`: The response from the pre-flight check for generation limits.

### ViewModels and State Types

```typescript
/**
 * Represents the state of the filters applied to the videos list.
 */
interface VideosFilterState {
  channelId: string | "all";
  summaryStatus: "all" | "with" | "without";
}

/**
 * The view model for the validation steps shown in the GenerateSummaryDialog.
 */
interface ValidationStep {
  text: string;
  status: "pending" | "checking" | "success" | "error";
  errorMessage?: string;
}
```

## 6. State Management

State will be managed primarily through a custom React hook, `useVideos`, which will encapsulate all related logic.

### `useVideos` Custom Hook

- **Purpose**: To handle all business logic for the `VideosView`, including data fetching, filtering, pagination, and triggering summary generation.
- **React Query Usage**:
  - `useInfiniteQuery`: To fetch paginated video data from `/api/videos`. The query key will be dynamic, incorporating the `filters` state (e.g., `['videos', filters]`) to trigger automatic refetching when filters change. It will manage pagination tokens/offsets.
  - `useQuery`: To fetch the user's profile and list of subscribed channels (from `/api/profile`) to populate the filter bar.
  - `useMutation`: To handle the `POST` request to `/api/summaries` for generating a new summary. It will manage loading/error states and allow for cache invalidation on success.
- **Local State (`useState`)**:
  - `filters`: An object of type `VideosFilterState` to hold the current filter values.
  - `selectedVideo`: A state to hold the video object for the `GenerateSummaryDialog`.
- **Returns**: The hook will return a comprehensive object for the `VideosView` component:
  ```typescript
  {
    videos,           // Flattened list of videos
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,    // Function to load the next page
    filters,
    setFilters,       // Function to update filters
    channels,         // List of user's subscribed channels
    generateSummary,  // The mutation function
    isGenerating,     // Loading state for the mutation
    // ... any other necessary state or handlers
  }
  ```

## 7. API Integration

- **Primary Endpoint**: `GET /api/videos`
  - **Usage**: Fetched by `useInfiniteQuery`.
  - **Request**: The hook will dynamically build the query string with `limit`, `offset`, and `channel_id` based on the current state.
  - **Response Type**: `PaginatedResponse<VideoSummary>`.

- **Secondary Endpoint**: `GET /api/profile`
  - **Usage**: Fetched by `useQuery` to get channel data for the filter.
  - **Response Type**: `UserProfile`.

- **Action Endpoint**: `POST /api/summaries`
  - **Usage**: Called by `useMutation` to generate a summary.
  - **Request Type**: `GenerateSummaryRequest` (`{ video_url: string }`).
  - **Response Type**: `ApiSuccess<{ summary_id: string }>`. On success, the `['videos']` query will be invalidated to reflect the change.

- **Validation Endpoint**: `GET /api/summaries/status?channel_id={channelId}`
  - **Usage**: Called when the `GenerateSummaryDialog` opens to check if generation is allowed.
  - **Response Type**: `GenerationStatusResponse`.

## 8. User Interactions

1.  **Initial Load**: The view loads, displaying a skeleton grid. `useVideos` fetches the first page of videos and the user's channels.
2.  **Scrolling**: When the user scrolls to the bottom of the grid, `fetchNextPage` is called to append the next page of results. A loading spinner appears at the bottom during the fetch.
3.  **Filtering**: The user changes a filter in `VideosFilterBar`. The `filters` state updates, `useInfiniteQuery` re-fetches from the API with new parameters, and the grid updates.
4.  **Generate Summary Click**: The user clicks "Generate Summary" on a `VideoCard`. The `GenerateSummaryDialog` opens for the selected video.
5.  **Confirm Generation**: The user clicks "Confirm" in the dialog. The `useMutation` is triggered. The dialog can show a loading state. Upon completion, a success/error toast is shown, the dialog closes, and the video list is updated.

## 9. Conditions and Validation

- **Client-Side Filtering**: The "summaryStatus" filter (`All`, `With`, `Without`) will be implemented on the client side. The data from `useInfiniteQuery` will be flattened and then filtered before being passed to the `VideosGrid`.
- **Generation Pre-conditions**: The `GenerateSummaryDialog` must perform the following checks before enabling the "Confirm" button:
  - Fetch the generation status from `/api/summaries/status` to ensure the daily limit isn't exceeded.
  - Fetch video metadata (if not already available) from `/api/videos/meta?video_url=...` to check if its duration is <= 45 minutes.
  - An error message will be displayed for each failed validation step.

## 10. Error Handling

- **API Fetch Errors**: If `useInfiniteQuery` or `useQuery` fail, the UI will display an error message with a "Retry" button.
- **Empty States**: If the API returns no videos (either initially or after filtering), an `EmptyState` component will be rendered with an informative message.
- **Generation Errors**: If the `useMutation` for summary generation fails, a descriptive error toast will be displayed to the user (e.g., "Failed to generate summary: Video has no captions."). The UI state will revert to its pre-action state.

## 11. Implementation Steps

1.  **Create File Structure**:
    - Create `src/pages/videos.astro`.
    - Create a new folder `src/components/views/videos/`.
    - Create files for each component: `VideosView.tsx`, `VideosFilterBar.tsx`, `VideosGrid.tsx`, `VideoCard.tsx`, and `GenerateSummaryDialog.tsx`.

2.  **Develop `VideosPage.astro`**:
    - Set up the page layout using the main `Layout.astro`.
    - Import and render `<VideosView client:load />`.

3.  **Implement `useVideos` Hook**:
    - Set up `useInfiniteQuery` for fetching videos from `/api/videos`. Implement `getNextPageParam` based on the API's offset pagination.
    - Add `useQuery` to fetch user channels from `/api/profile`.
    - Implement `useState` for `filters` and `selectedVideo`.
    - Create placeholder functions for the generation mutation.

4.  **Build View Components**:
    - Implement `VideosView` to call the `useVideos` hook and render the layout.
    - Build `VideosFilterBar`, passing props from the hook.
    - Build `VideosGrid` and `VideoCard`, rendering the data from the hook.
    - Implement the infinite scroll logic in `VideosGrid` using `react-intersection-observer`.

5.  **Implement Generation Flow**:
    - Add `useMutation` to the `useVideos` hook for the `POST /api/summaries` call. Configure `onSuccess` to invalidate the `['videos']` query.
    - Build the `GenerateSummaryDialog` component.
    - Wire up the "Generate" button in `VideoCard` to open the dialog with the correct video.
    - In the dialog, implement the logic to call the validation endpoints (`/api/summaries/status` and `/api/videos/meta`) before enabling the confirm button.
    - Connect the "Confirm" button to the `generateSummary` mutation function.

6.  **Add Loaders, Empty States, and Error Handling**:
    - Integrate skeleton loaders for the initial data fetch.
    - Add a loading spinner for fetching subsequent pages.
    - Implement the `EmptyState` component for when no videos are available.
    - Add UI to display errors if API calls fail.
    - Use the `sonner` library for toast notifications on generation success or failure.

7.  **Styling and Final Touches**:
    - Apply Tailwind CSS classes to all components for a polished look and feel, consistent with the rest of the application.
    - Ensure the layout is fully responsive.
    - Perform manual testing of all user flows.
