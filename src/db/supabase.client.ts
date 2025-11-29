import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';
import { createTraceHeaders } from '../lib/trace.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Temporary default user ID for testing without auth
export const DEFAULT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// Create custom fetch function that adds trace ID and auth token to requests
const createTracedFetch = (traceId?: string, authToken?: string) => {
  const traceHeaders = createTraceHeaders(traceId);

  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    Object.entries(traceHeaders).forEach(([key, value]) => {
      headers.set(key, value as string);
    });

    // Add authorization header if token is provided
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    return fetch(input, {
      ...init,
      headers,
    });
  };
};

// Create Supabase client with trace ID and optional auth token support
export const createSupabaseClient = (traceId?: string, authToken?: string) => {
  // If auth token is provided, use it directly in the client options
  const clientOptions: any = {
    global: {
      fetch: createTracedFetch(traceId, authToken),
      headers: authToken ? {
        Authorization: `Bearer ${authToken}`,
      } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  };

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, clientOptions);

  return client;
};

// Default client (creates new trace ID if none provided)
export const supabaseClient = createSupabaseClient();

// Export the proper SupabaseClient type
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
