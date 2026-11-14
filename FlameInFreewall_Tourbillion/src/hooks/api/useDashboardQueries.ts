import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { InvestigationFilterParamsDto } from '@/api/dto';
import { mapDashboardSummaryDto } from '@/api/mappers';
import { getDashboardSummary } from '@/api/services';
import type { MappedDashboardSummary } from '@/types/api';
import type { ApiQueryOptions } from './queryHelpers';
import { apiQueryKeys } from './queryKeys';

/**
 * Queries dashboard summary KPIs and featured investigations (`GET /dashboard/summary`).
 */
export function useDashboardSummaryQuery(
  filters?: InvestigationFilterParamsDto,
  options?: ApiQueryOptions<MappedDashboardSummary>
): UseQueryResult<MappedDashboardSummary, Error> {
  return useQuery<MappedDashboardSummary, Error>({
    ...options,
    queryKey: apiQueryKeys.dashboardSummary(filters),
    queryFn: async ({ signal }) =>
      mapDashboardSummaryDto(await getDashboardSummary(filters, signal)),
    enabled: options?.enabled ?? true,
  });
}
