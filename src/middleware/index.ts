import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from '../db/supabase.client.ts';
import { initializeLogging } from '../lib/logger.ts';
import { getAwsTraceId } from '../lib/trace.ts';

// Initialize logging once
let loggingInitialized = false;

const PROTECTED_ROUTES = [
  '/dashboard',
  '/summaries',
  '/profile',
  '/generate',
  '/videos',
  '/settings',
];

const AUTH_ROUTES = ['/login', '/register', '/reset-password'];

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

  // Create Supabase client with trace ID and cookie handling
  const supabase = createSupabaseServerClient(context, traceId);
  context.locals.supabase = supabase;

  // Check authentication status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = context.url.pathname;

  // Root redirect
  if (pathname === '/') {
    return context.redirect('/dashboard');
  }

  // Protected routes redirect
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtectedRoute && !user) {
    return context.redirect('/login');
  }

  // Auth routes redirect (if already logged in)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && user) {
    return context.redirect('/dashboard');
  }

  return next();
});
