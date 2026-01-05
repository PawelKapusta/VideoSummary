/**
 * Helper to get environment variables that works in both build-time and Cloudflare runtime
 */
export function getEnv(key: string): string | undefined {
  // Try import.meta.env first (build time)
  if (typeof import.meta.env !== 'undefined' && import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // Fallback to process.env (Cloudflare runtime with nodejs_compat)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  
  return undefined;
}

export function requireEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value;
}

