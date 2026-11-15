import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { EvaluationDto, EvaluationRequestDto } from "@/api/dto";
import { evaluateMissionScenario } from "@/api/services";
import type { ApiQueryOptions } from "@/hooks/api/queryHelpers";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function useScenarioEvaluationQuery(
  request: EvaluationRequestDto,
  options?: ApiQueryOptions<EvaluationDto>,
) {
  return useQuery<EvaluationDto, Error>({
    ...options,
    queryKey: ["scenario-evaluation", request],
    queryFn: ({ signal }) => evaluateMissionScenario(request, signal),
  });
}

export function useEvaluateScenarioMutation(
  options?: UseMutationOptions<EvaluationDto, Error, EvaluationRequestDto>,
) {
  return useMutation<EvaluationDto, Error, EvaluationRequestDto>({
    ...options,
    mutationFn: (payload) => evaluateMissionScenario(payload),
  });
}

export function useActiveScenarioEvaluation() {
  const scenario = useWorkspaceStore((state) => state.activeScenario);
  return useScenarioEvaluationQuery({
    scenario: {
      name: scenario.name,
      material: { key: scenario.material },
      gravity: { value: String(scenario.gravity), unit: "g" },
      oxygen: {
        value: String(scenario.oxygenPct),
        unit: "%",
        meaning: "ambient_oxygen_fraction_percent",
      },
      pressure: { value: String(scenario.pressurePsi), unit: "psia" },
      airflow: { value: String(scenario.airflowVelocity), unit: "cm/s" },
    },
  });
}
