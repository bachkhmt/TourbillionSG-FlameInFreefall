import { apiRequest, toPaginationQuery } from '../client';
import type {
  ConditionPageDto,
  MeasurementPageDto,
  ObservationPageDto,
  PaginationParamsDto,
  RunPageDto,
} from '../dto';

/**
 * Lists paginated test runs for an investigation (`GET /investigations/{id}/runs`).
 */
export function listInvestigationRuns(
  investigationId: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<RunPageDto> {
  return apiRequest<RunPageDto>(
    `/investigations/${encodeURIComponent(investigationId)}/runs`,
    { query: toPaginationQuery(pagination), signal }
  );
}

/**
 * Lists paginated experimental conditions for a run (`GET /runs/{runId}/conditions`).
 */
export function listRunConditions(
  runId: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<ConditionPageDto> {
  return apiRequest<ConditionPageDto>(
    `/runs/${encodeURIComponent(runId)}/conditions`,
    { query: toPaginationQuery(pagination), signal }
  );
}

/**
 * Lists paginated measurements for a run (`GET /runs/{runId}/measurements`).
 */
export function listRunMeasurements(
  runId: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<MeasurementPageDto> {
  return apiRequest<MeasurementPageDto>(
    `/runs/${encodeURIComponent(runId)}/measurements`,
    { query: toPaginationQuery(pagination), signal }
  );
}

/**
 * Lists paginated observations (measurement + run pairs) for an investigation (`GET /investigations/{id}/measurements`).
 */
export function listInvestigationMeasurements(
  investigationId: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<ObservationPageDto> {
  return apiRequest<ObservationPageDto>(
    `/investigations/${encodeURIComponent(investigationId)}/measurements`,
    { query: toPaginationQuery(pagination), signal }
  );
}
