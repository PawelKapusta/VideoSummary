import { createBrowserClient, createServerClient, parseCookieHeader } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { createTraceHeaders } from '../lib/trace.ts';
import type { APIContext } from 'astro';
import { requireEnv } from '../lib/env.ts';

// Helper functions to get environment variables at runtime (not build time)
const getSupabaseUrl = () => requireEnv('SUPABASE_URL');
const getSupabaseAnonKey = () => requireEnv('SUPABASE_KEY');
const getSupabaseServiceRoleKey = () => requireEnv('SUPABASE_SERVICE_ROLE_KEY');



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
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
};

// Server-side Supabase client (for Astro Middleware/API)
export const createSupabaseServerClient = (context: APIContext, traceId?: string) => {
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
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

/**
 * Service role client for backend operations (bypasses RLS)
 * 
 * ⚠️ SECURITY WARNING:
 * - This client has FULL database access and bypasses Row Level Security
 * - Use ONLY in server-side code (API routes, background jobs)
 * - NEVER expose this client or its key to the browser/client
 * - NEVER import this in client-side components
 * 
 * Valid use cases:
 * - Background processing (e.g., summary generation)
 * - Admin operations
 * - System-level database updates
 * 
 * @param traceId - Optional trace ID for distributed tracing
 * @returns Supabase client with service role privileges
 */
export const createSupabaseServiceClient = (traceId?: string) => {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: createTracedFetch(traceId),
    },
  });
};

// Export type for convenience
export type SupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;
