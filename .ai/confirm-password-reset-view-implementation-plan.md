# Confirm Password Reset View Implementation Plan

## 1. Overview

The Confirm Password Reset view allows users to set a new password after receiving and clicking a reset link sent to their email. This view is part of the password recovery flow, ensuring secure password updates with validation and one-time token usage. Upon successful reset, users are redirected to the login page.

## 2. View Routing

The view should be accessible at `/reset-password/confirm`. The route will extract a token parameter from the URL query (e.g., `/reset-password/confirm?token=abc123`) to verify the reset request.

## 3. Component Structure

- ResetPasswordConfirmView (main view component)
  - ResetPasswordForm (form container)
    - EmailInput (optional, for display or verification if needed)
    - PasswordInput (new password field)
    - ConfirmPasswordInput (password confirmation field)
    - FormErrorMessage (displays form-level errors)
    - SubmitButton (handles form submission)
  - SuccessMessage (displayed after successful reset)

The structure uses React components within an Astro page for interactivity.

## 4. Component Details

### ResetPasswordConfirmView

- Component description: Main container for the password reset confirmation process. Renders the form initially and switches to success message on completion. Extracts token from URL and manages overall state.
- Main elements: Div with centered form layout using Tailwind classes; conditional rendering of ResetPasswordForm or SuccessMessage; back link to login.
- Handled interactions: URL token parsing on mount; form submission trigger; success redirect after 3 seconds.
- Handled validation: Ensures token is present; delegates field validations to form; API-level token validation.
- Types: ConfirmResetPasswordRequest, ApiSuccess<void>, ApiError, ResetFormState (custom).
- Props: None (standalone view).

### ResetPasswordForm

- Component description: Handles the form for entering and confirming the new password. Includes inputs, validation, and submission logic.
- Main elements: Form element with onSubmit; PasswordInput and ConfirmPasswordInput as children; SubmitButton; FormErrorMessage for errors.
- Handled interactions: onSubmit event to call API; input changes to update state and validate.
- Handled validation: Password length >=8, contains uppercase/lowercase/number/special char; passwords match; token validity checked via API.
- Types: ConfirmResetPasswordRequest, ResetFormData, ResetFormErrors, ResetFormState.
- Props: onSubmit (callback), initialToken (string from parent), isSubmitting (boolean).

### PasswordInput

- Component description: Reusable input for password fields with strength validation indicator.
- Main elements: Label, Input (type="password"), error message span, strength meter (progress bar).
- Handled interactions: onChange to update value and validate strength.
- Handled validation: Min length 8, at least one uppercase, lowercase, number, special char.
- Types: string for value, boolean for hasError.
- Props: value (string), onChange (function), label (string), error (string), showStrength (boolean).

### ConfirmPasswordInput

- Component description: Input to confirm the new password, ensuring it matches the password field.
- Main elements: Similar to PasswordInput but without strength meter; error if mismatch.
- Handled interactions: onChange to check match with password field.
- Handled validation: Must exactly match password value.
- Types: string for value, string for passwordToMatch.
- Props: value (string), onChange (function), password (string), error (string).

### FormErrorMessage

- Component description: Displays error messages for the entire form or specific fields.
- Main elements: Alert component from shadcn/ui with error styling.
- Handled interactions: None (presentational).
- Handled validation: N/A.
- Types: string for message.
- Props: message (string), className (string).

### SubmitButton

- Component description: Button to submit the form, disabled during submission.
- Main elements: Button from shadcn/ui with loading spinner if submitting.
- Handled interactions: onClick triggers form submission.
- Handled validation: Disabled if form invalid or submitting.
- Types: boolean for isSubmitting.
- Props: onClick (function), disabled (boolean), children (string).

### SuccessMessage

- Component description: Displays success notification and handles redirect.
- Main elements: Alert with success icon; message about password reset and redirecting to login.
- Handled interactions: useEffect for auto-redirect after 3s.
- Handled validation: N/A.
- Types: None specific.
- Props: None.

## 5. Types

The view relies on existing types from `src/types.ts` and requires new ViewModel types for form state:

- **ConfirmResetPasswordRequest** (existing DTO): `{ token: string; password: string; }` - Token from URL, password from form.

- **ResetFormData** (new ViewModel): Extends form inputs.
  - `password: string` - New password.
  - `confirmPassword: string` - Confirmation of new password.

- **ResetFormErrors** (new ViewModel): Error states.
  - `password?: string` - Password-specific errors (e.g., "Password too weak").
  - `confirmPassword?: string` - Mismatch error (e.g., "Passwords do not match").
  - `form?: string` - General errors (e.g., "Invalid token").

- **ResetFormState** (new ViewModel): Overall form state.
  - `data: ResetFormData` - Form values.
  - `errors: ResetFormErrors` - Validation errors.
  - `isSubmitting: boolean` - Submission in progress.
  - `isValid: boolean` - Whether form passes all validations.

- **ApiSuccess<void>** (existing): `{ message?: string; }` - Success response with optional message.

- **ApiError** (existing): `{ error: { code: string; message: string; details?: Record<string, any>; } }` - Error response.

These types ensure type-safe handling of form data and API interactions.

## 6. State Management

State is managed locally within the ResetPasswordConfirmView using React's useState and useEffect hooks. No global state (e.g., Redux) is needed as this is a self-contained auth flow.

- `formState: ResetFormState` - Tracks form data, errors, submission status, and validity. Updated on input changes and submission.

- `showSuccess: boolean` - Toggles between form and success message.

A custom hook `useConfirmResetPasswordForm` will encapsulate form logic:

- Purpose: Manages form state, validation on change/blur, and submission handler.
- Usage: Returns `{ formState, handleSubmit, handleInputChange }` for use in the view component.
- Integrates with Zod for schema-based validation (password strength, match).

Token is extracted once on mount using `useSearchParams` from React and stored in state.

## 7. API Integration

Integrate with the POST `/api/auth/reset-password/confirm` endpoint using a new function in `src/lib/api.ts`: `confirmResetPassword(request: ConfirmResetPasswordRequest): Promise<ApiSuccess<void>>`.

- **Request**: Body `{ token: string (from URL), password: string (from form) }`. Headers: `'Content-Type': 'application/json'`.

- **Response Types**:
  - Success (200): `ApiSuccess<void>` with message "Password successfully reset".
  - Error (400/422/500): `ApiError` with codes like `INVALID_TOKEN`, `VALIDATION_ERROR`, `INTERNAL_ERROR`.

Use fetch in the API function, handle errors by throwing `ApiClientError`. In the component, call via the hook's submit handler, update state on success/error, and show toasts for feedback.

## 8. User Interactions

- **Token Extraction**: On page load, parse `?token=...` from URL. If missing/invalid, show error and redirect to login.

- **Password Entry**: User types new password in PasswordInput; strength indicator updates in real-time. Confirm in ConfirmPasswordInput; mismatch error shows immediately.

- **Form Submission**: Click SubmitButton or Enter key. Validates form client-side; if valid, sends API request. Button disables and shows spinner during submission.

- **Success Flow**: On API success, show SuccessMessage, clear form state, and auto-redirect to `/login` after 3 seconds. Optional manual "Go to Login" button.

- **Back Navigation**: Link or button to return to login page without submitting.

All interactions use shadcn/ui components for consistent styling and accessibility (e.g., ARIA labels on inputs).

## 9. Conditions and Validation

- **Token Presence**: Verified on mount in ResetPasswordConfirmView. If absent, set form error and disable submission.

- **Password Strength** (in PasswordInput and hook): Must be >=8 chars, include uppercase, lowercase, digit, special char. Use Zod schema in `useConfirmResetPasswordForm`. Invalid state shows error message and prevents submission (isValid=false).

- **Password Match** (in ConfirmPasswordInput): confirmPassword === password. Checked on change; error if mismatch, affects isValid.

- **API Conditions**: Token validity, expiration, single-use enforced server-side. Client verifies via response; on `INVALID_TOKEN`, show error toast and redirect.

- **Form Validity**: Aggregate of field validations. SubmitButton disabled if !isValid or isSubmitting. Affects interface by showing/hiding errors and enabling/disabling button.

These conditions ensure secure, user-friendly input before API call.

## 10. Error Handling

- **Client-Side Validation Errors**: Display inline errors via FormErrorMessage and field-specific spans. Prevent submission.

- **Network/API Errors**:
  - `INVALID_TOKEN` or `400`: Show toast "Invalid or expired reset link. Please request a new one." Redirect to login.
  - `VALIDATION_ERROR` or `422`: Update form errors with server messages (e.g., weak password).
  - `INTERNAL_ERROR` or `500`: Toast "Something went wrong. Please try again." No redirect.
  - Network failure: Toast "Connection error. Please check your internet." Retry option via button.

- **Edge Cases**:
  - Missing token: Toast "No reset link provided." Redirect immediately.
  - Token already used: Handled as INVALID_TOKEN.
  - Use Sonner for toasts with error type.

- **Loading States**: Spinner on submit; disable inputs during submission to prevent double-submit.

Log errors to console for debugging, but no user-facing stack traces.

## 11. Implementation Steps

1. Create new types in `src/types.ts`: Add ResetFormData, ResetFormErrors, ResetFormState interfaces.

2. Add `confirmResetPassword` function to `src/lib/api.ts`: Implement POST fetch to `/api/auth/reset-password/confirm`, handle responses/errors similar to existing auth functions.

3. Create custom hook `src/hooks/useConfirmResetPasswordForm.ts`: Use useState for formState, Zod for validation schema (password strength/match), handleSubmit async function calling API.

4. Create components in `src/components/auth/`:
   - PasswordInput.tsx: Input with validation and strength meter.
   - ConfirmPasswordInput.tsx: Similar, with match check.
   - Reuse/update existing FormErrorMessage.tsx and SuccessMessage.tsx if applicable.

5. Create main view `src/components/views/ResetPasswordConfirmView.tsx`: Extract token with useSearchParams, use hook for form, conditional render form/success, handle redirect with useEffect.

6. Create Astro page `src/pages/reset-password/confirm.astro`: Import and render ResetPasswordConfirmView as client:load component. Add meta tags for security (no-cache).

7. Update navigation if needed (e.g., links from email simulation in dev).

8. Test: Unit tests for hook/validation; E2E for full flow (mock API, check redirects/errors).

9. Style with Tailwind/shadcn: Ensure responsive, accessible (focus management, screen reader support).

10. Integrate toasts via existing provider; lint and type-check all new code.
