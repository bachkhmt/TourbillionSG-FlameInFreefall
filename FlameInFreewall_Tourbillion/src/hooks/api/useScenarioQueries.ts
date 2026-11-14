import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { EvaluationDto, EvaluationRequestDto } from '@/api/dto';
import { evaluateMissionScenario } from '@/api/services';
import { getMockScenarioEvaluation } from '@/api/mockFallback';
import type { ApiQueryOptions } from './queryHelpers';
import { shouldFallback } from './queryHelpers';
import { apiQueryKeys } from './queryKeys';

function computeScenarioKey(request: EvaluationRequestDto): string {
  const sc = request.scenario;
  return `${sc.gravity?.value ?? '0g'}-${sc.oxygen?.value ?? '21%'}-${sc.pressure?.value ?? '14.7'}-${sc.material?.key ?? 'all'}`;
}

/**
 * Queries mission scenario evaluation across the 4 pillars (`POST /mission/scenarios/evaluate`).
 * Gracefully falls back to NASA PSI empirical baseline if backend is unavailable.
 */
export function useScenarioEvaluationQuery(
  request: EvaluationRequestDto,
  options?: ApiQueryOptions<EvaluationDto>
): UseQueryResult<EvaluationDto, Error> {
  const key = computeScenarioKey(request);

  return useQuery<EvaluationDto, Error>({
    ...options,
    queryKey: apiQueryKeys.scenarioEvaluation(key),
    queryFn: async ({ signal }) => {
      try {
        return await evaluateMissionScenario(request, signal);
      } catch (err) {
        if (shouldFallback(options?.enableFallback)) {
          return getMockScenarioEvaluation(request);
        }
        throw err;
      }
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Imperative mutation to evaluate a mission scenario.
 */
export function useEvaluateScenarioMutation(
  options?: UseMutationOptions<EvaluationDto, Error, EvaluationRequestDto>
): UseMutationResult<EvaluationDto, Error, EvaluationRequestDto> {
  return useMutation<EvaluationDto, Error, EvaluationRequestDto>({
    ...options,
    mutationFn: async (payload) => {
      try {
        return await evaluateMissionScenario(payload);
      } catch (err) {
        return getMockScenarioEvaluation(payload);
      }
    },
  });
}
