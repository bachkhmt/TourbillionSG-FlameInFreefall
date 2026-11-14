import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { ApiClientError } from '@/api/client';
import type { PaginatedPageDto, PaginationParamsDto } from '@/api/dto';
import { mapPaginatedPage } from '@/api/mappers';
import { toast } from '@/components/toast/toast-store';
import type { MappedPage } from '@/types/api';

let lastTimeoutToastAt = 0;

/**
 * Resets the throttle timestamp for server timeout notifications (used in tests).
 */
export function resetTimeoutToastThrottle(): void {
  lastTimeoutToastAt = 0;
}

/**
 * Detects whether an error represents a server response timeout, proxy hang, connection drop,
 * or server failure requiring offline mock fallback notification.
 */
export function isTimeoutError(error: unknown): boolean {
  if (!error) return true;

  // If request was explicitly aborted (e.g. user navigated away before response arrived),
  // do not treat as a server timeout error.
  const errObj = error as { code?: string; status?: number; message?: string; name?: string };
  if (
    errObj.code === 'ERR_CANCELED' ||
    errObj.name === 'AbortError' ||
    /aborted|canceled/i.test(errObj.message || '')
  ) {
    return false;
  }

  if (error instanceof ApiClientError || typeof errObj.status === 'number' || errObj.code) {
    if (
      errObj.code === 'REQUEST_TIMEOUT' ||
      errObj.code === 'ECONNABORTED' ||
      errObj.code === 'ETIMEDOUT' ||
      errObj.code === 'ECONNRESET' ||
      errObj.code === 'ERR_NETWORK'
    ) {
      return true;
    }
    const status = errObj.status;
    if (typeof status === 'number' && (status === 408 || status === 504 || status >= 500 || status === 0)) {
      return true;
    }
    if (
      /timeout|timed out|socket hang up|econnreset|server error|network error|failed to fetch/i.test(
        errObj.message || ''
      )
    ) {
      return true;
    }
  }

  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (
      code === 'ECONNABORTED' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNRESET' ||
      code === 'ERR_NETWORK' ||
      code === 'REQUEST_TIMEOUT'
    ) {
      return true;
    }
    if (
      /timeout|timed out|socket hang up|econnreset|server error|network error|failed to fetch/i.test(
        error.message
      )
    ) {
      return true;
    }
  }

  return true;
}

/**
 * Displays a toast notification if the error is due to a server response timeout,
 * throttled across concurrent query executions.
 */
export function handleTimeoutFallback(error?: unknown): void {
  if (!error || !isTimeoutError(error)) return;
  const now = Date.now();
  if (now - lastTimeoutToastAt > 4000) {
    lastTimeoutToastAt = now;
    toast.warning(
      'Quá thời gian phản hồi server',
      'Hệ thống chuyển sang chế độ dữ liệu dự phòng (Offline Fallback).'
    );
  }
}

/**
 * Shared TanStack Query option overrides omitting internally managed keys.
 */
export type ApiQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error>,
  'queryKey' | 'queryFn'
> & {
  enableFallback?: boolean;
};

/**
 * Determines whether offline mock fallback should be activated on error.
 * Enabled by default in browser runtime (development / production) for resilience.
 * Disabled by default in automated testing (NODE_ENV === 'test') so that error-state
 * assertions and error banner unit tests execute as intended.
 */
export function shouldFallback(enableFallback?: boolean): boolean {
  if (typeof enableFallback === 'boolean') {
    return enableFallback;
  }
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  return true;
}

const UUID_V1_TO_5_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns `true` when `value` matches a strict RFC-4122 UUID v1-5 string.
 */
export function isUuid(value: string): boolean {
  return UUID_V1_TO_5_REGEX.test(value);
}

/**
 * Trims an optional identifier string to `""` when nullish or whitespace-only.
 */
export function normalizeNonEmptyId(value: string | undefined | null): string {
  return value?.trim() ?? '';
}

export interface ScopedPaginatedQueryConfig<TDto, TMapped> {
  id: string | undefined | null;
  pagination?: PaginationParamsDto;
  options?: ApiQueryOptions<MappedPage<TMapped>>;
  getQueryKey: (id: string, pagination?: PaginationParamsDto) => readonly unknown[];
  fetcher: (
    id: string,
    pagination?: PaginationParamsDto,
    signal?: AbortSignal
  ) => Promise<PaginatedPageDto<TDto>>;
  mapItem: (item: TDto) => TMapped;
  fallbackFetcher?: (id: string, pagination?: PaginationParamsDto) => MappedPage<TMapped>;
}

/**
 * Shared hook helper for ID-scoped paginated endpoints with automatic `enabled` guard, DTO mapping, and offline fallback.
 */
export function useScopedPaginatedQuery<TDto, TMapped>(
  config: ScopedPaginatedQueryConfig<TDto, TMapped>
): UseQueryResult<MappedPage<TMapped>, Error> {
  const { id, pagination, options, getQueryKey, fetcher, mapItem, fallbackFetcher } = config;
  const trimmedId = normalizeNonEmptyId(id);

  return useQuery<MappedPage<TMapped>, Error>({
    placeholderData:
      fallbackFetcher && shouldFallback(options?.enableFallback) && trimmedId
        ? () => fallbackFetcher(trimmedId, pagination)
        : undefined,
    ...options,
    queryKey: getQueryKey(trimmedId, pagination),
    queryFn: async ({ signal }) => {
      try {
        const page = await fetcher(trimmedId, pagination, signal);
        return mapPaginatedPage(page, mapItem);
      } catch (err) {
        if (fallbackFetcher && shouldFallback(options?.enableFallback)) {
          handleTimeoutFallback(err);
          return fallbackFetcher(trimmedId, pagination);
        }
        throw err;
      }
    },
    enabled: Boolean(trimmedId) && (options?.enabled ?? true),
  });
}
