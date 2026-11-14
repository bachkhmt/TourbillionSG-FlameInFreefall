import type { ScenarioInputDto } from './scenarios';

export interface ReadinessDto {
  state: 'ready' | 'not_ready';
  reasons: string[];
  modelId?: string | null;
  modelVersion?: string | null;
  datasetVersion?: string | null;
  origin?: 'synthetic' | 'real' | 'unknown';
  capabilities?: Record<string, string>;
  limitations?: string[];
}

export interface PredictionRequestDto {
  modelId: string;
  expectedModelVersion: string;
  expectedDatasetVersion: string;
  observable: string;
  scenario: ScenarioInputDto;
}

export interface UncertaintyDto {
  lower: string;
  upper: string;
  methodRef: string;
}

export interface ProviderResultDto {
  modelId: string;
  modelVersion: string;
  datasetVersion: string;
  observable: string;
  value: string;
  unit: string;
  origin: 'synthetic' | 'real';
  providerVersion: string;
  collectionFingerprint: string;
  uncertainty: UncertaintyDto;
  limitations: string[];
}

export interface PredictionResponseDto {
  state: 'not_ready' | 'unsupported' | 'predicted';
  readiness: ReadinessDto;
  reasons: string[];
  result?: ProviderResultDto | null;
}
