import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { HealthDto, ReadyDto } from '@/api/dto';
import { getHealth, getReady } from '@/api/services';
import type { ApiQueryOptions } from '@/hooks/api/queryHelpers';
import { apiQueryKeys } from '@/hooks/api/queryKeys';

/**
 * Queries backend liveness probe (`GET /health`).
 */
export function useHealthQuery(
  options?: ApiQueryOptions<HealthDto>
): UseQueryResult<HealthDto, Error> {
  return useQuery<HealthDto, Error>({
    ...options,
    queryKey: apiQueryKeys.health,
    queryFn: ({ signal }) => getHealth(signal),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Queries backend readiness & database connectivity (`GET /ready`).
 */
export function useReadyQuery(
  options?: ApiQueryOptions<ReadyDto>
): UseQueryResult<ReadyDto, Error> {
  return useQuery<ReadyDto, Error>({
    ...options,
    queryKey: apiQueryKeys.ready,
    queryFn: ({ signal }) => getReady(signal),
    enabled: options?.enabled ?? true,
  });
}
