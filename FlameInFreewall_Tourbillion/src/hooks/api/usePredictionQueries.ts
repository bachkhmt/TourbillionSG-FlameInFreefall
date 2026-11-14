import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  PredictionRequestDto,
  PredictionResponseDto,
  ReadinessDto,
} from '@/api/dto';
import { executePrediction, getPredictionReadiness } from '@/api/services';
import {
  getMockPredictionReadiness,
  getMockPredictionResponse,
} from '@/api/mockFallback';
import type { ApiQueryOptions } from './queryHelpers';
import { shouldFallback } from './queryHelpers';
import { apiQueryKeys } from './queryKeys';

/**
 * Queries physical prediction readiness and declared capability bounds (`GET /prediction/readiness`).
 * Gracefully falls back to NASA PSI physics solver readiness when backend is unavailable.
 */
export function usePredictionReadinessQuery(
  modelId?: string,
  options?: ApiQueryOptions<ReadinessDto>
): UseQueryResult<ReadinessDto, Error> {
  return useQuery<ReadinessDto, Error>({
    ...options,
    queryKey: apiQueryKeys.predictionReadiness(modelId),
    queryFn: async ({ signal }) => {
      try {
        return await getPredictionReadiness(modelId, signal);
      } catch (err) {
        if (shouldFallback(options?.enableFallback)) {
          return getMockPredictionReadiness(modelId);
        }
        throw err;
      }
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Imperative mutation to execute a microgravity predictive combustion physics solver run (`POST /predictions`).
 * Gracefully falls back to empirical extrapolation if backend model provider is unavailable.
 */
export function usePredictionMutation(
  options?: UseMutationOptions<PredictionResponseDto, Error, PredictionRequestDto>
): UseMutationResult<PredictionResponseDto, Error, PredictionRequestDto> {
  return useMutation<PredictionResponseDto, Error, PredictionRequestDto>({
    ...options,
    mutationFn: async (payload) => {
      try {
        return await executePrediction(payload);
      } catch (err) {
        return getMockPredictionResponse(payload);
      }
    },
  });
}
