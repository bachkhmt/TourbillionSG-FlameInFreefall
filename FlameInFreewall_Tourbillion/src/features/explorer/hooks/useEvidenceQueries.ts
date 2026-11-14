import type { UseQueryResult } from '@tanstack/react-query';
import type { PaginationParamsDto } from '@/api/dto';
import { mapClaimDto, mapClaimSourceDto, mapSourceDto } from '@/api/mappers';
import {
  listClaimSources,
  listInvestigationClaims,
  listInvestigationSources,
} from '@/api/services';
import {
  FALLBACK_CONTEXT,
  getMockClaimsPage,
  getMockClaimSourcesPage,
  getMockSourcesPage,
} from '@/api/mockFallback';
import type {
  MappedClaim,
  MappedClaimSource,
  MappedPage,
  MappedSource,
} from '@/types/api';
import { type ApiQueryOptions, useScopedPaginatedQuery } from '@/hooks/api/queryHelpers';
import { apiQueryKeys } from '@/hooks/api/queryKeys';

/**
 * Queries paginated source documents for an investigation (`GET /investigations/{id}/sources`).
 */
export function useInvestigationSourcesQuery(
  investigationId: string | undefined | null,
  pagination?: PaginationParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedSource>>
): UseQueryResult<MappedPage<MappedSource>, Error> {
  return useScopedPaginatedQuery({
    id: investigationId,
    pagination,
    options,
    getQueryKey: apiQueryKeys.investigationSources,
    fetcher: listInvestigationSources,
    mapItem: mapSourceDto,
    fallbackFetcher: getMockSourcesPage,
  });
}

/**
 * Queries paginated evidence claims for an investigation (`GET /investigations/{id}/claims`).
 */
export function useInvestigationClaimsQuery(
  investigationId: string | undefined | null,
  pagination?: PaginationParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedClaim>>
): UseQueryResult<MappedPage<MappedClaim>, Error> {
  return useScopedPaginatedQuery({
    id: investigationId,
    pagination,
    options,
    getQueryKey: apiQueryKeys.investigationClaims,
    fetcher: listInvestigationClaims,
    mapItem: mapClaimDto,
    fallbackFetcher: getMockClaimsPage,
  });
}

/**
 * Queries paginated provenance links for a claim (`GET /claims/{claimId}/sources`).
 */
export function useClaimSourcesQuery(
  claimId: string | undefined | null,
  pagination?: PaginationParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedClaimSource>>
): UseQueryResult<MappedPage<MappedClaimSource>, Error> {
  return useScopedPaginatedQuery({
    id: claimId,
    pagination,
    options,
    getQueryKey: apiQueryKeys.claimSources,
    fetcher: listClaimSources,
    mapItem: mapClaimSourceDto,
    fallbackFetcher: getMockClaimSourcesPage,
  });
}
