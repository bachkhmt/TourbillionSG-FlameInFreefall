import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { InvestigationFilterParamsDto } from '@/api/dto';
import { mapDashboardSummaryDto } from '@/api/mappers';
import { getDashboardSummary } from '@/api/services';
import { getMockDashboardSummary } from '@/api/mockFallback';
import type { MappedDashboardSummary } from '@/types/api';
import type { ApiQueryOptions } from '@/hooks/api/queryHelpers';
import { shouldFallback } from '@/hooks/api/queryHelpers';
import { apiQueryKeys } from '@/hooks/api/queryKeys';

/**
 * Queries dashboard summary KPIs and featured investigations (`GET /dashboard/summary`).
 * Seamlessly falls back to offline archive data if the backend is unavailable.
 */
export function useDashboardSummaryQuery(
  filters?: InvestigationFilterParamsDto,
  options?: ApiQueryOptions<MappedDashboardSummary>
): UseQueryResult<MappedDashboardSummary, Error> {
  return useQuery<MappedDashboardSummary, Error>({
    ...options,
    queryKey: apiQueryKeys.dashboardSummary(filters),
    queryFn: async ({ signal }) => {
      try {
        const dto = await getDashboardSummary(filters, signal);
        return mapDashboardSummaryDto(dto);
      } catch (err) {
        if (shouldFallback(options?.enableFallback)) {
          return getMockDashboardSummary(filters);
        }
        throw err;
      }
    },
    enabled: options?.enabled ?? true,
  });
}
