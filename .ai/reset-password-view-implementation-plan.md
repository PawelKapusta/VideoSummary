# View Implementation Plan: Reset Password

## 1. Overview

The Reset Password view provides a simple interface for users to initiate the password reset process by entering their email address. Upon submission, the system sends a time-limited, single-use reset link to the provided email. This view focuses on the initiation step, displaying a form for email input and providing user feedback via toasts. It ensures security by always showing success regardless of email existence to prevent account enumeration.

## 2. View Routing

The view should be accessible at the path `/reset-password`.

## 3. Component Structure

- ResetPasswordView (main Astro page component)
  - ResetPasswordForm (React form component)
  - SuccessMessage (conditional React component for post-submission feedback)

## 4. Component Details

### ResetPasswordView

- Component description: The main view component that renders the reset password page layout, including the form and any success messages. It uses an Astro layout and integrates the React form component.
- Main elements: Centered container with heading ("Reset Your Password"), subtext explaining the process, the ResetPasswordForm component, and conditional SuccessMessage.
- Handled interactions: None directly; delegates to child components.
- Handled validation: None; handled by ResetPasswordForm.
- Types: ToastNotification (for feedback).
- Props: None (top-level component).

### ResetPasswordForm

- Component description: A React form component that collects the user's email and handles submission to the reset password API endpoint. It includes input validation and manages loading states.
- Main elements: Email input field (using shadcn/ui Input), submit button (using shadcn/ui Button), form error message display (using shadcn/ui components).
- Handled interactions: Form submission (onSubmit event), input changes (onChange for email field).
- Handled validation: Email format validation (required, valid email syntax); client-side checks before API call to match ResetPasswordRequestSchema.
- Types: ResetPasswordRequest (API DTO), FormState (custom ViewModel for form data, errors, submitting status).
- Props: onSuccess (callback to show success message), setToast (function to display notifications).

### SuccessMessage

- Component description: A conditional component displayed after successful form submission, informing the user to check their email for the reset link.
- Main elements: Informational text with instructions, link back to login page.
- Handled interactions: Navigation to login on "Back to Login" click.
- Handled validation: None.
- Types: None specific.
- Props: None.

## 5. Types

The view reuses existing types from `src/types.ts` where possible:

- **ResetPasswordRequest**: `{ email: string }` - DTO for the API request body, ensuring the email is a valid string.

New or extended types for the view (add to `src/types.ts` or a view-specific file):

- **ResetFormData**: Extends the form state for UI-specific fields.
  - `email: string` - User's email address.
  - No additional fields beyond the DTO.

- **ResetFormErrors**: Validation error structure.
  - `email?: string` - Error message for invalid email format (e.g., "Please enter a valid email").
  - `form?: string` - General form-level error (e.g., submission failure).

- **ResetFormState**: Overall form management state.
  - `data: ResetFormData` - Current form values.
  - `errors: ResetFormErrors` - Validation or API errors.
  - `isSubmitting: boolean` - Indicates if the form is currently processing submission.
  - `isValid: boolean` - Derived boolean indicating if the form is valid for submission.

- **ToastNotification**: Reused from types.
  - `type: 'success' | 'error' | 'info'` - Notification type.
  - `message: string` - Display text.
  - `duration?: number` - Optional display duration in ms.

These types ensure type-safe handling of form state and API interactions, aligning with the tech stack's TypeScript usage.

## 6. State Management

State is managed locally within the ResetPasswordForm component using React's `useState` hook for simplicity, as this is a single-form view without complex global state needs. A custom hook `useResetPasswordForm` can be created to encapsulate form logic:

- Purpose: Manages form data, validation, submission state, and API integration.
- Usage: Returns an object with `formState`, `handleSubmit`, `handleInputChange`, `resetForm`, and `validateForm` functions.
- Integrates with `useToast` from shadcn/ui for notifications.
- No global state (e.g., Redux/Zustand) is required; leverages React Query or direct fetch for API calls if needed for caching (though not necessary here).

The parent ResetPasswordView uses minimal state to toggle visibility of SuccessMessage based on form submission success.

## 7. API Integration

Integrate with the POST `/api/auth/reset-password` endpoint using `fetch` or Axios for the HTTP request.

- **Request**: POST with JSON body of type `ResetPasswordRequest` ({ email: string }). Include Content-Type: application/json header. No authentication required (public endpoint).
- **Response Handling**:
  - Success (200 OK): `ApiSuccess<void>` - { message: "Password reset email sent" }. Always returned for security, even if email invalid/non-existent.
  - Errors: Though API always returns 200, handle potential 400 (INVALID_INPUT), 429 (RATE_LIMIT_EXCEEDED), 500 (INTERNAL_ERROR) from `ApiError`. Client-side validation prevents most 400s.
- Implementation: In `handleSubmit` of the custom hook, validate form, send request, show success toast on 200, handle errors with error toasts. Use try-catch for network errors.

## 8. User Interactions

- **Email Input**: User types email; real-time validation updates errors (green/red styling via Tailwind/shadcn).
- **Form Submission**: On button click (disabled during submitting), validate form, call API. Show loading spinner on button.
- **Success Feedback**: After API call, display success toast ("Password reset email sent. Check your inbox.") and show SuccessMessage component. Provide "Back to Login" link for navigation.
- **Error Feedback**: Invalid email shows inline error; API errors (rare) show toast (e.g., "Too many requests. Try again later." for 429).
- **Navigation**: Link from SuccessMessage navigates to `/login` using Astro's navigation or React Router if integrated.

All interactions use shadcn/ui components for consistent styling and accessibility (e.g., ARIA labels, keyboard navigation).

## 9. Conditions and Validation

- **Client-Side Validation** (in ResetPasswordForm):
  - Email required: Cannot submit if empty.
  - Email format: Must match standard email regex (e.g., Zod's email() validator, aligned with API's ResetPasswordRequestSchema).
  - Affects UI: Disable submit button if invalid; show error messages below input.
- **API Conditions** (verified before call):
  - Email non-empty and valid format to avoid 400.
  - Rate limiting handled server-side; client can add debounce on submit if needed.
- **Post-Submission**: No further conditions; always show success due to API behavior. Components update state: set submitting false, clear errors on success.
- Verification: Use Zod for schema validation in the custom hook's validateForm function, updating FormState.isValid accordingly.

These ensure the interface prevents invalid submissions and provides immediate feedback, improving UX.

## 10. Error Handling

- **Validation Errors**: Display inline messages for email issues; prevent submission.
- **Network/API Errors**:
  - 400: Show form-level error toast ("Invalid email. Please try again.").
  - 429: Show error toast ("Too many reset requests. Please wait before trying again.") with Retry-After header if available.
  - 500: Generic error toast ("Something went wrong. Please try again later.").
  - Network failure: Catch in try-catch, show "Connection error. Please check your internet." toast.
- **Edge Cases**:
  - Empty form submission: Blocked by validation.
  - Invalid email existence: Handled by API's always-success response; no user feedback on non-existence.
  - Accessibility: Ensure errors are announced via screen readers (shadcn/ui handles this).
- Logging: Use console.error for development; integrate with app's logger if available.
- Recovery: Provide "Back to Login" option on errors; reset form on dismiss.

## 11. Implementation Steps

1. Create the Astro page at `src/pages/reset-password.astro`: Import Layout, render ResetPasswordView as client:load.

2. Implement ResetPasswordView.tsx in `src/components/views/`: Use Tailwind for layout, include heading/subtext, render ResetPasswordForm and conditional SuccessMessage.

3. Create ResetPasswordForm.tsx in `src/components/auth/`: Use shadcn/ui Input and Button; implement form with useState or custom hook.

4. Develop custom hook `useResetPasswordForm.ts` in `src/hooks/`: Handle state, validation (Zod), submission with fetch to API, toast integration.

5. Add SuccessMessage.tsx in `src/components/auth/`: Simple informational component with navigation link.

6. Extend types in `src/types.ts`: Add ResetFormData, ResetFormErrors, ResetFormState.

7. Integrate toasts using shadcn/ui Sonner in the view.

8. Add client-side validation aligning with API schema; test form behaviors.

9. Ensure responsive design with Tailwind; test accessibility.

10. Update navigation: Add link from login page to `/reset-password` in LoginView.
