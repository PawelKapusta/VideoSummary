import type { ApiError, LoginRequest, AuthResponse, RegisterRequest, ConfirmResetPasswordRequest, ApiSuccess } from '@/types';
import { getSession } from './auth';

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
  async get<T>(path: string, options?: { params?: Record<string, any> }): Promise<T> {
    let url = path;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    console.log('Making GET request to:', url);

    const response = await fetch(url, {
      headers: {
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

  async post<T>(path: string, body?: any): Promise<T> {
    console.log('Making POST request to:', path);

    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
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

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
    }

    // DELETE requests might not have a body, handle that case
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  },
};

// Create a new client for authenticated requests
export const authApiClient = {
  async get<T>(path: string, options?: { params?: Record<string, any> }): Promise<T> {
    const session = getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(pathWithParams(path, options?.params), {
      headers,
    });

    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: any): Promise<T> {
    const session = getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(path, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },
};

function pathWithParams(path: string, params?: Record<string, any>): string {
  if (!params) return path;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    console.error('API Error:', errorData);
    throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
  }

  // Handle cases where the response may be empty
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  
  return JSON.parse(text) as T;
}
