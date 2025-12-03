# View Implementation Plan: Profile

## 1. Overview

The Profile view provides users with a personal dashboard to manage their YouTube channel subscriptions and account settings. It displays a list of subscribed channels with options to remove them, enforces a limit of 10 channels, and includes a logout functionality. This view ensures users can easily oversee and adjust their subscriptions while maintaining account security through session management.

## 2. View Routing

The view should be accessible at the path `/profile`. This route will be implemented as an Astro page (`src/pages/profile.astro`) that renders the main ProfileView React component.

## 3. Component Structure

- ProfileView (main container)
  - Header (user info and logout)
  - SubscriptionList
    - SubscriptionTable
      - ChannelRow (for each channel)
  - AddChannelForm (optional, for adding new channels)
  - ChangePasswordForm (for password management, if extended)

High-level tree:
```
ProfileView
├── UserHeader
│   └── LogoutButton
├── SubscriptionSection
│   ├── SubscriptionTable
│   │   └── ChannelRow (xN)
│   └── AddChannelButton / AddChannelForm
└── ChangePasswordSection (future)
```

## 4. Component Details

### ProfileView

- Component description: The root component for the profile page, responsible for fetching and displaying user profile data, managing overall state, and coordinating child components for subscriptions and logout.
- Main elements: `<div>` container with Tailwind classes for layout (e.g., max-w-4xl mx-auto p-6), includes UserHeader, SubscriptionSection.
- Handled interactions: Renders child components; handles global loading and error states.
- Handled validation: Ensures user is authenticated (redirect if not); checks subscription count against limit before allowing adds.
- Types: UserProfile (from types.ts), ToastNotification for feedback.
- Props: None (top-level component).

### UserHeader

- Component description: Displays basic user information (email, join date) and provides access to logout functionality.
- Main elements: `<header>` with user avatar or icon, email display, join date, and LogoutButton.
- Handled interactions: Click on LogoutButton triggers logout.
- Handled validation: None specific; relies on parent auth check.
- Types: Partial<UserProfile> for email and created_at.
- Props: { profile: Partial<UserProfile>, onLogout: () => void }.

### LogoutButton

- Component description: A button that initiates the logout process, clearing the session and redirecting to login.
- Main elements: shadcn/ui Button component with "Logout" text and icon.
- Handled interactions: onClick calls logout hook/action, shows confirmation modal if needed.
- Handled validation: Confirm action to prevent accidental logout.
- Types: None specific.
- Props: { onConfirm: () => void }.

### SubscriptionSection

- Component description: Manages the display and interaction for user's subscribed channels, including adding and removing.
- Main elements: `<section>` with heading "Subscribed Channels", SubscriptionTable, and AddChannelButton.
- Handled interactions: Handles add/remove channel events, refreshes list after mutations.
- Handled validation: Prevents adding if count >= 10; validates channel URL format.
- Types: SubscriptionWithChannel[], SubscribeRequest for adds.
- Props: { profile: UserProfile, onAddChannel: (url: string) => void, onRemoveChannel: (id: string) => void }.

### SubscriptionTable

- Component description: Renders a responsive table of subscribed channels using shadcn/ui components.
- Main elements: shadcn/ui Table with headers (Channel Name, Subscribed Date, Actions), populated with ChannelRow components.
- Handled interactions: None direct; passes remove handler to rows.
- Handled validation: ARIA labels for accessibility; sortable by date if extended.
- Types: SubscriptionWithChannel[].
- Props: { channels: SubscriptionWithChannel[], onRemove: (id: string) => void }.

### ChannelRow

- Component description: Represents a single subscribed channel row in the table, with remove action.
- Main elements: `<tr>` with `<td>` for name, date, and delete button.
- Handled interactions: Click on delete button shows confirmation dialog, then calls remove.
- Handled validation: Confirm deletion to avoid mistakes.
- Types: SubscriptionWithChannel.
- Props: { channel: SubscriptionWithChannel, onRemove: (id: string) => void }.

### AddChannelForm

- Component description: Modal or inline form for adding a new YouTube channel via URL.
- Main elements: shadcn/ui Dialog with Input for URL, Button to submit.
- Handled interactions: onSubmit validates and calls add API.
- Handled validation: URL must be valid YouTube channel URL; check count < 10.
- Types: SubscribeRequest { channel_url: string }.
- Props: { isOpen: boolean, onClose: () => void, onSubmit: (url: string) => void }.

## 5. Types

All types leverage existing definitions from `src/types.ts`:

- UserProfile: Existing type with id, email, created_at, subscribed_channels (array of SubscriptionWithChannel), subscription_count.
  - SubscriptionWithChannel: { subscription_id: string, channel: Channel { id, youtube_channel_id, name, created_at }, subscribed_at: string }

New types for view-specific models (if needed, but minimal as existing suffice):

- ProfileViewModel: Extends UserProfile with UI flags.
  - Fields: { ...UserProfile, isLoading: boolean, error: string | null, showAddModal: boolean }
  - Purpose: Wraps data with loading/error states for the view.

- ChannelActionResult: For add/remove responses.
  - Fields: { success: boolean, message: string, channel?: Channel }
  - Types: boolean for success, string for message, optional Channel.

No major new DTOs; use SubscribeRequest for adds (though add endpoint not provided, assume similar to profile GET).

## 6. State Management

State is managed using React Query (TanStack Query) for data fetching and caching. The main ProfileView uses a custom hook `useProfile` that fetches UserProfile via GET /api/profile.

- Custom hook: useProfile() -> { data: UserProfile | undefined, isLoading, error, refetch }
- Local state: useState for modals (e.g., showConfirmDelete, showAddForm), form inputs.
- Mutations: useMutation for logout (supabase.auth.signOut), addChannel (POST /api/subscribe, assumed), removeChannel (DELETE /api/subscribe/:id, assumed).
- Global: QueryClientProvider wraps the app; invalidates profile queries on mutations.

No Redux/Zustand needed; React Query handles optimistic updates for removes.

## 7. API Integration

Integrate with GET /api/profile endpoint using React Query's useQuery.

- Request: GET /api/profile (no body, auth via cookie/session from Supabase).
- Response Type: UserProfile (success: 200), or ApiError (401 Unauthorized, 404 Not Found, 500 Internal Error).
- Implementation: In useProfile hook: queryKey: ['profile'], queryFn: async () => { const res = await fetch('/api/profile'); if (!res.ok) throw new Error(); return res.json() as UserProfile; }
- For mutations (add/remove): Separate useMutation hooks that call respective endpoints and invalidate ['profile'] query on success.
- Logout: Direct supabase.auth.signOut(), then navigate to /login.

## 8. User Interactions

- View Profile: On load, fetch and display profile data; if unauthenticated, redirect to /login.
- View Subscriptions: Render table with channels; if count == 0, show empty state.
- Add Channel: Click "Add Channel" button opens modal; input URL, submit -> validate, API call, refresh list, toast success/error.
- Remove Channel: Click delete icon in row -> confirmation dialog -> API call, remove from list optimistically, toast.
- Logout: Click logout button -> optional confirm -> signOut, redirect to /login, clear local state.
- All interactions use shadcn/ui for modals/toasts; responsive design with Tailwind.

## 9. Conditions and Validation

- Authentication: Verified on load via API; if 401, redirect to /login.
- Subscription Limit: Before showing Add button, check if subscription_count < 10; if ==10, disable button and show tooltip "Maximum 10 channels reached".
- Channel URL Validation: In AddChannelForm, use regex for YouTube channel URLs (e.g., /^https:\/\/(www\.)?youtube\.com\/channel\/[a-zA-Z0-9_-]+/); client-side only, server enforces.
- Remove Confirmation: Always show dialog: "Are you sure? This will stop generating summaries for this channel."
- Accessibility: ARIA labels on table (role="table"), buttons (aria-label for delete); keyboard navigation for modals.
- These conditions affect UI: Disable buttons, show messages/toasts, prevent invalid states.

## 10. Error Handling

- API Errors: Catch in queryFn/mutationFn; map to user-friendly messages (e.g., 401: "Please log in", 500: "Server error, try again"); display via toast (error type).
- Network Errors: React Query handles with isError state; show retry button in ProfileView.
- Validation Errors: For forms, use Zod or manual checks; display inline errors (e.g., "Invalid URL").
- Edge Cases: Empty subscriptions -> EmptyState component; No profile -> Create via service (backend handles); Rate limits -> Toast "Too many requests".
- Logging: Use console.error for dev; integrate with existing logger if available.
- Global: Use ErrorBoundary around view for uncaught errors, fallback UI.

## 11. Implementation Steps

1. Create `src/pages/profile.astro`: Import and render `<ProfileView client:load />` with layout.

2. Create main components in `src/components/views/ProfileView.tsx`: Implement ProfileView, UserHeader, LogoutButton using shadcn/ui.

3. Create subscription components: `SubscriptionSection.tsx`, `SubscriptionTable.tsx`, `ChannelRow.tsx` with Tailwind for styling.

4. Implement `AddChannelForm.tsx` as a Dialog; add URL validation.

5. Create custom hooks: `useProfile.ts` in `src/hooks/` using useQuery; `useLogout.ts` (existing or new) for signOut.

6. Add mutations: `useAddChannel.ts`, `useRemoveChannel.ts` (assume endpoints exist or implement stubs).

7. Integrate types: Import UserProfile, etc., from `src/types.ts`; define any new like ProfileViewModel.

8. Handle state: Use useState for modals; optimistic updates in mutations.

9. Add interactions: Event handlers for add/remove/logout; navigation with `useNavigate` from react-router or Astro's.

10. Implement validation/conditions: Check count for add button; confirm dialogs with shadcn Dialog.

11. Error handling: Toasts with sonner; error states in components.

12. Styling: Ensure responsive (mobile-friendly table or cards); accessibility attributes.

13. Test: Add unit tests for hooks/components (Vitest); E2E for flows (Playwright).

14. Integrate: Wrap in QueryProvider if not already; ensure auth middleware protects route.
