import { ApiClientError, apiRequest } from '../client';
import type { ComparisonDto, ComparisonRequestDto } from '../dto';

/**
 * Compares 2 to 3 distinct investigations (`POST /compare`).
 * Validates distinct non-empty IDs client-side before sending the request.
 */
export async function compareInvestigations(
  payload: ComparisonRequestDto,
  signal?: AbortSignal
): Promise<ComparisonDto> {
  const trimmedIds = (payload.investigationIds ?? [])
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  const uniqueIds = Array.from(new Set(trimmedIds));

  if (
    uniqueIds.length < 2 ||
    uniqueIds.length > 3 ||
    uniqueIds.length !== trimmedIds.length
  ) {
    throw new ApiClientError({
      message: 'Comparison requires 2 to 3 distinct non-empty investigation IDs.',
      status: 422,
      code: 'INVALID_REQUEST',
      fields: ['investigationIds'],
      supportedValues: [],
    });
  }

  const body: ComparisonRequestDto = {
    investigationIds: uniqueIds,
    ...(payload.observationOffset !== undefined
      ? { observationOffset: payload.observationOffset }
      : {}),
    ...(payload.observationLimit !== undefined
      ? { observationLimit: payload.observationLimit }
      : {}),
  };

  return apiRequest<ComparisonDto>('/compare', {
    method: 'POST',
    body,
    signal,
  });
}
