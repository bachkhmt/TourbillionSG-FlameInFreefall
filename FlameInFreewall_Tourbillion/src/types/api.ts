import type { DataOriginDto, ReviewStateDto, UnavailableReason } from '@/api/dto';

export interface ApiContextMeta {
  collectionId: string;
  origin: DataOriginDto;
  reviewState: ReviewStateDto;
  caveats: string[];
  isSynthetic: boolean;
  isUnreviewed: boolean;
}

export type FieldAvailabilityMap = Record<string, UnavailableReason>;

export interface MappedPage<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  next: string | null;
  context: ApiContextMeta;
}

export interface MappedTag {
  id: string;
  slug: string;
  label: string;
  category: string | null;
  context: ApiContextMeta;
}

export interface MappedInvestigation {
  id: string;
  psiId: string;
  slug: string | null;
  routeKey: string;
  title: string;
  researchPurpose: string | null;
  platform: string | null;
  tags: MappedTag[];
  tagsTotal: number;
  unavailableFields: FieldAvailabilityMap;
  context: ApiContextMeta;
}

export interface MappedCollectionMeta {
  href: string;
  total: number;
}

export interface MappedInvestigationDetail extends MappedInvestigation {
  runsMeta: MappedCollectionMeta;
  sourcesMeta: MappedCollectionMeta;
  claimsMeta: MappedCollectionMeta;
}

export interface MappedCatalogCapabilities {
  supportedFilters: string[];
  supportedSorts: string[];
  unsupportedFilters: string[];
  unsupportedSorts: string[];
  unavailableDisplayFields: string[];
  maxPageSize: number;
  context: ApiContextMeta;
}

export interface MappedCondition {
  id: string;
  testRunId: string;
  variable: string;
  valueNumeric: number | null;
  rawValueNumeric: string | null;
  valueText: string | null;
  displayValue: string;
  unit: string | null;
  dataStatus: string;
  context: ApiContextMeta;
}

export interface MappedMeasurement {
  id: string;
  testRunId: string;
  observable: string;
  measuredValue: number | null;
  rawMeasuredValue: string | null;
  unit: string;
  rawAssetRef: string | null;
  uncertainty: number | null;
  rawUncertainty: string | null;
  displayValue: string;
  unavailableFields: FieldAvailabilityMap;
  context: ApiContextMeta;
}

export interface MappedRun {
  id: string;
  investigationId: string;
  externalRunKey: string | null;
  materialType: string | null;
  sampleGeometry: string | null;
  gravity: string | null;
  verification: string;
  conditionsCount: number;
  measurementsCount: number;
  unavailableFields: FieldAvailabilityMap;
  context: ApiContextMeta;
}

export interface MappedObservation {
  measurement: MappedMeasurement;
  run: MappedRun;
  context: ApiContextMeta;
}

export interface MappedSource {
  id: string;
  investigationId: string;
  sourceUrl: string;
  doi: string | null;
  documentType: string;
  version: string | null;
  ingestionStatus: string;
  context: ApiContextMeta;
}

export interface MappedClaimSource {
  id: string;
  claimId: string;
  source: MappedSource;
  testRunId: string | null;
  runInvestigationId: string | null;
  sourceLocator: string;
  sourceExcerpt: string | null;
  contextMismatch: boolean;
  context: ApiContextMeta;
}

export interface MappedClaim {
  id: string;
  claimText: string;
  evidenceStatus: string;
  reviewStatus: string;
  limitation: string | null;
  createdAt: string;
  sources: MappedClaimSource[];
  sourcesTotal: number;
  hasContextMismatch: boolean;
  context: ApiContextMeta;
}

export interface MappedSourceCoverage {
  numerator: number;
  denominator: number;
  ratio: number | null;
  percentage: number | null;
  rawRatio: string | null;
}

export interface MappedDashboardSummary {
  selection: Record<string, string>;
  investigationCount: number;
  runCount: number;
  claimCount: number;
  sourceCount: number;
  verifiedRunCount: number | null;
  sourceCoverage: MappedSourceCoverage;
  fuelDistribution: null;
  facilityDistribution: null;
  gravityDistribution: null;
  featuredInvestigations: MappedInvestigation[];
  unavailableFields: FieldAvailabilityMap;
  context: ApiContextMeta;
}

export interface MappedObservableSummary {
  observable: string;
  unit: string;
  count: number;
  minValue: number | null;
  maxValue: number | null;
}

export interface MappedComparisonStudy {
  investigation: MappedInvestigation;
  observations: MappedPage<MappedObservation>;
  observableSummaries: MappedObservableSummary[];
  observedMaterials: string[];
  observedGravities: string[];
  context: ApiContextMeta;
}

export interface MappedComparisonResult {
  studies: MappedComparisonStudy[];
  deltas: null;
  highlights: null;
  comparability: string;
  unavailableFields: FieldAvailabilityMap;
  context: ApiContextMeta;
}
