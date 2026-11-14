import { apiRequest } from '../client';
import type { HealthDto, ReadyDto } from '../dto';

/**
 * Fetches backend liveness status (`GET /health`).
 */
export function getHealth(signal?: AbortSignal): Promise<HealthDto> {
  return apiRequest<HealthDto>('/health', { signal });
}

/**
 * Fetches backend readiness & database connectivity (`GET /ready`).
 */
export function getReady(signal?: AbortSignal): Promise<ReadyDto> {
  return apiRequest<ReadyDto>('/ready', { signal });
}
