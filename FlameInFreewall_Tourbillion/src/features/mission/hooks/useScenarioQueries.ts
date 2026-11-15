import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { EvaluationDto, EvaluationRequestDto } from '@/api/dto';
import { evaluateMissionScenario } from '@/api/services';
import type { ApiQueryOptions } from '@/hooks/api/queryHelpers';
import { apiQueryKeys } from '@/hooks/api/queryKeys';

function computeScenarioKey(request: EvaluationRequestDto): string {
  return JSON.stringify(request);
}

/**
 * Queries mission scenario evaluation for the selected research purpose (`POST /mission/scenarios/evaluate`).
 * Backend failures remain errors; no sample evidence is substituted.
 */
export function useScenarioEvaluationQuery(
  request: EvaluationRequestDto,
  options?: ApiQueryOptions<EvaluationDto>
): UseQueryResult<EvaluationDto, Error> {
  const key = computeScenarioKey(request);

  return useQuery<EvaluationDto, Error>({
    ...options,
    queryKey: apiQueryKeys.scenarioEvaluation(key),
    queryFn: ({ signal }) => evaluateMissionScenario(request, signal),
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
    mutationFn: (payload) => evaluateMissionScenario(payload),
  });
}
