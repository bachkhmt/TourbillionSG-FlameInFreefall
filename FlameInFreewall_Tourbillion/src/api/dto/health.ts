export interface HealthDto {
  status: string;
  service: string;
}

export interface ReadyDto {
  status: 'ready' | 'unavailable' | string;
  service: string;
  database: 'ok' | 'unavailable' | string;
}

/**
 * Runtime type guard for backend `/ready` readiness probe responses.
 */
export function isReadyDto(value: unknown): value is ReadyDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.status === 'string' &&
    typeof record.service === 'string' &&
    typeof record.database === 'string'
  );
}
