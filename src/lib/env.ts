/**
 * Helper to get environment variables that works in both build-time and Cloudflare runtime
 */
export function getEnv(key: string): string | undefined {
  // Try process.env first (Cloudflare runtime with nodejs_compat)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  // Try import.meta.env (build time and some runtime environments)
  if (typeof import.meta.env !== 'undefined' && import.meta.env[key]) {
    return import.meta.env[key];
  }

  // Try global scope (Cloudflare Pages might inject secrets here)
  if (typeof globalThis !== 'undefined' && (globalThis as any)[key]) {
    return (globalThis as any)[key];
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

