import { apiRequest, pickQueryParams, toPaginationQuery } from '../client';
import type {
  CatalogCapabilitiesDto,
  InvestigationDetailDto,
  InvestigationFilterParamsDto,
  InvestigationListParamsDto,
  InvestigationPageDto,
  PaginationParamsDto,
  TagPageDto,
} from '../dto';

export const INVESTIGATION_FILTER_KEYS: readonly (keyof InvestigationFilterParamsDto & string)[] = [
  'q',
  'platform',
  'material',
  'gravityRaw',
  'tag',
  'purpose',
  'sourceType',
  'evidenceStatus',
  'reviewStatus',
] as const;

const INVESTIGATION_LIST_KEYS: readonly (keyof InvestigationListParamsDto & string)[] = [
  ...INVESTIGATION_FILTER_KEYS,
  'sort',
  'offset',
  'limit',
] as const;

/**
 * Fetches supported and unsupported filter/sort capabilities (`GET /catalog/capabilities`).
 */
export function getCatalogCapabilities(signal?: AbortSignal): Promise<CatalogCapabilitiesDto> {
  return apiRequest<CatalogCapabilitiesDto>('/catalog/capabilities', { signal });
}

/**
 * Lists investigations matching supported catalog filters, sort, and pagination (`GET /investigations`).
 */
export function listInvestigations(
  params?: InvestigationListParamsDto,
  signal?: AbortSignal
): Promise<InvestigationPageDto> {
  return apiRequest<InvestigationPageDto>('/investigations', {
    query: pickQueryParams(params, INVESTIGATION_LIST_KEYS),
    signal,
  });
}

/**
 * Fetches a single investigation detail by UUID (`GET /investigations/{id}`).
 */
export function getInvestigationById(
  investigationId: string,
  signal?: AbortSignal
): Promise<InvestigationDetailDto> {
  return apiRequest<InvestigationDetailDto>(
    `/investigations/${encodeURIComponent(investigationId)}`,
    { signal }
  );
}

/**
 * Fetches a single investigation detail by slug (`GET /investigations/by-slug/{slug}`).
 */
export function getInvestigationBySlug(
  slug: string,
  signal?: AbortSignal
): Promise<InvestigationDetailDto> {
  return apiRequest<InvestigationDetailDto>(
    `/investigations/by-slug/${encodeURIComponent(slug)}`,
    { signal }
  );
}

/**
 * Lists paginated tags attached to an investigation (`GET /investigations/{id}/tags`).
 */
export function getInvestigationTags(
  investigationId: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<TagPageDto> {
  return apiRequest<TagPageDto>(
    `/investigations/${encodeURIComponent(investigationId)}/tags`,
    { query: toPaginationQuery(pagination), signal }
  );
}
