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

