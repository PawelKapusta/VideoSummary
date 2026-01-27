# Authentication & User Management Specification

## 1. Overview

This specification details the architecture for User Registration, Login, and Password Recovery functionalities for VideoSummary (YTInsightsapp). It aligns with US-001, US-002, US-003, and US-004 from the PRD and leverages the existing Tech Stack (Astro, React, Supabase).

**Goal**: Implement a secure, robust, and user-friendly authentication system using Supabase Auth, supporting Server-Side Rendering (SSR) protections via Astro.

## 2. Architecture

### 2.1. Hybrid Rendering Model

- **Public Pages** (Login, Register, Landing): Static or Hybrid.
- **Protected Pages** (Dashboard, Profile): Server-Side Rendered (SSR) to ensure content is only delivered to authenticated users.
- **Client-Side**: React components ("islands") handle interactive forms and direct communication with Supabase Auth for login/registration actions.

### 2.2. Session Management

- **Mechanism**: Cookie-based authentication using `@supabase/ssr`.
- **Flow**:
  1.  Client-side (React) performs login/signup via Supabase SDK.
  2.  Supabase SDK automatically handles session tokens.
  3.  We will implement a mechanism to ensure these tokens are synchronized with server-side cookies for Astro SSR to read.
- **Security**: HttpOnly cookies (where applicable), Secure flag in production.

### 2.3. Route Protection (Middleware)

- **File**: `src/middleware.ts` (New)
- **Responsibility**:
  - Intercept requests to protected routes (e.g., `/dashboard/**`, `/profile`).
  - Verify presence and validity of Supabase session cookies.
  - Redirect unauthenticated users to `/login`.
  - Refresh tokens if expired (handled by Supabase helper).

## 3. User Interface Architecture

### 3.1. Pages & Routing

Existing Arrow pages will be enhanced/implemented:

- `/login`: Public. Displays `LoginView`. Redirects to `/dashboard` if already logged in.
- `/register`: Public. Displays `RegisterView`. Redirects to `/dashboard` if already logged in.
- `/reset-password`: Public. Displays `ResetPasswordView`. Handles "Forgot Password" request (sending the email).
- `/update-password`: Protected (requires session). Displays `UpdatePasswordView`. Used after the user clicks the reset link (which logs them in) to set a new password.
- `/auth/callback`: API route to handle OAuth redirects or Magic Links (exchanges code for session and redirects to `/update-password` or `/dashboard`).

### 3.2. Components (React)

Located in `src/components/views/` and `src/components/auth/`.

- **Separation of Concerns**:
  - **View Components** (`LoginView`, `RegisterView`, `ProfileView`): Container components.
  - **ProfileView**: Must include a "Logout" button (US-003).
  - **Form Components**: `LoginForm`, `RegisterForm`, `ResetPasswordForm`, `UpdatePasswordForm`.
  - **Auth Logic**: Abstracted into `src/lib/auth-client.ts`.

### 3.3. Validation & Error Handling

- **Schema Validation**: Use **Zod** schemas for all inputs (Email format, Password strength/matching).
- **Feedback**:
  - Field-level errors: Displayed directly under the input (shadcn/ui `FormMessage`).
  - Global errors: Displayed via **Sonner** toasts (e.g., "Invalid credentials", "User already exists").
- **Scenarios**:
  - _Invalid Email/Pass_: "Invalid login credentials."
  - _User Exists (Register)_: "User already registered."
  - _Weak Password_: Client-side validation before submission.
  - _Rate Limiting_: Supabase handles this; catch 429 errors and display "Too many attempts, please try again later."

## 4. Backend Logic & Data Models

### 4.1. Supabase Auth Integration

- **Client Initialization**:
  - **Server (`src/lib/supabase-server.ts`)**: Uses `createServerClient` from `@supabase/ssr`. Used in Middleware and API endpoints. Needs access to request/response cookies.
  - **Client (`src/lib/supabase-client.ts`)**: Uses `createBrowserClient` from `@supabase/ssr`. Used in React components. It automatically syncs session to cookies.
- **Configuration**:
  - **Email Verification**: To satisfy US-001 (Auto-login after registration), Email Verification should be **disabled** in Supabase for this MVP, or "Enable "Confirm email" but allow login without confirmation" if supported/preferred. Default assumption: Disabled for smoother MVP flow.

### 4.2. API Endpoints

While Supabase Client handles most logic, we may need Astro API endpoints (`src/pages/api/auth/**`) for specific server-side operations if client-side cookie syncing is insufficient, but primarily:

- `GET /api/auth/signout`: Server-side route to clear cookies and redirect (cleaner logout).

### 4.3. Database Security (RLS)

- **Users Layout**: Handled by `auth.users` (Supabase managed).
- **Public Profiles** (if needed): A `public.profiles` table linked to `auth.users.id`.
- **Policies**:
  - Ensure `videos`, `summaries`, `subscriptions` tables implement RLS policies: `auth.uid() = user_id`.

## 5. Detailed Implementation Steps (Draft)

1.  **Dependencies**: Install `@supabase/ssr` (if not present).
2.  **Supabase Clients**:
    - Create `src/lib/supabase.ts` (Client & Server factories).
3.  **Middleware**:
    - Create `src/middleware.ts` to protect `/dashboard` and handle session refreshing.
4.  **Auth Components**:
    - Refactor `LoginForm`/`RegisterForm` to use the new `supabase-client`.
    - Implement `ResetPasswordView` and `UpdatePasswordView` (for the actual reset step).
5.  **Pages**:
    - Update `login.astro`, `register.astro`.
    - Create `reset-password.astro`.
6.  **Testing**:
    - Verify cookie persistence across page reloads.
    - Verify redirect from protected routes when logged out.

## 6. Contracts

### 6.1 Authentication Store (`src/store/authStore.ts` - Optional)

For reactive UI updates (e.g., Header showing "Logout" vs "Login"), a lightweight store (Nano Stores) can subscribe to `onAuthStateChange`.

```typescript
// Interface
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}
```

### 6.2 Validation Schemas

```typescript
// src/lib/validation/auth.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```
