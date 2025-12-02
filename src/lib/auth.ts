import type { AuthResponse } from '@/types';

/**
 * NO-OP: Session is now managed via cookies by Supabase client.
 * Kept for backward compatibility during refactor.
 */
export function storeSession(_session: AuthResponse['session']): void {
  // No-op
}

/**
 * NO-OP: Session is now managed via cookies by Supabase client.
 * Kept for backward compatibility during refactor.
 * @returns null as we don't read from localStorage anymore
 */
export function getSession(): AuthResponse['session'] | null {
  // We return null here because client-side code should ideally rely on 
  // Supabase client state or API responses, not localStorage.
  // However, for components checking strictly for "isAuthenticated",
  // we might need to adjust logic or rely on API 401s.
  return null; 
}

/**
 * NO-OP: Session is now managed via cookies by Supabase client.
 * Kept for backward compatibility during refactor.
 */
export function clearSession(): void {
  // No-op
}

/**
 * Check if user has an active session.
 * Warning: This is now a naive check. Real auth status is determined by server cookies.
 * @returns boolean
 */
export function isAuthenticated(): boolean {
  // Since we removed localStorage, we can't synchronously know if we are logged in.
  // This function should likely be deprecated or use a different mechanism (e.g. React Context).
  // For now, returning false to force safe defaults, or we could check document.cookie 
  // but that's not reliable for HttpOnly cookies (if we used them).
  // Given we use @supabase/ssr, the access token is in a cookie.
  // If it's NOT HttpOnly, we can check it. Supabase cookies are usually not HttpOnly by default
  // to allow client access, but best practice suggests HttpOnly.
  
  // Ideally, use useUser() hook or similar that queries the session.
  return document.cookie.includes('sb-access-token') || document.cookie.includes('sb-');
}
