import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { InvestigationListParamsDto, PaginationParamsDto } from '@/api/dto';
import {
  mapCatalogCapabilitiesDto,
  mapInvestigationDetailDto,
  mapInvestigationDto,
  mapPaginatedPage,
  mapTagDto,
} from '@/api/mappers';
import {
  getCatalogCapabilities,
  getInvestigationById,
  getInvestigationBySlug,
  getInvestigationTags,
  listInvestigations,
} from '@/api/services';
import type {
  MappedCatalogCapabilities,
  MappedInvestigation,
  MappedInvestigationDetail,
  MappedPage,
  MappedTag,
} from '@/types/api';
import {
  type ApiQueryOptions,
  normalizeNonEmptyId,
  useScopedPaginatedQuery,
} from './queryHelpers';
import { apiQueryKeys } from './queryKeys';

const UUID_V1_TO_5_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns `true` when `value` matches a strict RFC-4122 UUID v1-5 string.
 */
export function isUuid(value: string): boolean {
  return UUID_V1_TO_5_REGEX.test(value);
}

/**
 * Queries backend catalog filter/sort capabilities (`GET /catalog/capabilities`).
 */
export function useCatalogCapabilitiesQuery(
  options?: ApiQueryOptions<MappedCatalogCapabilities>
): UseQueryResult<MappedCatalogCapabilities, Error> {
  return useQuery<MappedCatalogCapabilities, Error>({
    ...options,
    queryKey: apiQueryKeys.catalogCapabilities,
    queryFn: async ({ signal }) =>
      mapCatalogCapabilitiesDto(await getCatalogCapabilities(signal)),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Queries paginated investigations matching filter/sort parameters (`GET /investigations`).
 */
export function useInvestigationsQuery(
  params?: InvestigationListParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedInvestigation>>
): UseQueryResult<MappedPage<MappedInvestigation>, Error> {
  return useQuery<MappedPage<MappedInvestigation>, Error>({
    ...options,
    queryKey: apiQueryKeys.investigations(params),
    queryFn: async ({ signal }) => {
      const page = await listInvestigations(params, signal);
      return mapPaginatedPage(page, mapInvestigationDto);
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Queries a single investigation by UUID or slug, guarded when empty.
 */
export function useInvestigationDetailQuery(
  idOrSlug: string | undefined | null,
  options?: ApiQueryOptions<MappedInvestigationDetail>
): UseQueryResult<MappedInvestigationDetail, Error> {
  const trimmed = normalizeNonEmptyId(idOrSlug);

  return useQuery<MappedInvestigationDetail, Error>({
    ...options,
    queryKey: apiQueryKeys.investigationDetail(trimmed),
    queryFn: async ({ signal }) => {
      const dto = isUuid(trimmed)
        ? await getInvestigationById(trimmed, signal)
        : await getInvestigationBySlug(trimmed, signal);
      return mapInvestigationDetailDto(dto);
    },
    enabled: Boolean(trimmed) && (options?.enabled ?? true),
  });
}

/**
 * Queries paginated tags for a specific investigation (`GET /investigations/{id}/tags`).
 */
export function useInvestigationTagsQuery(
  investigationId: string | undefined | null,
  pagination?: PaginationParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedTag>>
): UseQueryResult<MappedPage<MappedTag>, Error> {
  return useScopedPaginatedQuery({
    id: investigationId,
    pagination,
    options,
    getQueryKey: apiQueryKeys.investigationTags,
    fetcher: getInvestigationTags,
    mapItem: mapTagDto,
  });
}
