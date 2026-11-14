import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { ComparisonRequestDto } from '@/api/dto';
import { mapComparisonDto } from '@/api/mappers';
import { compareInvestigations } from '@/api/services';
import { getMockComparisonResult } from '@/api/mockFallback';
import type { MappedComparisonResult } from '@/types/api';
import type { ApiQueryOptions } from './queryHelpers';
import { shouldFallback } from './queryHelpers';
import { apiQueryKeys } from './queryKeys';

function normalizeComparisonIds(
  investigationIds: ReadonlyArray<string>
): string[] {
  const seen = new Set<string>();
  for (const id of investigationIds) {
    const trimmed = id.trim();
    if (trimmed.length > 0) {
      seen.add(trimmed);
    }
  }
  return Array.from(seen);
}

/**
 * Queries side-by-side comparison across 2 to 3 distinct investigations (`POST /compare`).
 * Disabled automatically when distinct non-empty IDs fall outside `[2, 3]`.
 * Seamlessly falls back to offline comparative analysis if backend is unavailable.
 */
export function useComparisonQuery(
  investigationIds: string[],
  pagination?: { observationOffset?: number; observationLimit?: number },
  options?: ApiQueryOptions<MappedComparisonResult>
): UseQueryResult<MappedComparisonResult, Error> {
  const normalizedIds = normalizeComparisonIds(investigationIds);
  const isValidSelection =
    normalizedIds.length >= 2 && normalizedIds.length <= 3;

  return useQuery<MappedComparisonResult, Error>({
    ...options,
    queryKey: apiQueryKeys.comparison(normalizedIds, pagination),
    queryFn: async ({ signal }) => {
      try {
        const dto = await compareInvestigations(
          {
            investigationIds: normalizedIds,
            ...(pagination?.observationOffset !== undefined
              ? { observationOffset: pagination.observationOffset }
              : {}),
            ...(pagination?.observationLimit !== undefined
              ? { observationLimit: pagination.observationLimit }
              : {}),
          },
          signal
        );
        return mapComparisonDto(dto);
      } catch (err) {
        if (shouldFallback(options?.enableFallback)) {
          return getMockComparisonResult(normalizedIds);
        }
        throw err;
      }
    },
    enabled: isValidSelection && (options?.enabled ?? true),
  });
}

/**
 * Imperative mutation wrapper around `POST /compare` returning a mapped comparison result.
 */
export function useCompareInvestigationsMutation(
  options?: Omit<
    UseMutationOptions<MappedComparisonResult, Error, ComparisonRequestDto>,
    'mutationFn'
  >
): UseMutationResult<MappedComparisonResult, Error, ComparisonRequestDto> {
  return useMutation<MappedComparisonResult, Error, ComparisonRequestDto>({
    ...options,
    mutationFn: async (payload) =>
      mapComparisonDto(await compareInvestigations(payload)),
  });
}
