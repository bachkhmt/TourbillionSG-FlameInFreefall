import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  InvestigationListParamsDto,
  PaginationParamsDto,
} from "@/api/dto";
import {
  mapCatalogCapabilitiesDto,
  mapInvestigationDetailDto,
  mapInvestigationDto,
  mapPaginatedPage,
  mapTagDto,
} from "@/api/mappers";
import {
  getCatalogCapabilities,
  getInvestigationById,
  getInvestigationBySlug,
  getInvestigationTags,
  listInvestigations,
} from "@/api/services";
import {
  FALLBACK_CONTEXT,
  getMockCatalogCapabilities,
  getMockInvestigationDetail,
  getMockInvestigationsPage,
} from "@/api/mockFallback";
import type {
  MappedCatalogCapabilities,
  MappedInvestigation,
  MappedInvestigationDetail,
  MappedPage,
  MappedTag,
} from "@/types/api";
import {
  type ApiQueryOptions,
  handleTimeoutFallback,
  isTimeoutError,
  isUuid,
  normalizeNonEmptyId,
  shouldFallback,
  useScopedPaginatedQuery,
} from "@/hooks/api/queryHelpers";
import { apiQueryKeys } from "@/hooks/api/queryKeys";

export { isUuid };

/**
 * Queries backend catalog filter/sort capabilities (`GET /catalog/capabilities`).
 * Seamlessly falls back to mock capabilities when backend is unavailable.
 */
export function useCatalogCapabilitiesQuery(
  options?: ApiQueryOptions<MappedCatalogCapabilities>,
): UseQueryResult<MappedCatalogCapabilities, Error> {
  return useQuery<MappedCatalogCapabilities, Error>({
    ...options,
    queryKey: apiQueryKeys.catalogCapabilities,
    queryFn: async ({ signal }) => {
      try {
        const dto = await getCatalogCapabilities(signal);
        return mapCatalogCapabilitiesDto(dto);
      } catch (err) {
        if (shouldFallback(options?.enableFallback) && isTimeoutError(err)) {
          handleTimeoutFallback(err);
          return getMockCatalogCapabilities();
        }
        throw err;
      }
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Queries paginated investigations matching filter/sort parameters (`GET /investigations`).
 * Uses illustrative demo data only when NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=true; otherwise errors surface.
 */
export function useInvestigationsQuery(
  params?: InvestigationListParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedInvestigation>>,
): UseQueryResult<MappedPage<MappedInvestigation>, Error> {
  return useQuery<MappedPage<MappedInvestigation>, Error>({
    ...options,
    queryKey: apiQueryKeys.investigations(params),
    queryFn: async ({ signal }) => {
      try {
        const page = await listInvestigations(params, signal);
        return mapPaginatedPage(page, mapInvestigationDto);
      } catch (err) {
        if (shouldFallback(options?.enableFallback) && isTimeoutError(err)) {
          handleTimeoutFallback(err);
          return getMockInvestigationsPage(params);
        }
        throw err;
      }
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Queries a single investigation by UUID or slug, guarded when empty.
 * Seamlessly falls back to mock detail when backend is unavailable.
 */
export function useInvestigationDetailQuery(
  idOrSlug: string | undefined | null,
  options?: ApiQueryOptions<MappedInvestigationDetail>,
): UseQueryResult<MappedInvestigationDetail, Error> {
  const trimmed = normalizeNonEmptyId(idOrSlug);

  return useQuery<MappedInvestigationDetail, Error>({
    ...options,
    queryKey: apiQueryKeys.investigationDetail(trimmed),
    queryFn: async ({ signal }) => {
      try {
        const dto = isUuid(trimmed)
          ? await getInvestigationById(trimmed, signal)
          : await getInvestigationBySlug(trimmed, signal);
        return mapInvestigationDetailDto(dto);
      } catch (err) {
        if (shouldFallback(options?.enableFallback) && isTimeoutError(err)) {
          handleTimeoutFallback(err);
          return getMockInvestigationDetail(trimmed);
        }
        throw err;
      }
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
  options?: ApiQueryOptions<MappedPage<MappedTag>>,
): UseQueryResult<MappedPage<MappedTag>, Error> {
  return useScopedPaginatedQuery({
    id: investigationId,
    pagination,
    options,
    getQueryKey: apiQueryKeys.investigationTags,
    fetcher: getInvestigationTags,
    mapItem: mapTagDto,
    fallbackFetcher: (id) => {
      const detail = getMockInvestigationDetail(id);
      return {
        items: detail.tags,
        total: detail.tagsTotal,
        offset: 0,
        limit: 20,
        hasMore: false,
        next: null,
        context: FALLBACK_CONTEXT,
      };
    },
  });
}
