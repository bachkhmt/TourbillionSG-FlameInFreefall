import { apiRequest, pickQueryParams } from '../client';
import type { DashboardDto, InvestigationFilterParamsDto } from '../dto';
import { INVESTIGATION_FILTER_KEYS } from './catalogService';

/**
 * Fetches dashboard summary KPIs and featured investigations (`GET /dashboard/summary`).
 * Strictly forwards only the 9 supported filter query keys (no `sort`, `offset`, or `limit`).
 */
export function getDashboardSummary(
  filters?: InvestigationFilterParamsDto,
  signal?: AbortSignal
): Promise<DashboardDto> {
  return apiRequest<DashboardDto>('/dashboard/summary', {
    query: pickQueryParams(filters, INVESTIGATION_FILTER_KEYS),
    signal,
  });
}
