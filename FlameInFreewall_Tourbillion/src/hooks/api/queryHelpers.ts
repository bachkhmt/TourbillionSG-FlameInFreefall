import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { PaginatedPageDto, PaginationParamsDto } from '@/api/dto';
import { mapPaginatedPage } from '@/api/mappers';
import type { MappedPage } from '@/types/api';

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
    ...options,
    queryKey: getQueryKey(trimmedId, pagination),
    queryFn: async ({ signal }) => {
      try {
        const page = await fetcher(trimmedId, pagination, signal);
        return mapPaginatedPage(page, mapItem);
      } catch (err) {
        if (fallbackFetcher && shouldFallback(options?.enableFallback)) {
          return fallbackFetcher(trimmedId, pagination);
        }
        throw err;
      }
    },
    enabled: Boolean(trimmedId) && (options?.enabled ?? true),
  });
}
