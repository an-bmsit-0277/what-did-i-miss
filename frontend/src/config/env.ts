/**
 * Frontend Environment & Security Configuration
 *
 * Public client configuration exposed through Vite (VITE_* prefix only).
 * Supports both Vite browser runtime (import.meta.env) and Node.js testing environments (process.env).
 * NEVER expose server secrets or service-role keys here.
 */

// Safely access env in either Vite (browser) or Node.js test environment
const clientEnv: Record<string, string | undefined> = (() => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env;
  }
  const globalScope = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
  if (globalScope.process?.env) {
    return globalScope.process.env;
  }
  return {};
})();

export const VITE_API_URL =
  (clientEnv.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3001';

export const VITE_SUPABASE_URL =
  (clientEnv.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  '';

export const VITE_SUPABASE_ANON_KEY =
  (clientEnv.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

/**
 * Returns full API URL for a given relative endpoint path.
 * Guarantees base path is `${VITE_API_URL}/api/...`.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // If path already starts with /api/, avoid duplicate prefix
  if (cleanPath.startsWith('/api/')) {
    return `${VITE_API_URL}${cleanPath}`;
  }
  return `${VITE_API_URL}/api${cleanPath}`;
}

/**
 * Validates post-login return redirects to strictly internal paths.
 * Rejects external URLs, protocol-relative '//', and backslashes to prevent open redirects.
 */
export function getSafeRedirect(
  target: string | null | undefined,
  fallback: string = '/workspace'
): string {
  if (!target || typeof target !== 'string') {
    return fallback;
  }
  const trimmed = target.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.includes('://')
  ) {
    return fallback;
  }
  return trimmed;
}
