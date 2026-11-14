import type { UseQueryResult } from '@tanstack/react-query';
import type { PaginationParamsDto } from '@/api/dto';
import {
  mapConditionDto,
  mapMeasurementDto,
  mapObservationDto,
  mapRunDto,
} from '@/api/mappers';
import {
  listInvestigationMeasurements,
  listInvestigationRuns,
  listRunConditions,
  listRunMeasurements,
} from '@/api/services';
import {
  getMockConditions,
  getMockObservationsPage,
  getMockRunMeasurements,
  getMockRunsPage,
} from '@/api/mockFallback';
import type {
  MappedCondition,
  MappedMeasurement,
  MappedObservation,
  MappedPage,
  MappedRun,
} from '@/types/api';
import { type ApiQueryOptions, useScopedPaginatedQuery } from './queryHelpers';
import { apiQueryKeys } from './queryKeys';

/**
 * Queries paginated test runs for an investigation (`GET /investigations/{id}/runs`).
 */
export function useInvestigationRunsQuery(
  investigationId: string | undefined | null,
  pagination?: PaginationParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedRun>>
): UseQueryResult<MappedPage<MappedRun>, Error> {
  return useScopedPaginatedQuery({
    id: investigationId,
    pagination,
    options,
    getQueryKey: apiQueryKeys.investigationRuns,
    fetcher: listInvestigationRuns,
    mapItem: mapRunDto,
    fallbackFetcher: getMockRunsPage,
  });
}

/**
 * Queries paginated experimental conditions for a run (`GET /runs/{runId}/conditions`).
 */
export function useRunConditionsQuery(
  runId: string | undefined | null,
  pagination?: PaginationParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedCondition>>
): UseQueryResult<MappedPage<MappedCondition>, Error> {
  return useScopedPaginatedQuery({
    id: runId,
    pagination,
    options,
    getQueryKey: apiQueryKeys.runConditions,
    fetcher: listRunConditions,
    mapItem: mapConditionDto,
    fallbackFetcher: getMockConditions,
  });
}

/**
 * Queries paginated measurements for a run (`GET /runs/{runId}/measurements`).
 */
export function useRunMeasurementsQuery(
  runId: string | undefined | null,
  pagination?: PaginationParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedMeasurement>>
): UseQueryResult<MappedPage<MappedMeasurement>, Error> {
  return useScopedPaginatedQuery({
    id: runId,
    pagination,
    options,
    getQueryKey: apiQueryKeys.runMeasurements,
    fetcher: listRunMeasurements,
    mapItem: mapMeasurementDto,
    fallbackFetcher: getMockRunMeasurements,
  });
}

/**
 * Queries paginated observations for an investigation (`GET /investigations/{id}/measurements`).
 */
export function useInvestigationMeasurementsQuery(
  investigationId: string | undefined | null,
  pagination?: PaginationParamsDto,
  options?: ApiQueryOptions<MappedPage<MappedObservation>>
): UseQueryResult<MappedPage<MappedObservation>, Error> {
  return useScopedPaginatedQuery({
    id: investigationId,
    pagination,
    options,
    getQueryKey: apiQueryKeys.investigationMeasurements,
    fetcher: listInvestigationMeasurements,
    mapItem: mapObservationDto,
    fallbackFetcher: getMockObservationsPage,
  });
}
