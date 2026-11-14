import type {
  InvestigationFilterParamsDto,
  InvestigationListParamsDto,
  PaginationParamsDto,
} from '@/api/dto';

/**
 * Hierarchical TanStack Query cache keys for FlameGuard backend API endpoints.
 */
export const apiQueryKeys = {
  health: ['api', 'health'] as const,
  ready: ['api', 'ready'] as const,
  catalogCapabilities: ['api', 'catalog', 'capabilities'] as const,
  investigations: (params?: InvestigationListParamsDto) =>
    ['api', 'investigations', params ?? {}] as const,
  investigationDetail: (idOrSlug: string) =>
    ['api', 'investigation', idOrSlug] as const,
  investigationTags: (id: string, pagination?: PaginationParamsDto) =>
    ['api', 'investigation', id, 'tags', pagination ?? {}] as const,
  investigationRuns: (id: string, pagination?: PaginationParamsDto) =>
    ['api', 'investigation', id, 'runs', pagination ?? {}] as const,
  investigationMeasurements: (id: string, pagination?: PaginationParamsDto) =>
    ['api', 'investigation', id, 'measurements', pagination ?? {}] as const,
  runConditions: (runId: string, pagination?: PaginationParamsDto) =>
    ['api', 'run', runId, 'conditions', pagination ?? {}] as const,
  runMeasurements: (runId: string, pagination?: PaginationParamsDto) =>
    ['api', 'run', runId, 'measurements', pagination ?? {}] as const,
  investigationSources: (id: string, pagination?: PaginationParamsDto) =>
    ['api', 'investigation', id, 'sources', pagination ?? {}] as const,
  investigationClaims: (id: string, pagination?: PaginationParamsDto) =>
    ['api', 'investigation', id, 'claims', pagination ?? {}] as const,
  claimSources: (claimId: string, pagination?: PaginationParamsDto) =>
    ['api', 'claim', claimId, 'sources', pagination ?? {}] as const,
  dashboardSummary: (filters?: InvestigationFilterParamsDto) =>
    ['api', 'dashboard', 'summary', filters ?? {}] as const,
  comparison: (
    investigationIds: string[],
    pagination?: { observationOffset?: number; observationLimit?: number }
  ) => ['api', 'compare', [...investigationIds].sort(), pagination ?? {}] as const,
  chatReadiness: ['api', 'chat', 'readiness'] as const,
  chatHistory: (sessionId: string, offset: number) =>
    ['api', 'chat', 'history', sessionId, offset] as const,
  chatSource: (sourceId: string, locator: string, corpusVersion: string) =>
    ['api', 'chat', 'source', sourceId, locator, corpusVersion] as const,
  scenarioEvaluation: (digestOrId: string) =>
    ['api', 'scenario', 'evaluation', digestOrId] as const,
  predictionReadiness: (modelId?: string) =>
    ['api', 'prediction', 'readiness', modelId ?? 'default'] as const,
} as const;
