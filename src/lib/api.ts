import type {
  ApiError,
  LoginRequest,
  AuthResponse,
  RegisterRequest,
  ConfirmResetPasswordRequest,
  ApiSuccess,
  GenerateSummaryRequest,
  SummaryBasic,
  VideoMetaResponse,
  GenerationStatusResponse,
  PaginatedResponse,
  VideoSummary,
  VideosFilterState,
} from "@/types";
import { getSession } from "./auth";

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Authenticates a user with email and password
 * @param credentials - User login credentials
 * @returns AuthResponse with user and session data
 * @throws ApiError on failure
 */
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
export async function registerUser(credentials: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
export async function resetPassword(request: { email: string }): Promise<void> {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
export async function confirmResetPassword(request: ConfirmResetPasswordRequest): Promise<ApiSuccess<void>> {
  const response = await fetch("/api/auth/reset-password/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

export async function generateSummary(
  data: GenerateSummaryRequest
): Promise<ApiSuccess<SummaryBasic & { message: string }>> {
  const session = getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/summaries", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw errorData;
  }

  const result = await response.json();

  // Queue processing is handled by GitHub Actions cron (every 10 min)
  // Don't trigger from frontend - it causes "stuck" items when browser closes

  return result;
}

export async function fetchVideoMeta(videoUrl: string): Promise<VideoMetaResponse> {
  const session = getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`/api/videos/meta?url=${encodeURIComponent(videoUrl)}`, { headers });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw errorData;
  }
  return response.json();
}

export async function fetchGenerationStatus(channelId: string): Promise<GenerationStatusResponse> {
  const session = getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`/api/generation-requests/status?channel_id=${channelId}`, { headers });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw errorData;
  }
  return response.json();
}

export async function getVideos(
  filters: VideosFilterState,
  pageParam: number,
  limit = 10
): Promise<PaginatedResponse<VideoSummary>> {
  const params: Record<string, string | number> = {
    offset: pageParam,
    limit,
  };

  if (filters.channelId && filters.channelId !== "all") {
    params.channel_id = filters.channelId;
  }

  if (filters.searchQuery) {
    params.search = filters.searchQuery;
  }

  if (filters.summaryStatus && filters.summaryStatus !== "all") {
    params.status = filters.summaryStatus;
  }

  if (filters.sort) {
    params.sort = filters.sort;
  }

  if (filters.published_at_from) {
    params.published_at_from = filters.published_at_from;
  }

  if (filters.published_at_to) {
    params.published_at_to = filters.published_at_to;
  }

  return authApiClient.get<PaginatedResponse<VideoSummary>>("/api/videos", { params });
}

export const apiClient = {
  async get<T>(path: string, options?: { params?: Record<string, string | number | boolean> }): Promise<T> {
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

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      console.error("API Error:", errorData);
      throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
    }

    const data = await response.json();
    return data as T;
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      console.error("API Error:", errorData);
      throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
    }

    const data = await response.json();
    return data as T;
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(path, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      console.error("API Error:", errorData);
      throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
    }

    const data = await response.json();
    return data as T;
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
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
  async get<T>(path: string, options?: { params?: Record<string, string | number | boolean> }): Promise<T> {
    const session = getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(pathWithParams(path, options?.params), {
      headers,
    });

    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const session = getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(path, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },
};

function pathWithParams(path: string, params?: Record<string, string | number | boolean>): string {
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
    console.error("API Error:", errorData);
    throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
  }

  // Handle cases where the response may be empty
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}
