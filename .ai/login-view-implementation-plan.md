# Login View Implementation Plan

## 1. Overview

The Login view is a public-facing page that allows registered users to authenticate into the YTInsights application using their email and password credentials. Upon successful authentication, users receive session tokens and are redirected to the main dashboard. The view emphasizes security, accessibility, and user experience with clear error messaging and validation feedback.

## 2. View Routing

- **Path:** `/login`
- **Access:** Public (unauthenticated users only)
- **Redirect Logic:** 
  - If user is already authenticated → redirect to `/dashboard`
  - After successful login → redirect to `/dashboard`
  - From protected routes without authentication → redirect to `/login` with return URL parameter

## 3. Component Structure

```
LoginPage (Astro)
└── LoginView (React)
    ├── LoginForm (React)
    │   ├── EmailInput (shadcn/ui Input)
    │   ├── PasswordInput (shadcn/ui Input)
    │   ├── SubmitButton (shadcn/ui Button)
    │   └── FormErrorMessage (React)
    ├── NavigationLinks (React)
    │   ├── Link to /register
    │   └── Link to /reset-password
    └── ToastNotifications (shadcn/ui Toast)
```

## 4. Component Details

### LoginPage (Astro Component)

- **Description:** The main page component that serves as the entry point for the login route. It handles server-side authentication checks and renders the React LoginView component.
- **Main HTML Elements:** 
  - `<Layout>` wrapper with page metadata
  - Client-side `<LoginView>` component with `client:load` directive
- **Handled Events:** None (static wrapper)
- **Validation Conditions:** 
  - Server-side: Check if user is already authenticated via middleware
  - If authenticated, redirect to `/dashboard`
- **Types:** None specific to this component
- **Props:** None

### LoginView (React Component)

- **Description:** The main container component for the login functionality. Manages the overall state of the login process, including form submission, error handling, and navigation after successful authentication.
- **Main HTML Elements:**
  - `<div>` with centered layout styling (Tailwind: `flex min-h-screen items-center justify-center`)
  - `<Card>` component from shadcn/ui for form container
  - `<CardHeader>`, `<CardContent>`, `<CardFooter>` for structure
  - Heading with application branding
- **Handled Events:**
  - `onLoginSuccess`: Handles successful authentication and redirect
  - `onLoginError`: Manages error states and displays toast notifications
- **Validation Conditions:** None directly (delegated to LoginForm)
- **Types:** 
  - `LoginFormData`
  - `AuthResponse`
  - `ApiError`
- **Props:** None

### LoginForm (React Component)

- **Description:** The form component that handles user input for email and password. Implements real-time validation, form state management, and submission logic. Communicates with the API endpoint and manages loading states.
- **Main HTML Elements:**
  - `<form>` element with `onSubmit` handler
  - Email and password input fields
  - Submit button with loading state
  - Error message display area
- **Handled Events:**
  - `onSubmit`: Form submission with validation
  - `onChange`: Real-time input validation and error clearing
  - `onBlur`: Field-level validation on focus loss
- **Validation Conditions:**
  - **Email validation:**
    - Required field: "Email is required"
    - Valid email format: "Please enter a valid email address"
    - Pattern: RFC 5322 compliant email regex
  - **Password validation:**
    - Required field: "Password is required"
    - Minimum length 8 characters: "Password must be at least 8 characters"
  - **Form-level validation:**
    - All fields must be valid before submission
    - Display field-specific errors below each input
    - Disable submit button while submitting
- **Types:**
  - `LoginFormData`
  - `LoginFormErrors`
  - `LoginRequest`
  - `AuthResponse`
  - `ApiError`
- **Props:**
  ```typescript
  interface LoginFormProps {
    onSuccess: (response: AuthResponse) => void;
    onError: (error: ApiError) => void;
  }
  ```

### EmailInput (shadcn/ui Input)

- **Description:** Text input field for email address with label, error state styling, and accessibility attributes.
- **Main HTML Elements:**
  - `<Label>` with `htmlFor` attribute
  - `<Input>` with type="email"
  - Error message text (conditional)
- **Handled Events:**
  - `onChange`: Update email state
  - `onBlur`: Trigger email validation
- **Validation Conditions:**
  - Required field
  - Valid email format (HTML5 email validation + custom regex)
- **Types:** `string`
- **Props:**
  ```typescript
  interface EmailInputProps {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    error?: string;
    disabled?: boolean;
  }
  ```

### PasswordInput (shadcn/ui Input)

- **Description:** Password input field with label, toggle visibility option, error state styling, and accessibility attributes.
- **Main HTML Elements:**
  - `<Label>` with `htmlFor` attribute
  - `<Input>` with type="password"
  - Optional: Eye icon button for show/hide password
  - Error message text (conditional)
- **Handled Events:**
  - `onChange`: Update password state
  - `onBlur`: Trigger password validation
  - `onToggleVisibility`: Switch between password/text input type
- **Validation Conditions:**
  - Required field
  - Minimum 8 characters length
- **Types:** `string`
- **Props:**
  ```typescript
  interface PasswordInputProps {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    error?: string;
    disabled?: boolean;
    showToggle?: boolean;
  }
  ```

### SubmitButton (shadcn/ui Button)

- **Description:** Submit button for the login form with loading state and disabled state management.
- **Main HTML Elements:**
  - `<Button>` with type="submit"
  - Loading spinner (conditional)
  - Button text: "Sign In" or "Signing In..."
- **Handled Events:**
  - `onClick`: Handled by form submission
- **Validation Conditions:**
  - Disabled when form is invalid
  - Disabled when submission is in progress
- **Types:** None
- **Props:**
  ```typescript
  interface SubmitButtonProps {
    isLoading: boolean;
    isDisabled: boolean;
  }
  ```

### NavigationLinks (React Component)

- **Description:** Navigation links to related authentication pages (registration and password reset).
- **Main HTML Elements:**
  - Container `<div>` with flex layout
  - `<a>` or Next.js `<Link>` components
  - Separator text ("or", "•")
- **Handled Events:** None (standard link navigation)
- **Validation Conditions:** None
- **Types:** None
- **Props:** None

### FormErrorMessage (React Component)

- **Description:** Reusable component for displaying form-level error messages (e.g., authentication errors from API).
- **Main HTML Elements:**
  - `<div>` with error styling (red background, border)
  - Error icon
  - Error text
- **Handled Events:** None
- **Validation Conditions:** None
- **Types:** `ApiError`
- **Props:**
  ```typescript
  interface FormErrorMessageProps {
    error: ApiError | null;
    onDismiss?: () => void;
  }
  ```

## 5. Types

### Existing Types (from `src/types.ts`)

```typescript
// Request type
interface LoginRequest {
  email: string;
  password: string;
}

// Response type
interface AuthResponse {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

// Error type
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

### New Types Required

```typescript
// Form data type (matches LoginRequest but can be extended with UI-specific fields)
interface LoginFormData {
  email: string;
  password: string;
}

// Form validation errors type
interface LoginFormErrors {
  email?: string;
  password?: string;
  form?: string; // General form-level errors
}

// Form state type
interface LoginFormState {
  data: LoginFormData;
  errors: LoginFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// API response union type for type safety
type LoginApiResponse = AuthResponse | ApiError;

// Error codes from API (for type-safe error handling)
type LoginErrorCode = 
  | 'INVALID_INPUT'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

// Toast notification type
interface ToastNotification {
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}
```

## 6. State Management

### Local Component State (React useState)

The LoginForm component manages its own state without requiring external state management libraries:

```typescript
// Form data state
const [formData, setFormData] = useState<LoginFormData>({
  email: '',
  password: '',
});

// Form errors state
const [errors, setErrors] = useState<LoginFormErrors>({});

// Submission state
const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

// API error state (for displaying server-side errors)
const [apiError, setApiError] = useState<ApiError | null>(null);
```

### State Update Functions

```typescript
// Update individual field
const updateField = (field: keyof LoginFormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear field error when user starts typing
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }
  // Clear API error when user modifies form
  if (apiError) {
    setApiError(null);
  }
};

// Validate field
const validateField = (field: keyof LoginFormData): string | undefined => {
  const value = formData[field];
  
  if (field === 'email') {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
  }
  
  if (field === 'password') {
    if (!value) return 'Password is required';
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
  }
  
  return undefined;
};

// Validate entire form
const validateForm = (): boolean => {
  const newErrors: LoginFormErrors = {
    email: validateField('email'),
    password: validateField('password'),
  };
  
  setErrors(newErrors);
  return !newErrors.email && !newErrors.password;
};
```

### No Custom Hook Required

Given the simplicity of the login form, a custom hook is not necessary. All state management can be handled within the LoginForm component. However, if form logic needs to be reused or becomes more complex, consider extracting it into a `useLoginForm` custom hook.

### Session Management

After successful login, session tokens should be stored securely:

```typescript
// Store session in httpOnly cookie (handled by API response headers)
// OR store in localStorage/sessionStorage (less secure, but simpler for MVP)
const storeSession = (session: AuthResponse['session']) => {
  localStorage.setItem('access_token', session.access_token);
  localStorage.setItem('refresh_token', session.refresh_token);
  localStorage.setItem('expires_at', session.expires_at.toString());
};
```

**Note:** For production, consider using httpOnly cookies for token storage to prevent XSS attacks. This can be implemented via middleware that sets cookies based on API response.

## 7. API Integration

### Endpoint Details

- **Method:** POST
- **Path:** `/api/auth/login`
- **Request Type:** `LoginRequest`
- **Response Type:** `AuthResponse` (success) or `ApiError` (failure)

### API Call Implementation

Create an API client function in `src/lib/api.ts`:

```typescript
/**
 * Authenticates a user with email and password
 * @param credentials - User login credentials
 * @returns AuthResponse with user and session data
 * @throws ApiError on failure
 */
export async function loginUser(
  credentials: LoginRequest
): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    // Response is ApiError
    throw data as ApiError;
  }

  // Response is AuthResponse
  return data as AuthResponse;
}
```

### Usage in LoginForm Component

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate form
  if (!validateForm()) {
    return;
  }
  
  setIsSubmitting(true);
  setApiError(null);
  
  try {
    const response = await loginUser(formData);
    
    // Store session tokens
    storeSession(response.session);
    
    // Call success callback
    onSuccess(response);
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
    
  } catch (error) {
    // Handle API errors
    const apiError = error as ApiError;
    setApiError(apiError);
    onError(apiError);
    
    // Show toast notification
    showToast({
      type: 'error',
      message: apiError.error.message,
    });
    
  } finally {
    setIsSubmitting(false);
  }
};
```

### Request Type

```typescript
LoginRequest {
  email: string;      // User's email address
  password: string;   // User's password (min 8 characters)
}
```

### Response Type (Success)

```typescript
AuthResponse {
  user: {
    id: string;              // UUID
    email: string;           // User's email
    created_at: string;      // ISO 8601 timestamp
  };
  session: {
    access_token: string;    // JWT access token
    refresh_token: string;   // JWT refresh token
    expires_at: number;      // Unix timestamp
  };
}
```

### Response Type (Error)

```typescript
ApiError {
  error: {
    code: LoginErrorCode;           // Error code for programmatic handling
    message: string;                 // Human-readable error message
    details?: Record<string, any>;  // Optional validation details
  };
}
```

## 8. User Interactions

### 1. Page Load
- **Action:** User navigates to `/login`
- **Expected Outcome:**
  - Page renders with empty login form
  - Email field is focused automatically (accessibility)
  - If user is already authenticated, redirect to `/dashboard`

### 2. Email Input
- **Action:** User types in email field
- **Expected Outcome:**
  - Email value updates in real-time
  - If field has validation error, error clears on first keystroke
  - API error message (if present) clears when user modifies form

### 3. Email Field Blur
- **Action:** User tabs out or clicks away from email field
- **Expected Outcome:**
  - Field-level validation triggers
  - If invalid, error message appears below input
  - Input border changes to red (error state)

### 4. Password Input
- **Action:** User types in password field
- **Expected Outcome:**
  - Password value updates in real-time
  - Characters are masked by default
  - If field has validation error, error clears on first keystroke
  - API error message (if present) clears when user modifies form

### 5. Toggle Password Visibility (Optional)
- **Action:** User clicks eye icon button
- **Expected Outcome:**
  - Password text toggles between masked and visible
  - Icon changes (eye → eye-slash)
  - ARIA label updates for screen readers

### 6. Password Field Blur
- **Action:** User tabs out or clicks away from password field
- **Expected Outcome:**
  - Field-level validation triggers
  - If invalid, error message appears below input
  - Input border changes to red (error state)

### 7. Form Submission (Valid)
- **Action:** User clicks "Sign In" button or presses Enter
- **Expected Outcome:**
  - Client-side validation runs
  - Submit button shows loading state ("Signing In...")
  - Submit button and inputs are disabled
  - API request sent to `/api/auth/login`
  - On success:
    - Session tokens stored securely
    - Success toast notification (optional)
    - Redirect to `/dashboard`

### 8. Form Submission (Invalid)
- **Action:** User clicks "Sign In" with invalid/empty fields
- **Expected Outcome:**
  - Client-side validation runs
  - Error messages appear below invalid fields
  - Form does not submit
  - First invalid field receives focus
  - Submit button remains enabled for retry

### 9. Form Submission (API Error - Invalid Credentials)
- **Action:** API returns 401 Unauthorized
- **Expected Outcome:**
  - Error message displays: "Invalid email or password"
  - Error toast notification appears
  - Submit button returns to normal state
  - Form remains populated (user doesn't need to retype)
  - Password field is cleared for security (optional)

### 10. Form Submission (API Error - Rate Limited)
- **Action:** API returns 429 Too Many Requests
- **Expected Outcome:**
  - Error message displays: "Too many login attempts. Please try again later."
  - Error toast notification appears with duration
  - Submit button is disabled for cooldown period
  - Timer shows when user can retry (optional enhancement)

### 11. Form Submission (Network Error)
- **Action:** Network request fails
- **Expected Outcome:**
  - Error message displays: "Network error. Please check your connection."
  - Error toast notification appears
  - Submit button returns to normal state
  - Retry button appears (optional)

### 12. Navigation to Register
- **Action:** User clicks "Don't have an account? Sign up"
- **Expected Outcome:**
  - Navigate to `/register`
  - Form state is not preserved

### 13. Navigation to Password Reset
- **Action:** User clicks "Forgot password?"
- **Expected Outcome:**
  - Navigate to `/reset-password`
  - Form state is not preserved

### 14. Keyboard Navigation
- **Action:** User navigates using Tab key
- **Expected Outcome:**
  - Focus moves in logical order: Email → Password → Submit → Links
  - Focus indicators are clearly visible
  - Enter key submits form when focus is on submit button

## 9. Conditions and Validation

### Client-Side Validation

#### Email Field Validation
- **Component:** EmailInput
- **Trigger:** onChange (clear errors), onBlur (validate), onSubmit (validate)
- **Conditions:**
  1. **Required:** Email field must not be empty
     - Error: "Email is required"
     - UI State: Red border, error text below input
  2. **Format:** Email must match valid email pattern
     - Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
     - Error: "Please enter a valid email address"
     - UI State: Red border, error text below input
- **Impact on UI:**
  - Invalid state: Red border (`border-red-500`), error text in red
  - Valid state: Default border, no error text
  - Submit button: Disabled if email is invalid

#### Password Field Validation
- **Component:** PasswordInput
- **Trigger:** onChange (clear errors), onBlur (validate), onSubmit (validate)
- **Conditions:**
  1. **Required:** Password field must not be empty
     - Error: "Password is required"
     - UI State: Red border, error text below input
  2. **Minimum Length:** Password must be at least 8 characters
     - Error: "Password must be at least 8 characters"
     - UI State: Red border, error text below input
- **Impact on UI:**
  - Invalid state: Red border, error text in red
  - Valid state: Default border, no error text
  - Submit button: Disabled if password is invalid

#### Form-Level Validation
- **Component:** LoginForm
- **Trigger:** onSubmit
- **Conditions:**
  1. **All Fields Valid:** Both email and password must pass validation
  2. **No Empty Fields:** No field can be empty
- **Impact on UI:**
  - Invalid form: Submit button disabled, error messages shown
  - Valid form: Submit button enabled
  - During submission: All inputs and button disabled, loading spinner

### Server-Side Validation (via API)

#### Authentication Validation
- **Component:** LoginForm
- **Trigger:** After API response
- **Conditions:**
  1. **Invalid Credentials (401):**
     - Error Code: `INVALID_CREDENTIALS`
     - Message: "Invalid email or password"
     - UI State: Form-level error message, error toast
  2. **Missing Fields (400):**
     - Error Code: `INVALID_INPUT`
     - Message: "Missing or invalid email or password"
     - UI State: Form-level error message with validation details
  3. **Rate Limited (429):**
     - Error Code: `RATE_LIMIT_EXCEEDED`
     - Message: "Too many login attempts. Please try again later."
     - UI State: Form-level error, submit button disabled, retry after timer
  4. **Server Error (500):**
     - Error Code: `INTERNAL_ERROR`
     - Message: "An unexpected error occurred"
     - UI State: Form-level error message, error toast
- **Impact on UI:**
  - Error messages displayed above form or as toast
  - Form remains enabled for retry (except for rate limiting)
  - Focus returns to first field for correction

### Middleware Authentication Check
- **Component:** LoginPage (Astro)
- **Trigger:** Server-side on page load
- **Conditions:**
  1. **Already Authenticated:** User has valid session
     - Action: Redirect to `/dashboard`
     - UI State: No login form shown, immediate redirect
- **Impact on UI:**
  - Prevents authenticated users from seeing login page
  - Improves UX by not showing unnecessary login form

## 10. Error Handling

### Client-Side Errors

#### 1. Validation Errors
- **Cause:** User input doesn't meet validation criteria
- **Handling:**
  - Display inline error message below the invalid field
  - Style input with error state (red border)
  - Prevent form submission
  - Scroll to first error (if multiple)
  - Announce error to screen readers via ARIA live region
- **User Recovery:** User corrects input and resubmits

#### 2. Empty Form Submission
- **Cause:** User tries to submit without filling required fields
- **Handling:**
  - Show "required" errors for all empty fields
  - Focus first empty field
  - Keep submit button enabled for retry
- **User Recovery:** Fill required fields and resubmit

### Network Errors

#### 1. Connection Failure
- **Cause:** No internet connection or server unreachable
- **Handling:**
  - Catch network exception in try-catch
  - Display error toast: "Network error. Please check your connection and try again."
  - Show retry button
  - Log error to console for debugging
- **User Recovery:** Check connection and click retry or resubmit form

#### 2. Timeout
- **Cause:** API request takes too long
- **Handling:**
  - Set timeout (e.g., 30 seconds) on fetch request
  - Display error toast: "Request timed out. Please try again."
  - Return form to enabled state
- **User Recovery:** Resubmit form

### API Errors

#### 1. Invalid Credentials (401)
- **Cause:** Email/password combination doesn't match any user
- **HTTP Status:** 401 Unauthorized
- **Error Code:** `INVALID_CREDENTIALS`
- **Handling:**
  - Display error message above form: "Invalid email or password"
  - Show error toast with same message
  - Keep form populated (don't clear fields)
  - Optionally clear password field for security
  - Don't reveal which field is incorrect (security best practice)
- **User Recovery:** 
  - Re-enter credentials and retry
  - Click "Forgot password?" link if needed

#### 2. Validation Error (400)
- **Cause:** Request payload fails server-side validation
- **HTTP Status:** 400 Bad Request
- **Error Code:** `INVALID_INPUT`
- **Handling:**
  - Parse validation details from error response
  - Map server validation errors to form fields
  - Display field-specific errors if available
  - Show general error message if field mapping fails
- **User Recovery:** Correct invalid fields and resubmit

#### 3. Rate Limit Exceeded (429)
- **Cause:** Too many failed login attempts from this IP/account
- **HTTP Status:** 429 Too Many Requests
- **Error Code:** `RATE_LIMIT_EXCEEDED`
- **Handling:**
  - Display prominent error message: "Too many login attempts. Please try again in 15 minutes."
  - Disable submit button
  - Show countdown timer (optional enhancement)
  - Check `Retry-After` header for cooldown duration
  - Store cooldown end time in localStorage to persist across page refreshes
- **User Recovery:** 
  - Wait for cooldown period to expire
  - Try "Forgot password?" if user is unsure of credentials

#### 4. Internal Server Error (500)
- **Cause:** Unexpected error on server (database down, etc.)
- **HTTP Status:** 500 Internal Server Error
- **Error Code:** `INTERNAL_ERROR`
- **Handling:**
  - Display generic error message: "An unexpected error occurred. Please try again later."
  - Show error toast
  - Log full error details to console
  - Don't expose internal error details to user (security)
  - Optionally send error report to monitoring service
- **User Recovery:** 
  - Wait a moment and retry
  - Contact support if error persists

### Edge Cases

#### 1. Session Already Exists
- **Cause:** User is already logged in
- **Handling:**
  - Middleware checks for existing session on page load
  - Automatically redirect to `/dashboard`
  - Don't show login form at all
- **User Recovery:** N/A (automatically handled)

#### 2. Concurrent Login Attempts
- **Cause:** User double-clicks submit button or submits from multiple tabs
- **Handling:**
  - Disable submit button immediately on first click
  - Ignore subsequent submissions while `isSubmitting` is true
  - Use loading state to indicate processing
- **User Recovery:** N/A (prevented by UI state)

#### 3. Browser Autofill
- **Cause:** Browser autofills credentials from password manager
- **Handling:**
  - Ensure inputs have proper `autocomplete` attributes
  - Support autofill by not blocking paste events
  - Validate on form submission, not just on user input
- **User Recovery:** N/A (should work seamlessly)

#### 4. JavaScript Disabled
- **Cause:** User has JavaScript disabled in browser
- **Handling:**
  - Provide `<noscript>` tag with message
  - Consider server-side form handling (optional for MVP)
- **User Recovery:** Enable JavaScript or use alternative method

### Error Logging

All errors should be logged for debugging and monitoring:

```typescript
const logError = (error: ApiError | Error, context: string) => {
  console.error(`[Login Error] ${context}:`, error);
  
  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    // sendToMonitoring(error, context);
  }
};
```

## 11. Implementation Steps

### Step 1: Set Up Page Structure
1. Create `/src/pages/login.astro`
2. Import Layout component
3. Add page metadata (title, description)
4. Set up responsive container with Tailwind classes
5. Add client-side React component mounting point with `client:load`

### Step 2: Create Type Definitions
1. Verify `LoginRequest` and `AuthResponse` exist in `src/types.ts`
2. Add new types to `src/types.ts`:
   - `LoginFormData`
   - `LoginFormErrors`
   - `LoginFormState`
   - `LoginErrorCode`
   - `ToastNotification`
3. Export all types for use in components

### Step 3: Implement API Client Function
1. Open or create `src/lib/api.ts`
2. Implement `loginUser()` function:
   - Accept `LoginRequest` parameter
   - Make POST request to `/api/auth/login`
   - Handle response parsing
   - Throw `ApiError` on failure
   - Return `AuthResponse` on success
3. Add JSDoc documentation
4. Export function

### Step 4: Create Session Management Utilities
1. Create `src/lib/auth.ts` (if not exists)
2. Implement `storeSession()` function:
   - Store access token, refresh token, and expiry
   - Use localStorage or cookies based on security requirements
3. Implement `getSession()` function:
   - Retrieve stored session
   - Check if session is expired
4. Implement `clearSession()` function:
   - Remove stored session data
5. Export utilities

### Step 5: Build Form Input Components
1. Create `src/components/auth/EmailInput.tsx`:
   - Use shadcn/ui Input component
   - Add Label component
   - Implement value, onChange, onBlur props
   - Add error message display
   - Style with Tailwind for error states
   - Add ARIA attributes for accessibility

2. Create `src/components/auth/PasswordInput.tsx`:
   - Similar to EmailInput
   - Add type="password"
   - Optional: Add toggle visibility button with eye icon
   - Implement show/hide password logic

### Step 6: Build Supporting Components
1. Create `src/components/auth/FormErrorMessage.tsx`:
   - Accept `error` prop of type `ApiError | null`
   - Conditionally render error alert
   - Style with red background, border, and icon
   - Add dismiss button (optional)

2. Create `src/components/auth/NavigationLinks.tsx`:
   - Add "Don't have an account? Sign up" link to `/register`
   - Add "Forgot password?" link to `/reset-password`
   - Style with Tailwind (text-sm, text-muted-foreground)

### Step 7: Implement LoginForm Component
1. Create `src/components/auth/LoginForm.tsx`
2. Set up component props interface (`LoginFormProps`)
3. Initialize state hooks:
   - `formData` state with useState
   - `errors` state with useState
   - `isSubmitting` state with useState
   - `apiError` state with useState
4. Implement validation functions:
   - `validateField(field)` for individual field validation
   - `validateForm()` for entire form validation
5. Implement event handlers:
   - `updateField(field, value)` for input changes
   - `handleFieldBlur(field)` for blur validation
   - `handleSubmit(e)` for form submission
6. Build JSX structure:
   - Form element with onSubmit handler
   - FormErrorMessage for API errors
   - EmailInput with props
   - PasswordInput with props
   - Submit Button with loading state
7. Add noValidate to form to use custom validation

### Step 8: Implement LoginView Container
1. Create `src/components/views/LoginView.tsx`
2. Set up container with Tailwind classes:
   - `min-h-screen flex items-center justify-center`
   - `bg-background` for theme support
3. Import and use shadcn/ui Card components:
   - `Card` as main container
   - `CardHeader` with title and description
   - `CardContent` with LoginForm
   - `CardFooter` with NavigationLinks
4. Implement success and error handlers:
   - `handleLoginSuccess(response)` - store session and redirect
   - `handleLoginError(error)` - show toast notification
5. Import and configure toast notifications

### Step 9: Create Astro Page Component
1. Open `/src/pages/login.astro`
2. Import Layout component
3. Add frontmatter script for middleware auth check:
   - Check if user is already authenticated
   - If yes, redirect to `/dashboard`
4. Import LoginView React component
5. Render LoginView with `client:load` directive
6. Add SEO metadata in Layout
7. Set page title: "Sign In | YTInsights"

### Step 10: Add Toast Notifications
1. Install/configure shadcn/ui Toast component (if not already)
2. Add ToastProvider to root layout or LoginView
3. Create useToast hook (from shadcn/ui)
4. Use toast in error handlers:
   ```typescript
   toast({
     variant: 'destructive',
     title: 'Login Failed',
     description: error.error.message,
   })
   ```

### Step 11: Implement Middleware Auth Check
1. Open or create `src/middleware/index.ts`
2. Add route-specific logic for `/login`:
   - Check for existing session in cookies/headers
   - If authenticated, return redirect to `/dashboard`
   - If not authenticated, continue to login page
3. Test redirect logic

### Step 12: Style and Polish UI
1. Ensure consistent spacing and sizing
2. Add focus states for keyboard navigation
3. Verify color contrast for accessibility (WCAG AA)
4. Add subtle animations (optional):
   - Fade in for error messages
   - Button loading spinner
5. Test responsive layout on mobile, tablet, desktop
6. Add hover states for interactive elements

### Step 13: Add Accessibility Features
1. Ensure all form inputs have associated labels
2. Add ARIA attributes:
   - `aria-required="true"` on required fields
   - `aria-invalid="true"` on fields with errors
   - `aria-describedby` linking inputs to error messages
   - `aria-live="polite"` for error announcements
3. Test keyboard navigation:
   - Tab order is logical
   - Enter key submits form
   - Focus indicators are visible
4. Test with screen reader (VoiceOver/NVDA)

### Step 14: Testing
1. **Manual testing:**
   - Test successful login flow
   - Test validation errors (empty fields, invalid email, short password)
   - Test API errors (wrong credentials, rate limiting)
   - Test keyboard navigation
   - Test on mobile devices
   - Test with autofill/password managers

2. **Unit tests (Vitest):**
   - Test validation functions
   - Test API client function with mocked fetch
   - Test form state management

3. **E2E tests (Playwright):**
   - Test complete login flow from page load to dashboard redirect
   - Test error scenarios
   - Test navigation to register and password reset

### Step 15: Security Hardening
1. Ensure passwords are never logged or exposed
2. Implement rate limiting feedback (countdown timer)
3. Clear password field after failed attempts (optional)
4. Add CSRF protection if using cookies
5. Verify HTTPS is enforced in production
6. Test against common vulnerabilities (XSS, CSRF)

### Step 16: Performance Optimization
1. Ensure LoginView React component is code-split
2. Lazy load toast notifications if not immediately needed
3. Optimize bundle size (check for unnecessary imports)
4. Add loading skeleton (optional enhancement)
5. Test performance with Lighthouse

### Step 17: Documentation
1. Add JSDoc comments to all functions
2. Document component props with TypeScript interfaces
3. Add inline code comments for complex logic
4. Update README with login flow documentation (if applicable)

### Step 18: Final Review
1. Review code against PRD requirements
2. Verify all user stories are satisfied (US-002)
3. Check coding conventions and style guidelines
4. Ensure proper error handling is in place
5. Verify all types are correctly defined
6. Run linters and fix issues
7. Perform final manual testing
8. Get code review from team member
9. Deploy to staging environment for testing
10. After approval, merge to main branch

---

**Estimated Implementation Time:** 6-8 hours for experienced developer

**Key Dependencies:**
- Astro 5 framework
- React 19
- shadcn/ui components (Button, Input, Label, Card, Toast)
- Tailwind CSS 4
- Existing API endpoint (`/api/auth/login`)
- Existing types in `src/types.ts`

**Testing Checklist:**
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials shows error
- [ ] Email validation works correctly
- [ ] Password validation works correctly
- [ ] Rate limiting is handled properly
- [ ] Network errors are handled gracefully
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility works
- [ ] Mobile responsive design works
- [ ] Already authenticated users redirect to dashboard
- [ ] Session is stored correctly after login
- [ ] Links to register and password reset work

