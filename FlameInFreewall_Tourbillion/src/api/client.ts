import { getApiTimeoutMs } from './config';
import type { PaginationParamsDto } from './dto';
import {
  ApiClientError,
  type ApiClientErrorInit,
  type QueryParams,
  type QueryParamValue,
  buildQueryString,
  http,
} from './http';

export {
  ApiClientError,
  type ApiClientErrorInit,
  type QueryParams,
  type QueryParamValue,
  buildQueryString,
  http,
};

export interface ApiRequestOptions {
  method?: 'GET' | 'POST';
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Picks an explicit allowlist of query parameters from a typed params object.
 */
export function pickQueryParams<T extends object>(
  source: T | undefined,
  keys: readonly (keyof T & string)[]
): QueryParams | undefined {
  if (!source) return undefined;
  const picked: QueryParams = {};
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined) {
      picked[key] = value as QueryParamValue;
    }
  }
  return picked;
}

/**
 * Extracts only canonical `offset` and `limit` pagination keys for query serialization.
 */
export function toPaginationQuery(pagination?: PaginationParamsDto): QueryParams | undefined {
  return pickQueryParams(pagination, ['offset', 'limit']);
}

/**
 * Executes a typed HTTP request against the configured backend API base URL via Axios.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await http.request<T>({
    url: normalizePath(path),
    method: options.method ?? 'GET',
    params: options.query,
    data: options.body,
    signal: options.signal,
    timeout: options.timeoutMs ?? getApiTimeoutMs(),
  });

  if (response.data === undefined) {
    throw new ApiClientError({
      message: 'Invalid or empty JSON response from server',
      status: response.status,
      code: 'HTTP_ERROR',
    });
  }

  return response.data;
}

/**
 * Executes a typed GET request against the backend API.
 */
export function apiGet<T>(
  path: string,
  query?: QueryParams,
  signal?: AbortSignal
): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', query, signal });
}

/**
 * Executes a typed POST request against the backend API.
 */
export function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal
): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, signal });
}
