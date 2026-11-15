import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type {
  PredictionRequestDto,
  PredictionResponseDto,
  ReadinessDto,
} from "@/api/dto";
import { executePrediction, getPredictionReadiness } from "@/api/services";
import type { ApiQueryOptions } from "@/hooks/api/queryHelpers";

export function usePredictionReadinessQuery(
  modelId?: string,
  options?: ApiQueryOptions<ReadinessDto>,
) {
  return useQuery<ReadinessDto, Error>({
    ...options,
    queryKey: ["prediction-readiness", modelId],
    queryFn: ({ signal }) => getPredictionReadiness(modelId, signal),
  });
}

export function usePredictionMutation(
  options?: UseMutationOptions<
    PredictionResponseDto,
    Error,
    PredictionRequestDto
  >,
) {
  return useMutation<PredictionResponseDto, Error, PredictionRequestDto>({
    ...options,
    mutationFn: (payload) => executePrediction(payload),
  });
}
