import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.client.ts";
import { initializeLogging } from "../lib/logger.ts";
import { getAwsTraceId } from "../lib/trace.ts";
import { CRON_SECRET } from "astro:env/server";

// Initialize logging once
let loggingInitialized = false;

// Public pages that don't require authentication
const PUBLIC_PAGES = [
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/reset-password/confirm",
  "/privacy",
  "/terms",
  "/404",
];

// Public API endpoints
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/reset-password/confirm",
  "/api/auth/logout",
];

// Routes that should redirect to dashboard if user is already logged in
const AUTH_PAGES = ["/", "/login", "/signup", "/reset-password", "/reset-password/confirm"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, locals, redirect } = context;
  const pathname = url.pathname;

  // Initialize logging on first request
  if (!loggingInitialized) {
    try {
      await initializeLogging();
    } catch (error) {
      // Log to console if LogTape initialization fails (Cloudflare compatibility)
      console.warn("Failed to initialize LogTape, using console.log fallback:", error);
    }
    loggingInitialized = true;
  }

  // Extract trace ID from request headers for distributed tracing
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  const traceId = getAwsTraceId(headers);

  // Create Supabase client with trace ID and cookie handling
  const supabase = createSupabaseServerClient(context, traceId);
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  // This ensures the session is valid and the user is who they claim to be
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user context in locals for use in pages and components
  locals.user = user
    ? {
        email: user.email,
        id: user.id,
      }
    : null;

  // Check if the current route is public
  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  const isPublicApiRoute = PUBLIC_API_ROUTES.includes(pathname);

  // Also check for static assets or other internal Astro routes
  const isInternalRoute = pathname.startsWith("/_") || pathname.includes(".");

  if (isPublicPage || isPublicApiRoute || isInternalRoute) {
    // If user is logged in and trying to access auth pages (including landing), redirect to dashboard
    if (user && AUTH_PAGES.includes(pathname)) {
      return redirect("/dashboard");
    }
    return next();
  }

  // Check for Cron Secret bypass (for cron job endpoints)
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const cronProtectedPaths = ["/api/summaries/generate-all", "/api/summaries/process-next"];

  // Allow access to cron endpoints in development or with valid cron secret
  const isDevelopment = import.meta.env.DEV;
  const hasValidCronSecret = cronSecretHeader && CRON_SECRET && cronSecretHeader === CRON_SECRET;

  if (cronProtectedPaths.includes(pathname) && (isDevelopment || hasValidCronSecret)) {
    return next();
  }

  // If no user and trying to access protected route
  if (!user) {
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    // For pages, redirect to login
    return redirect("/login");
  }

  return next();
});
