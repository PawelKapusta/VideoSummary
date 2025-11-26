import { defineMiddleware } from 'astro:middleware';

import { createSupabaseClient } from '../db/supabase.client.ts';
import { initializeLogging } from '../lib/logger.ts';
import { getAwsTraceId } from '../lib/trace.ts';

// Initialize logging once
let loggingInitialized = false;

export const onRequest = defineMiddleware(async (context, next) => {
  // Initialize logging on first request
  if (!loggingInitialized) {
    await initializeLogging();
    loggingInitialized = true;
  }

  // Extract trace ID from request headers for distributed tracing
  const headers: Record<string, string> = {};
  context.request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  const traceId = getAwsTraceId(headers);

  // Extract and set authentication token if provided
  const authHeader = headers['authorization'];
  let authToken: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    authToken = authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Create Supabase client with trace ID and optional auth token
  const supabase = createSupabaseClient(traceId, authToken);

  context.locals.supabase = supabase;

  return next();
});

