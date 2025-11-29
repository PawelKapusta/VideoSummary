# Login View Components

This directory contains all authentication-related components for the Login view.

## Components

### EmailInput.tsx
Email input field with validation and error states.
- Auto-focus on mount for better UX
- Email format validation
- ARIA attributes for accessibility
- Error message display

### PasswordInput.tsx
Password input field with show/hide toggle.
- Toggle password visibility with Eye/EyeOff icons
- Minimum length validation (8 characters)
- ARIA attributes for accessibility
- Error message display

### LoginForm.tsx
Main login form component.
- Client-side validation (email format, password length)
- Form state management
- API integration via `loginUser()` function
- Loading states with spinner
- Error handling and display

### FormErrorMessage.tsx
Displays API errors in a user-friendly format.
- Animated fade-in effect
- Optional dismiss button
- ARIA live region for screen readers
- Details display for debugging

### NavigationLinks.tsx
Navigation links to related authentication pages.
- Link to registration page
- Link to password reset page
- Proper focus states for keyboard navigation

## Usage

```tsx
import LoginView from '@/components/views/LoginView';

// In Astro page
<LoginView client:load />
```

## Accessibility Features

- All inputs have associated labels
- ARIA attributes for required fields and errors
- Keyboard navigation support (Tab, Enter)
- Focus management on validation errors
- Screen reader announcements for errors
- Proper color contrast (WCAG AA compliant)

## Validation Rules

### Email
- Required field
- Must match valid email format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Password
- Required field
- Minimum 8 characters length

## API Integration

Uses the `loginUser()` function from `@/lib/api` which:
- Makes POST request to `/api/auth/login`
- Returns `AuthResponse` on success
- Throws `ApiError` on failure

Session tokens are stored via `storeSession()` from `@/lib/auth`.

## Error Handling

The form handles these error scenarios:
- Validation errors (inline field errors)
- Invalid credentials (401)
- Rate limiting (429)
- Network errors
- Server errors (500)

All errors are displayed both inline (FormErrorMessage) and as toast notifications.

