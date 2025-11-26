import { supabaseClient } from '@/db/supabase.client';
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

const getAccessToken = async (): Promise<string | null> => {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data.session) {
    return null;
  }
  return data.session.access_token;
};

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const token = await getAccessToken();
    if (!token) {
      throw new ApiClientError('UNAUTHORIZED', 'No active session found.');
    }

    const response = await fetch(path, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new ApiClientError(errorData.error.code, errorData.error.message, errorData.error.details);
    }

    return response.json() as Promise<T>;
  },

  // TODO: Implement post, put, delete methods as needed
};
