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
>;

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
}

/**
 * Shared hook helper for ID-scoped paginated endpoints with automatic `enabled` guard and DTO mapping.
 */
export function useScopedPaginatedQuery<TDto, TMapped>(
  config: ScopedPaginatedQueryConfig<TDto, TMapped>
): UseQueryResult<MappedPage<TMapped>, Error> {
  const { id, pagination, options, getQueryKey, fetcher, mapItem } = config;
  const trimmedId = normalizeNonEmptyId(id);

  return useQuery<MappedPage<TMapped>, Error>({
    ...options,
    queryKey: getQueryKey(trimmedId, pagination),
    queryFn: async ({ signal }) => {
      const page = await fetcher(trimmedId, pagination, signal);
      return mapPaginatedPage(page, mapItem);
    },
    enabled: Boolean(trimmedId) && (options?.enabled ?? true),
  });
}
