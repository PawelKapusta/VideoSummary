# Summaries List View Implementation Plan

## 1. Overview

The Summaries List View is a dedicated interface for displaying a list of generated summaries from the user's subscribed YouTube channels. It presents summaries as cards sorted chronologically by publication date, allowing users to view TL;DR previews, navigate to detailed views, hide individual summaries, and handle loading states. The view supports infinite scrolling for seamless pagination using React Query's useInfiniteQuery, loading batches of 20 summaries at a time. It includes filtering capabilities (by channel, status, and search by title) to help users find specific content quickly. Responsive design ensures mobile compatibility, with toast notifications for actions like hiding or filtering. This is a separate subpage accessible at /summaries.

## 2. View Routing

The view should be accessible at the path `/summaries`. Create a new Astro page at `src/pages/summaries.astro` that imports and renders the SummariesView component (client-side React). This aligns with the project structure for dedicated views, keeping the dashboard potentially for overview or other content.

## 3. Component Structure

- SummariesView (root component in `src/components/views/SummariesView.tsx`)
  - FilterPanel (UI for applying filters: channel dropdown, status select, search input)
  - SummaryList (container for summaries, handles infinite scroll and filtered fetching)
    - SummaryCard (individual summary preview card, multiple instances)
  - EmptyState (displayed when no summaries available after filters)
  - Toast notifications via Sonner (global, but triggered here)

The hierarchy focuses on a clean separation: SummariesView orchestrates data fetching with filters and state, FilterPanel handles user input for filters, SummaryList renders the grid or list of cards with infinite scroll, and each SummaryCard handles local interactions like hiding.

## 4. Component Details

### SummariesView

- **Component description**: The top-level React component for the summaries list page, responsible for fetching summaries data based on applied filters, managing global state (e.g., loading, error, current filters), rendering the filter panel, summary list or empty state, and handling navigation to detailed summary pages. It integrates with React Query for infinite data fetching and uses Shadcn/ui components for layout.
- **Main elements**: 
  - Main container div with Tailwind classes for full-width responsive layout.
  - Header section with page title (e.g., "Your Summaries") and summary count.
  - FilterPanel component for user inputs.
  - SummaryList component as the primary content area.
  - Conditional EmptyState if no data after filters.
  - Integrates Sonner for toast notifications.
- **Handled interactions**: 
  - Initial data load on mount with default filters.
  - Filter changes trigger refetch.
  - Error retries.
  - Navigation on card clicks (using Astro's client-side routing or React Router if extended).
- **Handled validation**: 
  - Ensures user is authenticated (handled by middleware, but check session).
  - Validates API response structure against PaginatedResponse<SummaryWithVideo>.
  - Handles pagination params (limit=20, offset based on infinite query).
  - Resets to page 1 on filter changes.
- **Types**: PaginatedResponse<SummaryWithVideo>, SummaryWithVideo, ToastNotification, FilterOptions.
- **Props**: None (self-contained, uses context for auth/userId).

### FilterPanel

- **Component description**: A component providing UI controls for filtering summaries, including a search input for title/keywords, dropdown for channel selection (from user's subscriptions), and select for status. It updates the filter state and triggers query refetch on changes.
- **Main elements**: 
  - Form-like container with Tailwind for horizontal layout on desktop, stacked on mobile.
  - Input from shadcn/ui for search (debounced).
  - Select for status (options: all, pending, in_progress, completed, failed).
  - Combobox or Select for channels (fetched from user's subscriptions via separate query).
  - Clear filters button.
  - Apply filters button (or auto-apply on change).
- **Handled interactions**: 
  - Input change: Debounce search and update filters.
  - Dropdown/Select change: Update channel_id or status filter.
  - Clear: Reset all filters and refetch.
  - Debounce: 300ms delay for search to avoid excessive API calls.
- **Handled validation**: 
  - Channel options limited to user's subscribed channels (validate against subscriptions API).
  - Status must match SummaryStatus enum.
  - Search string length min=3 for activation.
- **Types**: FilterOptions, SummaryStatus, Channel[] (for dropdown).
- **Props**: 
  - filters: FilterOptions
  - onFiltersChange: (filters: FilterOptions) => void
  - channels: Channel[] (user's subscribed channels)

### SummaryList

- **Component description**: A container component that renders a responsive grid or list of SummaryCard components based on fetched data. It manages infinite scrolling to load more batches of 20 summaries, applies current filters to the query, and handles loading skeletons during fetches or while scrolling.
- **Main elements**: 
  - Grid container using Tailwind (e.g., grid-cols-1 md:grid-cols-2 lg:grid-cols-3).
  - SummaryCard components mapped from flattened infinite query data.
  - Loading skeletons (SummaryCardSkeleton) for initial load, filtering, or infinite scroll.
  - IntersectionObserver sentinel at bottom for triggering next page fetch.
  - "No more summaries" message if !hasNextPage.
- **Handled interactions**: 
  - Infinite scroll: Observer detects viewport entry → fetchNextPage.
  - Filter updates from parent: Reset pages and refetch.
  - Refresh on pull-to-refresh (mobile) or manual button.
- **Handled validation**: 
  - Ensures data is array of SummaryWithVideo; fallback to empty if malformed.
  - Checks if pages.length > 0 and last page has full limit for hasNextPage.
  - Default params: include_hidden=false, sort="published_at_desc", limit=20.
- **Types**: SummaryWithVideo[], PaginationMeta, SummaryStatus, InfiniteData<PaginatedResponse<SummaryWithVideo>>.
- **Props**: 
  - data: InfiniteData<PaginatedResponse<SummaryWithVideo>> | undefined
  - isLoading: boolean
  - isFetchingNextPage: boolean
  - hasNextPage: boolean
  - fetchNextPage: () => void
  - error: string | null
  - refetch: () => void
  - filters: FilterOptions

### SummaryCard

- **Component description**: A card component displaying a single summary preview using Shadcn/ui Card. It shows video title, channel name, publish date, TL;DR, thumbnail, status badge, and user rating icons. Includes actions for hiding and quick rating.
- **Main elements**: 
  - Card from shadcn/ui with image (thumbnail), body (title, channel, date, TL;DR).
  - Badge for status (e.g., "completed", "failed").
  - Thumbs up/down icons for rating (clickable).
  - Hide button (icon or text) with confirmation dialog.
  - Link wrapper for navigation to /dashboard/[id].
- **Handled interactions**: 
  - Click card to navigate to detailed view.
  - Click rating icons to submit rating (optimistic update).
  - Click hide to confirm and call hide API (not specified, assume POST /api/summaries/hide).
  - Hover effects for interactivity.
- **Handled validation**: 
  - If status="failed", show error_code message instead of TL;DR.
  - Disable actions if status="pending" or "in_progress".
  - Ensure thumbnail_url is valid; fallback to placeholder.
- **Types**: SummaryWithVideo, SummaryStatus, SummaryErrorCode, RatingStats (for display).
- **Props**: 
  - summary: SummaryWithVideo
  - onHide: (id: string) => void
  - onRate: (id: string, rating: boolean) => void
  - onClick: (id: string) => void

### EmptyState

- **Component description**: A simple component shown when no summaries are available after applying filters, encouraging actions like subscribing to channels or manual generation, or adjusting filters.
- **Main elements**: 
  - Centered div with icon (e.g., empty box), heading ("No summaries match your filters"), description, and CTA buttons (e.g., "Clear Filters", "Subscribe to channels").
- **Handled interactions**: 
  - "Clear Filters" click: Reset filters and refetch.
  - CTA click: Navigate to profile/subscriptions page.
- **Handled validation**: None.
- **Types**: None specific.
- **Props**: 
  - message?: string (customizable, e.g., based on filters)
  - onClearFilters?: () => void

## 5. Types

All types leverage existing definitions from `src/types.ts`. No new database types needed, but the following are key for the view. Add a new type for filters:

- **FilterOptions** (new): 
  - search?: string (optional search term for title/channel, min length 3)
  - channel_id?: string (UUID of selected channel or null for all)
  - status?: SummaryStatus (selected status or undefined for all)
  - sort?: string (default 'published_at_desc'; options as per API)
  - include_hidden?: boolean (default false)

- **SummaryWithVideo** (existing): 
  - id: string (UUID of summary)
  - video: VideoBasic { id: string, youtube_video_id: string, title: string, thumbnail_url: string | null, published_at: string | null }
  - channel: Channel { id: string, name: string, youtube_channel_id: string, created_at: string }
  - tldr: string | null
  - status: SummaryStatus ('pending' | 'in_progress' | 'completed' | 'failed')
  - generated_at: string | null
  - user_rating: boolean | null (user's personal rating)

- **PaginatedResponse<SummaryWithVideo>** (existing, generic): 
  - data: SummaryWithVideo[]
  - pagination: PaginationMeta { total: number, limit: number, offset: number }

- **SummaryStatus** (existing enum): 'pending' | 'in_progress' | 'completed' | 'failed'

- **SummaryErrorCode** (existing enum): Used for failed states, e.g., 'NO_SUBTITLES' | 'VIDEO_TOO_LONG'

- **InfiniteData<PaginatedResponse<SummaryWithVideo>>** (from React Query): For useInfiniteQuery result, with pages: PaginatedResponse[] and pageParams.

For API requests (if adding hide/rate):
- HideRequest: { summary_id: string, hide: boolean } (for toggle)
- RateRequest: { rating: boolean }

Search filtering: Backend may need extension for search param; assume added as query param 'search' matching title or channel name.

## 6. State Management

State is managed using React Query (via QueryProvider in `src/components/providers/QueryProvider.tsx`) for server-state data fetching, caching, and synchronization. A custom hook `useSummaries` will encapsulate the infinite query logic with filter support:

- Purpose: Uses `useInfiniteQuery` to fetch paginated summaries in batches of 20, with default filters (include_hidden=false, sort='published_at_desc'). Supports dynamic filters by keying the query on filter values, resetting pages on filter changes.
- Usage: 
  ```tsx
  const { data, isLoading, error, fetchNextPage, hasNextPage, refetch, isFetching } = useSummaries(filters);
  // data?.pages.flatMap(p => p.data) for flattened list
  ```
- Key: Query key includes filters (e.g., ['summaries', filters]) to cache separately.
- Infinite Scroll: getNextPageParam from pagination.offset + limit < total.
- Local state (useState): For current filters (FilterOptions), updated via FilterPanel.
- Optimistic updates: For rating/hide actions to immediately reflect changes without refetch.
- Debouncing: Use useDebounce for search input to avoid rapid refetches.
- No global store needed beyond QueryClient; auth state from Supabase context. Fetch user's channels separately with useQuery for FilterPanel dropdown.

On filter change: Set filters state, which triggers query refetch and resets infinite pages.

## 7. API Integration

Integrate with the GET `/api/summaries` endpoint using fetch or Axios (via `src/lib/api.ts` utility). Extend backend if needed for 'search' param.

- **Request**: 
  - Method: GET
  - Headers: Authorization: Bearer <token> (from session)
  - Query Params: limit=20 (fixed batch size), offset= (calculated per page), channel_id (from filters), status (from filters), sort='published_at_desc' (from filters), include_hidden=false, search? (for title/channel fuzzy match, if backend supports)
  - Type: No body; validated via SummaryListFiltersSchema (backend, extend for search if needed)

- **Response**: 
  - Success (200): PaginatedResponse<SummaryWithVideo> – array of summaries with video/channel details, pagination meta.
  - Errors: ApiError { error: { code: string, message: string } } – e.g., 'INVALID_INPUT' (400), 'UNAUTHORIZED' (401), 'INTERNAL_ERROR' (500)
  - Handled in hook: isError state, show toast on failure. For infinite: Separate error for next pages.

For actions (hide/rate): Assume additional endpoints like POST `/api/summaries/hide` (body: { summary_id: string }), response: ApiSuccess<{ message: string }>. Invalidate queries post-action to refetch with current filters.

Separate query for channels: GET /api/profile/channels for FilterPanel dropdown.

## 8. User Interactions

- **Load Summaries Page**: On mount, fetch first batch of 20 summaries with default filters. Show skeletons during loading; error toast on failure.
- **Apply Filters**: Change search input (debounced) → Update filters → Refetch first page, reset infinite scroll. Select channel/status → Immediate refetch. Clear filters → Reset and refetch all.
- **Infinite Scroll**: As user scrolls to bottom, automatically fetch next batch if hasNextPage. Show loading indicator at bottom during fetchNextPage.
- **Click Summary Card**: Navigate to `/dashboard/[summaryId]` for details (using Astro's <Link> or window.location).
- **Rate Summary (Thumbs Up/Down)**: Click icon → Submit rating via API → Optimistic update user_rating in local data → Toast "Rating submitted" → Invalidate query to sync with filters.
- **Hide Summary**: Click hide icon → Show confirmation dialog ("Hide this summary?") → On confirm, POST to hide API → Optimistically remove from list (filter out if include_hidden=false) → Toast "Summary hidden" → Refetch if needed to maintain pagination.
- **Refresh**: Pull-to-refresh (mobile) or manual button → Call refetch() to reload with current filters.
- **Empty State Interaction**: If no results after filters, show EmptyState with "Clear Filters" button → Reset filters and refetch.
- **Mobile Responsiveness**: Filters collapse to drawer or accordion; cards stack vertically; touch-friendly scrolls and taps.

All interactions trigger toasts for feedback (success/error), e.g., "Applied filters: X results found".

## 9. Conditions and Validation

- **Authentication**: Verified by middleware; if unauth, redirect to login. Component checks session presence before queries.
- **Data Validation**: On API response, ensure data is PaginatedResponse<SummaryWithVideo>; type-guard and log malformed. For each card: If status='failed', display error_code; if no tldr, show placeholder.
- **Pagination/Infinite Scroll Conditions**: If total pages exhausted (!hasNextPage), hide loader and show "No more summaries". Load next only if current page has full 20 items.
- **Filter Conditions**: 
  - Search: Activate if length >=3; backend fuzzy matches title/channel.
  - Channel: Options from user's subscriptions (fetch and validate UUIDs); if invalid, ignore or error toast.
  - Status: Must be valid SummaryStatus; 'all' or undefined shows all.
  - On change: Reset offset to 0, refetch; if filters yield 0 results, show EmptyState.
- **Action Conditions**: Disable rate/hide if status !== 'completed'. For hide, only if !include_hidden; post-hide, refetch to exclude.
- **UI State Impact**: Loading (initial/filter) → Full skeletons; Fetching next → Bottom loader; Error → Retry button + toast per query type; Empty (filtered) → EmptyState with filter hints; Partial data → Show available cards, enable infinite if applicable.

These ensure UI reflects backend constraints, with filters preventing over-fetching irrelevant data.

## 10. Error Handling

- **Network/API Errors**: Catch in useInfiniteQuery error callbacks → Show toast with message (e.g., "Failed to load summaries: {error.message}"); provide retry button calling refetch. For next pages: Specific toast "Failed to load more, retry?".
- **Auth Errors (401)**: Redirect to login page; toast "Session expired, please log in." Invalidate all queries.
- **Validation Errors (400)**: For filters (e.g., invalid channel_id) → Toast from ApiError.details; reset invalid filter and log.
- **Empty/No Data**: After filters, render EmptyState with "No summaries match your criteria. Try adjusting filters." instead of error.
- **Failed Status Summaries**: Display error_code in card (e.g., "No subtitles available") without TL;DR; still allow hide/rate if applicable.
- **Infinite Scroll Errors**: If fetchNextPage fails, stop loading more and show message at bottom; user can manual refetch.
- **Offline/Edge Cases**: Use React Query's offline support; show cached data with "Using cached data (offline)" indicator; retry on reconnect.
- **Rate Limiting (429, if applicable)**: Toast "Too many requests, try again later" and disable refetch/filter changes temporarily (e.g., 30s).
- Global: Use React ErrorBoundary to catch render errors, falling back to error page with "Something went wrong, reload?".

All errors logged via `errorLogger` from lib/logger.ts; filter errors include current FilterOptions.

## 11. Implementation Steps

1. **Setup File Structure**: Create `src/components/views/SummariesView.tsx`; add `FilterPanel.tsx`, `SummaryList.tsx`, `SummaryCard.tsx`, `SummaryCardSkeleton.tsx`, `EmptyState.tsx` in `src/components/summaries/`. Create new Astro page `src/pages/summaries.astro` importing SummariesView.

2. **Create Custom Hook**: Implement `useSummaries` hook in `src/hooks/useSummaries.ts` using `useInfiniteQuery` with getNextPageParam: (lastPage, pages) => lastPage.pagination.offset + 20 < lastPage.pagination.total ? lastPage.pagination.offset + 20 : undefined. Query key: ['summaries', filters]. Default limit=20, include_hidden=false. Add separate `useUserChannels` for FilterPanel.

3. **Implement FilterPanel**: Use shadcn Input, Select, Combobox. Debounce search with useDebounce hook. On change, call onFiltersChange with updated FilterOptions. Fetch channels via useUserChannels.

4. **Implement EmptyState**: Functional component with Tailwind, icons, buttons for clear filters and CTA. Handle onClearFilters to reset state.

5. **Implement SummaryCard**: Use shadcn Card, Badge, Button. Handle clicks, ratings (optimistic + API call to /api/summaries/[id]/rate), hide (dialog via shadcn Dialog, API to /api/summaries/hide). Format dates.

6. **Implement SummaryList**: Flatten infinite data with data?.pages.flatMap(p => p.data) || []. Render cards/skeletons. Add ref={sentinel} div at bottom with useInView or IntersectionObserver to fetchNextPage. Show loader if isFetchingNextPage. Responsive grid.

7. **Integrate in SummariesView**: Use useState for filters (initial: {}), pass to useSummaries. Render FilterPanel, then SummaryList or EmptyState (check if flattened data.length === 0). Add header with active filters summary.

8. **Add Backend Extensions**: If needed, extend API for 'search' param (full-text search on title/channel). Implement rate/hide endpoints if missing, with invalidation.

9. **Styling and Responsiveness**: Tailwind mobile-first: Filters in collapsible sheet on small screens; infinite scroll smooth with padding. Test scroll behavior.

10. **Error and Loading States**: Skeletons for initial/filter loads (3-5 cards); bottom spinner for infinite. Toasts via Sonner for all states.

11. **Testing**: Vitest: Test hook with mocked queries, filter changes reset pages; component renders with data. Playwright E2E: Filter apply, infinite scroll to load 2+ pages, interactions.

12. **Optimization**: Memoize cards with React.memo, debounce filters (300ms). Virtualize list if >100 items (react-window). Ensure <500ms initial load, <200ms next pages.
