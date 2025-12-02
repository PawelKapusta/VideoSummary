import { createBrowserClient, createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { Database } from './database.types';
import { createTraceHeaders } from '../lib/trace.ts';
import type { APIContext } from 'astro';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Temporary default user ID for testing without auth
export const DEFAULT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// Create custom fetch function that adds trace ID to requests
const createTracedFetch = (traceId?: string) => {
  const traceHeaders = createTraceHeaders(traceId);

  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    Object.entries(traceHeaders).forEach(([key, value]) => {
      headers.set(key, value as string);
    });

    return fetch(input, {
      ...init,
      headers,
    });
  };
};

// Client-side Supabase client (uses cookies automatically)
export const createSupabaseBrowserClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Server-side Supabase client (for Astro Middleware/API)
export const createSupabaseServerClient = (context: APIContext, traceId?: string) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.request.headers.get('Cookie') ?? '') as { name: string; value: string }[];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          context.cookies.set(name, value, options)
        );
      },
    },
    global: {
      fetch: createTracedFetch(traceId),
    },
  });
};

// Export type for convenience
export type SupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;
