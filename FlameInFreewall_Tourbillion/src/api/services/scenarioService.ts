import { apiPost } from '../client';
import type { EvaluationDto, EvaluationRequestDto } from '../dto';

/**
 * Evaluates scoped empirical evidence for a mission scenario across the 4 pillars (`POST /mission/scenarios/evaluate`).
 */
export function evaluateMissionScenario(
  payload: EvaluationRequestDto,
  signal?: AbortSignal
): Promise<EvaluationDto> {
  return apiPost<EvaluationDto>('/mission/scenarios/evaluate', payload, signal);
}
