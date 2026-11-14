const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const DEFAULT_PROXY_API_BASE_URL = '/api/proxy/api/v1';
const DEFAULT_BACKEND_INTERNAL_URL = 'http://127.0.0.1:8000';
const DEFAULT_API_TIMEOUT_MS = 10000;

/**
 * Returns the normalized backend API base URL without trailing slashes.
 * In non-test browser environments, defaults to the Next.js `/api/proxy` rewrite.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw && raw.length > 0) {
    return raw.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    return DEFAULT_PROXY_API_BASE_URL;
  }
  return DEFAULT_API_BASE_URL;
}

/**
 * Returns the HTTP request timeout in milliseconds.
 */
export function getApiTimeoutMs(): number {
  const raw = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_API_TIMEOUT_MS;
}

/**
 * Returns the normalized internal backend origin used by Next.js server rewrites.
 */
export function getBackendInternalUrl(): string {
  const raw = process.env.BACKEND_INTERNAL_URL?.trim();
  const base = raw && raw.length > 0 ? raw : DEFAULT_BACKEND_INTERNAL_URL;
  return base.replace(/\/+$/, '');
}
