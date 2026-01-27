# Implementation Plan: Register View

## 1. Overview

The Register View is the user interface for new users to create an account in the VideoSummary application. It provides a form for entering email and password (with confirmation), handles validation, submits the registration request to the backend, and upon success, automatically logs the user in and redirects to the dashboard. The view ensures secure and user-friendly registration process, displaying appropriate feedback for errors and success.

## 2. View Routing

The view should be accessible at the path `/register`. This is a public route, not requiring authentication. Upon successful registration, redirect to `/dashboard`.

## 3. Component Structure

- RegisterView (main container component)
  - RegisterForm (handles form logic and submission)
    - EmailInput (shadcn/ui input for email)
    - PasswordInput (shadcn/ui input for password)
    - ConfirmPasswordInput (shadcn/ui input for password confirmation)
    - FormErrorMessage (custom component for displaying form errors)
    - Button (shadcn/ui submit button)
  - NavigationLinks (links to login page)
  - Toast notifications (via sonner for success/error messages)

High-level hierarchy:

```
RegisterView
├── RegisterForm
│   ├── EmailInput
│   ├── PasswordInput
│   ├── ConfirmPasswordInput
│   ├── FormErrorMessage
│   └── Button (Submit)
└── NavigationLinks
```

## 4. Component Details

### RegisterView

- **Component description**: The top-level component for the registration page. It renders the overall layout, includes the form, handles global state if needed, and manages redirects after successful registration. It integrates with the QueryProvider for any caching if applicable, but primarily focuses on rendering the form and handling authentication flow.

- **Main elements**:
  - Astro layout wrapper (Layout.astro)
  - Centered container div with Tailwind classes for responsiveness
  - RegisterForm as the main child
  - NavigationLinks below the form
  - Toast container (if not global)

- **Handled interactions**:
  - No direct interactions; delegates to RegisterForm
  - Post-submission redirect using Astro's navigation or React router if in SPA mode

- **Handled validation**:
  - None directly; relies on RegisterForm for client-side validation before API call
  - Ensures form is valid before submission

- **Types**:
  - Uses `RegisterFormState` for form state
  - `ToastNotification` for feedback

- **Props**:
  - None (standalone view component)

### RegisterForm

- **Component description**: Core form component that manages the registration form state, validation, submission to the API, and error handling. Uses React hooks for state and effects.

- **Main elements**:
  - Form element with onSubmit handler
  - Label and EmailInput for email field
  - Label and PasswordInput for password field
  - Label and ConfirmPasswordInput for password confirmation
  - FormErrorMessage for displaying overall form errors
  - Submit Button with loading state

- **Handled interactions**:
  - onSubmit: Validates form, calls API if valid, handles response
  - onChange: Updates form data and re-validates fields

- **Handled validation**:
  - Email: Required, valid email format (RFC 5322 compliant)
  - Password: Required, minimum 8 characters, at least one uppercase, one lowercase, one number
  - Confirm Password: Must match Password field
  - Form-level: All fields valid before submission
  - Client-side using Zod schema matching backend `RegisterRequestSchema`

- **Types**:
  - `RegisterFormData` for form values
  - `RegisterFormErrors` for error states
  - `RegisterFormState` for overall state
  - `RegisterRequest` for API payload

- **Props**:
  - `onSuccess?: () => void` (optional callback for redirect)
  - `initialData?: Partial<RegisterFormData>` (for pre-filling, though unlikely)

### EmailInput

- **Component description**: Reusable input component for the email field, integrated with shadcn/ui Input and Label.

- **Main elements**:
  - Label with "Email" text
  - Input field with type="email"
  - Error message display if invalid

- **Handled interactions**:
  - onChange: Updates parent form state
  - onBlur: Triggers validation

- **Handled validation**:
  - Required field
  - Valid email format (regex or Zod)

- **Types**:
  - Inherits from shadcn/ui Input props
  - Uses string for value

- **Props**:
  - `value: string`
  - `onChange: (value: string) => void`
  - `error?: string`
  - `disabled?: boolean`

### PasswordInput

- **Component description**: Input component for password, with visibility toggle if needed (using shadcn/ui).

- **Main elements**:
  - Label with "Password" text
  - Input field with type="password"
  - Optional eye icon for toggle
  - Error message if invalid

- **Handled interactions**:
  - onChange: Updates form state
  - onBlur: Validates

- **Handled validation**:
  - Required
  - Min length 8, uppercase, lowercase, number (via parent)

- **Types**:
  - string for value

- **Props**:
  - Similar to EmailInput: `value`, `onChange`, `error`, `disabled`

### ConfirmPasswordInput

- **Component description**: Similar to PasswordInput but for confirmation, validates match with password.

- **Main elements**:
  - Label "Confirm Password"
  - Input type="password"
  - Error if doesn't match

- **Handled interactions**:
  - onChange: Updates and validates match
  - onBlur: Validates match

- **Handled validation**:
  - Required
  - Matches password field value

- **Types**:
  - string

- **Props**:
  - `value: string`
  - `onChange: (value: string) => void`
  - `error?: string`
  - `passwordValue: string` (to check match)
  - `disabled?: boolean`

### FormErrorMessage

- **Component description**: Displays error messages for the entire form or specific fields.

- **Main elements**:
  - Alert or simple p tag with error text, styled red

- **Handled interactions**:
  - None (display only)

- **Handled validation**:
  - N/A

- **Types**:
  - `error?: string`

- **Props**:
  - `error: string`
  - `className?: string`

### NavigationLinks

- **Component description**: Provides link to login page for users who already have an account.

- **Main elements**:
  - Paragraph with "Already have an account?"
  - Link to /login

- **Handled interactions**:
  - onClick: Navigate to login (using Astro's A tag or Link)

- **Handled validation**:
  - N/A

- **Types**:
  - None specific

- **Props**:
  - None

## 5. Types

The view leverages existing types from `src/types.ts`. No entirely new types are required, but we define ViewModel extensions for the form:

- **RegisterFormData** (existing):
  - `email: string` - User's email address
  - `password: string` - User's password
  - Extends with `confirmPassword: string` for confirmation (added to form state, not sent to API)

- **RegisterFormErrors** (existing, extended):
  - `email?: string` - Email-specific errors (e.g., "Invalid email format")
  - `password?: string` - Password errors (e.g., "Password must be at least 8 characters")
  - `confirmPassword?: string` - Confirmation errors (e.g., "Passwords do not match")
  - `form?: string` - General form errors (e.g., API response errors)

- **RegisterFormState** (existing):
  - `data: RegisterFormData` - Current form values
  - `errors: RegisterFormErrors` - Current validation errors
  - `isSubmitting: boolean` - Loading state during submission
  - `isValid: boolean` - Overall form validity

- **RegisterRequest** (existing DTO):
  - `email: string`
  - `password: string` (confirmPassword stripped before sending)

- **AuthResponse** (existing response DTO):
  - `user: { id: string; email: string; created_at: string }`
  - `session: { access_token: string; refresh_token: string; expires_at: number }`

- **ApiError** (existing):
  - `error: { code: string; message: string; details?: Record<string, any> }`

- **ToastNotification** (existing):
  - `type: 'success' | 'error' | 'info'`
  - `message: string`
  - `duration?: number`

Custom hook will use these for type safety.

## 6. State Management

State is managed locally within the RegisterForm component using React's `useState` and `useEffect` for form data, errors, and submission status. No global state (e.g., Redux/Zustand) is needed as this is a self-contained auth flow.

A custom hook `useRegisterForm` will encapsulate the form logic:

- Purpose: Manages form state, validation, and submission.
- Usage: Called in RegisterForm to get state and handlers like `handleSubmit`, `handleInputChange`.
- Internals: Uses `useState` for data/errors/submitting, Zod for validation on change/submit.

For authentication persistence, after success, store session tokens in localStorage or cookies (handled by Supabase client), then redirect.

No QueryClient involvement unless caching auth state.

## 7. API Integration

Integrate with the `/api/auth/register` endpoint (POST).

- **Request**: Use `RegisterRequest` type. Body: `{ email, password }` (omit confirmPassword). Use `fetch` or Axios from `src/lib/api.ts` for the call, including headers if needed (e.g., Content-Type: application/json).

- **Response Handling**:
  - Success (201): `AuthResponse`. Extract session tokens, persist via Supabase `supabase.auth.setSession()`, show success toast, redirect to `/dashboard`.
  - Errors:
    - 400/422: `ApiError` with `INVALID_INPUT` or `VALIDATION_ERROR` - Update form errors.
    - 409: `ApiError` with `EMAIL_ALREADY_EXISTS` - Show form-level error "Email already registered".
    - 500: `ApiError` with `INTERNAL_ERROR` - Show generic error toast.

Implement rate limiting awareness: If `RATE_LIMIT_EXCEEDED`, show toast and disable form temporarily.

Use async/await in `handleSubmit` for clean error propagation.

## 8. User Interactions

- **Entering Email**: Type in EmailInput → real-time validation on change/blur, error shows if invalid.
- **Entering Password**: Type in PasswordInput → validation for strength, error if weak.
- **Confirming Password**: Type in ConfirmPasswordInput → checks match with password, error if mismatch.
- **Form Submission**: Click Submit Button or Enter key → if valid, shows loading, calls API; on success, success toast and redirect; on error, error toast or field errors.
- **Navigation to Login**: Click "Already have an account? Login" link → navigates to `/login` without submission.
- **Error Feedback**: Toasts for API errors, inline errors for validation.

All interactions are responsive, with focus management (e.g., error field focus on submit fail).

## 9. Conditions and Validation

- **Client-Side Validation** (RegisterForm):
  - Email: Required (`!value`), valid format (Zod.email()).
  - Password: Required, minLength(8), regex for uppercase/lowercase/number.
  - Confirm Password: Required, equals password value.
  - Affects UI: Disable submit if !isValid, show red borders/errors on invalid fields.

- **API Conditions Verification** (before submit):
  - Form isValid === true.
  - No ongoing submission (isSubmitting false).
  - If conditions fail, prevent submit, update errors.

- **Post-API**:
  - On 409 (email exists): Set form error, keep email field value but mark as invalid.
  - On rate limit: Set isSubmitting false, show toast, perhaps add cooldown.

Validation schema mirrors backend Zod schema for consistency.

## 10. Error Handling

- **Validation Errors**: Inline field errors via FormErrorMessage or Input error prop. Clear on input change.
- **API Errors**:
  - Network/500: Toast "Registration failed. Please try again." with INTERNAL_ERROR code.
  - 400/422: Map to field errors (e.g., invalid email → email error).
  - 409: Form-level error "An account with this email already exists. Please login."
  - Rate Limit: Toast "Too many attempts. Please wait before trying again.", disable form for 1-2 min.
- **Edge Cases**:
  - Empty form submit: All field errors show.
  - Weak password: Specific error message.
  - Success but redirect fail: Fallback alert.
- **Accessibility**: ARIA labels for errors, live regions for toasts.
- **Logging**: Log errors to console/dev tools without sensitive data (no passwords).

Use try-catch in handleSubmit for unhandled exceptions.

## 11. Implementation Steps

1. Create the file `src/components/views/RegisterView.tsx` as a React component.

2. Define the custom hook `useRegisterForm` in `src/hooks/useRegisterForm.ts` (or inline in component for simplicity), using useState for state, Zod for validation schema based on RegisterRequest.

3. Implement RegisterForm component with controlled inputs (EmailInput, PasswordInput, ConfirmPasswordInput), handling onChange/onBlur for validation.

4. Add FormErrorMessage component if not existing, or use shadcn Alert.

5. Integrate API call in handleSubmit: Construct RegisterRequest from form data (omit confirmPassword), POST to `/api/auth/register`, handle response as per integration section.

6. Add NavigationLinks with Astro's <A> or React Link to /login.

7. Wrap in RegisterView, add Tailwind classes for styling (centered form, responsive).

8. Add shadcn/ui Button with loading variant (using isSubmitting).

9. Integrate Sonner for toasts: Import useToast, call toast[type](message) on events.

10. Handle redirect: Use Astro's window.location or import { redirect } from 'astro:actions' if server-side, but since React, use useNavigate if router, else window.location.href = '/dashboard'.

11. Test: Unit tests for hook/validation, E2E for form submission/scenarios using Vitest/Playwright.

12. Ensure RLS and auth integration via Supabase client in api.ts.

13. Style with Tailwind: Match app theme, ensure mobile responsiveness (e.g., flex col on sm).

14. Add accessibility: Labels, aria-invalid on inputs, role="alert" for errors.
