import { defineMiddleware } from 'astro:middleware';

import { createSupabaseClient } from '../db/supabase.client.ts';
import { initializeLogging, getAwsTraceId } from '../lib/logger.ts';

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

  // Create Supabase client with trace ID for this request
  context.locals.supabase = createSupabaseClient(traceId);
  
  return next();
});

