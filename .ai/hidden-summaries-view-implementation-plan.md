# Hidden Summaries View Implementation Plan

## 1. Overview
The Hidden Summaries View is a dedicated interface for users to manage content they have previously hidden from their main dashboard. It provides a central place to view hidden summaries, restore them individually, or restore all of them at once. This view is essential for the "Hidden" feature, ensuring transparency and control over what is visible in the main feeds.

## 2. View Routing
- **Path**: `/hidden`
- **Astro Page**: `src/pages/hidden.astro`
- **React Component**: `src/components/views/HiddenSummariesView.tsx`

## 3. Component Structure
- `HiddenSummariesView` (Main entry point)
  - `QueryProvider` (Ensures access to React Query)
  - `HiddenSummariesContent` (Core logic)
    - `FilterPanel` (Shared filtering component)
    - `Summary Items List`
      - `Unhide Confirmation Dialog`
    - `Unhide All Dialog`
    - `AppLoader` (Loading state)

## 4. Key Features & Interactions
### Unhide All
- Users can click "Unhide All" to restore all hidden summaries at once.
- Requires confirmation via a modal dialog to prevent accidental bulk restores.
- Synchronizes both `hiddenSummaries` and `summaries` queries in React Query.

### Individual Restore (Unhide)
- Each item has an "Unhide" button that opens a confirmation dialog.
- On confirm, sends a `DELETE` request to `/api/summaries/:id/hide`.
- Item is removed from the list with a success toast notification.

### Filtering
- Reuses the `FilterPanel` to allow users to search hidden summaries by title or filter by channel.
- Supports infinite scrolling/pagination to handle growing lists of hidden content.

### Navigation
- Each card is clickable, navigating the user to the summary details page (`/summaries/:id`).
- Includes a "Back" button to return to the previous page.

## 5. Technical Details
- **Data Fetching**: Uses custom hook `useHiddenSummaries` which internally calls the paginated API.
- **State Management**: 
  - `unhidingIds`: Tracking IDs currently being restored to show loading spinners on specific buttons.
  - `isUnhidingAll`: Tracking global restore status.
- **Status Badges**: Displays status (Completed, Failed, Pending) with consistent color coding from the main views.
- **Empty State**: Displays an illustrated message when no hidden summaries exist or filters yield no results.

## 6. API Integration
- `GET /api/summaries?include_hidden=true&hidden_only=true`: Fetching hidden summaries.
- `DELETE /api/summaries/:id/hide`: Restoring an individual summary.
- `POST /api/summaries/unhide-all`: Bulk restoration endpoint.
