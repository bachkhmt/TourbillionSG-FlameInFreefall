import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { PaginatedPageDto, PaginationParamsDto } from "@/api/dto";
import { mapPaginatedPage } from "@/api/mappers";
import { toast } from "@/components/toast/toast-store";
import type { MappedPage } from "@/types/api";

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
  if (!error) return false;
  const value = error as {
    code?: string;
    status?: number;
    message?: string;
    name?: string;
  };
  if (
    value.code === "ERR_CANCELED" ||
    value.name === "AbortError" ||
    /aborted|canceled/i.test(value.message ?? "")
  )
    return false;
  if (typeof value.status === "number" && value.status >= 400)
    return value.status >= 500 && value.status < 600;
  if (value.status === 0) return true;
  if (
    [
      "REQUEST_TIMEOUT",
      "ECONNABORTED",
      "ETIMEDOUT",
      "ECONNRESET",
      "ERR_NETWORK",
    ].includes(value.code ?? "")
  )
    return true;
  return (
    error instanceof Error &&
    /timeout|timed out|socket hang up|econnreset|network error|failed to fetch/i.test(
      error.message,
    )
  );
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
      "Backend unavailable",
      "Showing illustrative demo data. These values are not NASA records.",
    );
  }
}

/**
 * Shared TanStack Query option overrides omitting internally managed keys.
 */
export type ApiQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error>,
  "queryKey" | "queryFn"
> & {
  enableFallback?: boolean;
};

/** Demo fallback is opt-in; callers must also check the failure category. */
export function shouldFallback(enableFallback?: boolean): boolean {
  return (
    enableFallback ?? process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK === "true"
  );
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
  return value?.trim() ?? "";
}

export interface ScopedPaginatedQueryConfig<TDto, TMapped> {
  id: string | undefined | null;
  pagination?: PaginationParamsDto;
  options?: ApiQueryOptions<MappedPage<TMapped>>;
  getQueryKey: (
    id: string,
    pagination?: PaginationParamsDto,
  ) => readonly unknown[];
  fetcher: (
    id: string,
    pagination?: PaginationParamsDto,
    signal?: AbortSignal,
  ) => Promise<PaginatedPageDto<TDto>>;
  mapItem: (item: TDto) => TMapped;
  fallbackFetcher?: (
    id: string,
    pagination?: PaginationParamsDto,
  ) => MappedPage<TMapped>;
}

/**
 * Shared hook helper for ID-scoped paginated endpoints with automatic `enabled` guard, DTO mapping, and offline fallback.
 */
export function useScopedPaginatedQuery<TDto, TMapped>(
  config: ScopedPaginatedQueryConfig<TDto, TMapped>,
): UseQueryResult<MappedPage<TMapped>, Error> {
  const {
    id,
    pagination,
    options,
    getQueryKey,
    fetcher,
    mapItem,
    fallbackFetcher,
  } = config;
  const trimmedId = normalizeNonEmptyId(id);

  return useQuery<MappedPage<TMapped>, Error>({
    ...options,
    queryKey: getQueryKey(trimmedId, pagination),
    queryFn: async ({ signal }) => {
      try {
        const page = await fetcher(trimmedId, pagination, signal);
        return mapPaginatedPage(page, mapItem);
      } catch (err) {
        if (
          fallbackFetcher &&
          shouldFallback(options?.enableFallback) &&
          isTimeoutError(err)
        ) {
          handleTimeoutFallback(err);
          return fallbackFetcher(trimmedId, pagination);
        }
        throw err;
      }
    },
    enabled: Boolean(trimmedId) && (options?.enabled ?? true),
  });
}
