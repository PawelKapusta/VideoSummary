/**
 * Runtime environment variables type (from Cloudflare Pages context)
 */
export type RuntimeEnv = Record<string, string | undefined> | undefined;

/**
 * Helper to get environment variables that works in both build-time and Cloudflare runtime
 * @param key - Environment variable name
 * @param runtimeEnv - Optional Cloudflare runtime env object from context.locals.runtime.env
 */
export function getEnv(key: string, runtimeEnv?: RuntimeEnv): string | undefined {
  // Priority 1: Runtime env from Cloudflare (passed explicitly)
  if (runtimeEnv?.[key]) {
    return runtimeEnv[key];
  }

  // Priority 2: process.env (local development with nodejs_compat)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  // Priority 3: import.meta.env (build time and some runtime environments)
  if (typeof import.meta.env !== 'undefined' && import.meta.env[key]) {
    return import.meta.env[key];
  }

  return undefined;
}

/**
 * Require an environment variable, throw if not found
 * @param key - Environment variable name
 * @param runtimeEnv - Optional Cloudflare runtime env object from context.locals.runtime.env
 */
export function requireEnv(key: string, runtimeEnv?: RuntimeEnv): string {
  const value = getEnv(key, runtimeEnv);
  if (!value) {
    // In Cloudflare Pages runtime, environment variables might be available later
    // Return a placeholder that will be checked again at runtime
    // Note: This is expected during build time - variables will be available in runtime
    return `__PLACEHOLDER_${key}__`;
  }
  return value;
}

/**
 * Get the site URL for API referer headers
 * In development: http://localhost:3000
 * In production: from SITE_URL env var or default
 */
export function getSiteUrl(runtimeEnv?: RuntimeEnv): string {
  // Check if we're in development
  const isDev = getEnv('NODE_ENV', runtimeEnv) === 'development' || 
                typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return 'http://localhost:3000/';
  }
  
  // Production URL - configurable via SITE_URL env var
  const siteUrl = getEnv('SITE_URL', runtimeEnv);
  if (siteUrl) {
    // Ensure trailing slash
    return siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  }
  
  // Fallback to default Cloudflare Pages URL
  return 'https://video-summary.pages.dev/';
}

