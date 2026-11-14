import { apiRequest, toPaginationQuery } from '../client';
import type {
  ClaimPageDto,
  ClaimSourcePageDto,
  PaginationParamsDto,
  SourcePageDto,
} from '../dto';

/**
 * Lists paginated source documents for an investigation (`GET /investigations/{id}/sources`).
 */
export function listInvestigationSources(
  investigationId: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<SourcePageDto> {
  return apiRequest<SourcePageDto>(
    `/investigations/${encodeURIComponent(investigationId)}/sources`,
    { query: toPaginationQuery(pagination), signal }
  );
}

/**
 * Lists paginated evidence claims for an investigation (`GET /investigations/{id}/claims`).
 */
export function listInvestigationClaims(
  investigationId: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<ClaimPageDto> {
  return apiRequest<ClaimPageDto>(
    `/investigations/${encodeURIComponent(investigationId)}/claims`,
    { query: toPaginationQuery(pagination), signal }
  );
}

/**
 * Lists paginated provenance links for a claim (`GET /claims/{claimId}/sources`).
 */
export function listClaimSources(
  claimId: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<ClaimSourcePageDto> {
  return apiRequest<ClaimSourcePageDto>(
    `/claims/${encodeURIComponent(claimId)}/sources`,
    { query: toPaginationQuery(pagination), signal }
  );
}
