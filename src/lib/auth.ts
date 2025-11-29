import type { AuthResponse } from '@/types';
import { setAccessToken as saveAccessToken, clearAccessToken as removeAccessToken } from './api';

const REFRESH_TOKEN_KEY = 'yt_insights_refresh_token';
const EXPIRES_AT_KEY = 'yt_insights_expires_at';

/**
 * Store session data in localStorage after successful login
 * @param session - Session data from AuthResponse
 */
export function storeSession(session: AuthResponse['session']): void {
  if (typeof window === 'undefined') {
    return;
  }

  saveAccessToken(session.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  localStorage.setItem(EXPIRES_AT_KEY, session.expires_at.toString());
}

/**
 * Retrieve stored session data from localStorage
 * @returns Session data if exists and not expired, null otherwise
 */
export function getSession(): AuthResponse['session'] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const accessToken = localStorage.getItem('yt_insights_access_token');
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);

  if (!accessToken || !refreshToken || !expiresAtStr) {
    return null;
  }

  const expiresAt = parseInt(expiresAtStr, 10);
  const now = Date.now() / 1000; // Convert to seconds

  // Check if session is expired
  if (now >= expiresAt) {
    clearSession();
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  };
}

/**
 * Clear all session data from localStorage
 * Should be called on logout
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  removeAccessToken();
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}

/**
 * Check if user has an active session
 * @returns true if session exists and not expired, false otherwise
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

