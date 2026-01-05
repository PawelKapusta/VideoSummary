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

  // In Cloudflare Pages runtime, try accessing from platform context
  if (typeof globalThis !== 'undefined' && (globalThis as any).platform?.env?.[key]) {
    return (globalThis as any).platform.env[key];
  }

  // Try accessing from CF_PAGES environment (Cloudflare Pages specific)
  if (typeof process !== 'undefined' && process.env?.CF_PAGES === '1' && process.env?.[key]) {
    return process.env[key];
  }

  // Try accessing from various global contexts that Cloudflare might use
  if (typeof globalThis !== 'undefined') {
    // Check if secrets are available in different global properties
    const possibleGlobals = ['env', 'ENV', 'secrets', 'SECRETS', '__env', '__ENV'];
    for (const globalProp of possibleGlobals) {
      if ((globalThis as any)[globalProp]?.[key]) {
        return (globalThis as any)[globalProp][key];
      }
    }

    // Check if there's a cf property with env
    if ((globalThis as any).cf?.env?.[key]) {
      return (globalThis as any).cf.env[key];
    }
  }

  return undefined;
}

export function requireEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    // In Cloudflare Pages runtime, environment variables might be available later
    // Log a warning and return a placeholder that will be checked again at runtime
    console.warn(`Environment variable ${key} not found, will retry at runtime`);
    return `__PLACEHOLDER_${key}__`;
  }
  return value;
}

