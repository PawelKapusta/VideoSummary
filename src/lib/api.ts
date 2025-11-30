import type { ApiError, LoginRequest, AuthResponse, RegisterRequest, ConfirmResetPasswordRequest, ApiSuccess } from '@/types';

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

/**
 * Registers a new user with email and password
 * @param credentials - User registration credentials
 * @returns AuthResponse with user and session data
 * @throws ApiError on failure
 */
export async function registerUser(
  credentials: RegisterRequest
): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
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

/**
 * Initiates password reset by sending email to user
 * @param request - Email address for reset link
 * @throws ApiClientError on failure (400, 429, 500)
 */
export async function resetPassword(
  request: { email: string }
): Promise<void> {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
  }

  // Success: no body needed
}

/**
 * Confirms password reset by updating the user's password
 * @param request - Confirmation request with token and new password
 * @returns ApiSuccess<void> on success
 * @throws ApiClientError on failure (400, 422, 500)
 */
export async function confirmResetPassword(
  request: ConfirmResetPasswordRequest
): Promise<ApiSuccess<void>> {
  const response = await fetch('/api/auth/reset-password/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    // Response is ApiError
    const errorData: ApiError = data;
    throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
  }

  // Response is ApiSuccess<void>
  return data as ApiSuccess<void>;
}

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
