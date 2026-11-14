import { apiGet, apiPost } from '../client';
import type {
  PredictionRequestDto,
  PredictionResponseDto,
  ReadinessDto,
} from '../dto';

/**
 * Checks physical model readiness and capability declarations (`GET /prediction/readiness`).
 */
export function getPredictionReadiness(
  modelId?: string,
  signal?: AbortSignal
): Promise<ReadinessDto> {
  return apiGet<ReadinessDto>(
    '/prediction/readiness',
    modelId ? { model_id: modelId } : undefined,
    signal
  );
}

/**
 * Executes a microgravity predictive combustion physics calculation (`POST /predictions`).
 */
export function executePrediction(
  payload: PredictionRequestDto,
  signal?: AbortSignal
): Promise<PredictionResponseDto> {
  return apiPost<PredictionResponseDto>('/predictions', payload, signal);
}
