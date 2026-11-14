import axios, { AxiosHeaders } from 'axios';
import { getApiBaseUrl, getApiTimeoutMs } from './config';
import { isApiErrorEnvelopeDto, isReadyDto, type ContextDto } from './dto';

export type QueryParamValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryParamValue>;

export interface ApiClientErrorInit {
  message: string;
  status: number;
  code: string;
  fields?: string[];
  supportedValues?: string[];
  context?: ContextDto;
}

/**
 * Structured HTTP/client error matching backend `ApiErrorEnvelopeDto` metadata.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: string[];
  readonly supportedValues: string[];
  readonly context?: ContextDto;

  constructor(init: ApiClientErrorInit) {
    super(init.message);
    this.name = 'ApiClientError';
    this.status = init.status;
    this.code = init.code;
    this.fields = init.fields ?? [];
    this.supportedValues = init.supportedValues ?? [];
    this.context = init.context;
  }
}

/**
 * Serializes defined, non-blank query parameters into a URL query string.
 */
export function buildQueryString(params?: QueryParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim().length === 0) continue;
    searchParams.set(key, String(value));
  }

  const serialized = searchParams.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

function errorFromResponse(
  status: number,
  statusText: string,
  data: unknown,
  fallback: string
): ApiClientError {
  if (isApiErrorEnvelopeDto(data)) {
    return new ApiClientError({
      message: data.error.message,
      status,
      code: data.error.code,
      fields: data.error.fields,
      supportedValues: data.error.supportedValues,
      context: data.context,
    });
  }
  if (isReadyDto(data)) {
    return new ApiClientError({
      message: 'Database unavailable',
      status,
      code: 'DATA_UNAVAILABLE',
      fields: ['database'],
      supportedValues: [],
    });
  }
  const textMessage = typeof data === 'string' ? data.trim() : '';
  const message =
    textMessage || statusText?.trim() || fallback || `HTTP request failed with status ${status}`;
  return new ApiClientError({ message, status, code: 'HTTP_ERROR', fields: [], supportedValues: [] });
}

/**
 * Normalizes Axios and transport failures into structured `ApiClientError` instances.
 */
export function normalizeAxiosError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;

  if (axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')) {
    return new ApiClientError({ message: 'Request was aborted', status: 0, code: 'NETWORK_ERROR' });
  }

  if (axios.isAxiosError(error)) {
    const isTimeout =
      error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || /timeout/i.test(error.message);
    if (isTimeout) {
      return new ApiClientError({ message: 'Request timed out', status: 0, code: 'REQUEST_TIMEOUT' });
    }
    if (error.response) {
      const { status, statusText, data } = error.response;
      return errorFromResponse(status, statusText, data, error.message?.trim() ?? '');
    }
    return new ApiClientError({
      message: error.message?.trim() || 'Network request failed',
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : 'Network request failed';
  return new ApiClientError({ message, status: 0, code: 'NETWORK_ERROR' });
}

/**
 * Shared Axios transport instance configured for FlameGuard backend CORS rules.
 */
export const http = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: getApiTimeoutMs(),
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
  paramsSerializer: (params) => buildQueryString(params as QueryParams).replace(/^\?/, ''),
});

http.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  config.timeout = config.timeout ?? getApiTimeoutMs();
  config.headers = AxiosHeaders.from(config.headers);
  if (config.data !== undefined && !config.headers.has('Content-Type')) {
    config.headers.set('Content-Type', 'application/json');
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeAxiosError(error))
);
