import type { ApiError } from '@/types';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const ACCESS_TOKEN_KEY = 'yt_insights_access_token';

/**
 * Get access token from localStorage
 * Token is stored after successful login via /api/auth/login
 */
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  console.log('getAccessToken:', token ? 'Token found' : 'No token');
  return token;
};

/**
 * Save access token to localStorage
 * Should be called after successful login
 */
export const setAccessToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

/**
 * Remove access token from localStorage
 * Should be called on logout
 */
export const clearAccessToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const token = getAccessToken();
    if (!token) {
      throw new ApiClientError('UNAUTHORIZED', 'No active session found. Please log in.');
    }

    console.log('Making GET request to:', path);

    const response = await fetch(path, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      console.error('API Error:', errorData);
      throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data as T;
  },

  // TODO: Implement post, put, delete methods as needed
};
