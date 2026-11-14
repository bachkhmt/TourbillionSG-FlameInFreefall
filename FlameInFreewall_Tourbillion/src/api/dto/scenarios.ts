export type DimensionNameDto =
  | 'gravity'
  | 'material'
  | 'oxygen'
  | 'pressure'
  | 'airflow'
  | 'combined';

export type PillarDto = 'prevention' | 'detection' | 'suppression';

export interface GravityInputDto {
  value: string;
  unit: 'g';
}

export interface OxygenInputDto {
  value: string;
  unit: '%';
  meaning: 'ambient_oxygen_fraction_percent' | 'oxidizer_oxygen_fraction_percent';
}

export interface PressureInputDto {
  value: string;
  unit: 'psia';
}

export interface AirflowInputDto {
  value: string;
  unit: 'cm/s';
}

export interface MaterialInputDto {
  key: string;
  label?: string | null;
}

export interface ScenarioInputDto {
  name?: string | null;
  description?: string | null;
  environmentLabel?: string | null;
  presetKey?: string | null;
  material?: MaterialInputDto | null;
  gravity?: GravityInputDto | null;
  oxygen?: OxygenInputDto | null;
  pressure?: PressureInputDto | null;
  airflow?: AirflowInputDto | null;
}

export interface PagesDto {
  runOffset?: number;
  rankingOffset?: number;
  evidenceOffset?: number;
  limit?: number;
}

export interface BindingsDto {
  scenarioDigest?: string;
  collectionFingerprint?: string;
  collectionId?: string;
  datasetVersion?: string | null;
  identityVersion?: string | null;
  scenarioMappingVersion?: string;
  mappingVersion?: string | null;
  ruleVersion?: string | null;
  classificationVersion?: string | null;
  pillar?: PillarDto | null;
  rankingFingerprint?: string | null;
  classificationFingerprint?: string | null;
}

export interface EvaluationRequestDto {
  scenario: ScenarioInputDto;
  pillar?: PillarDto | null;
  pages?: PagesDto;
  expectedBindings?: BindingsDto | null;
}

export interface DimensionEvaluationDto {
  dimension: DimensionNameDto;
  status: 'support' | 'mismatch' | 'partial' | 'unknown' | 'unavailable';
  reasonCodes: string[];
  runId?: string | null;
  conditionIds?: string[];
}

export interface RunEvaluationDto {
  run: {
    runId: string;
    externalRunKey: string | null;
    investigation: {
      investigationId: string;
      psiId: string;
      slug: string | null;
    };
    materialType: string | null;
    sampleGeometry: string | null;
    gravity: string | null;
  };
  dimensions: DimensionEvaluationDto[];
  requiredConditionsComplete: boolean;
}

export interface RankedInvestigationDto {
  position: number;
  rank: number;
  investigation: {
    investigationId: string;
    psiId: string;
    slug: string | null;
  };
  externalExperimentId: string;
  scenarioRelevanceScore: string;
  catalogUsefulnessScore: string | null;
  rationale: string;
}

export interface PillarAssociationDto {
  associationId: string;
  pillar: PillarDto;
  claim: {
    claimId: string;
    claimText: string;
    evidenceStatus: string;
    reviewStatus: string;
    limitation: string | null;
  };
  document: {
    sourceDocumentId: string;
    investigationId: string;
    sourceUrl: string;
    doi: string | null;
    documentType: string;
  };
  sourceLocator: string;
  sourceExcerpt: string | null;
}

export interface PillarGroupDto {
  pillar: PillarDto;
  total: number;
  items: PillarAssociationDto[];
  reasonCodes: string[];
}

export interface EvaluationDto {
  scenario: {
    original: ScenarioInputDto;
    digest: string;
    fieldStates: Record<string, 'omitted' | 'null' | 'supplied'>;
    unavailableFields: DimensionNameDto[];
  };
  context: {
    collectionId: string;
    origin: 'synthetic' | 'real' | 'unknown';
    reviewState: 'unreviewed' | 'unknown' | 'curated';
    caveats: string[];
  };
  scope: BindingsDto;
  coverage: {
    state: 'evaluated' | 'unavailable' | 'rejected';
    reasonCodes: string[];
    items?: RunEvaluationDto[] | null;
    examinedRuns: number;
    requiredConditionsComplete: boolean | null;
    collectionTraversalComplete: boolean;
  };
  rankings: {
    state: 'evaluated' | 'unavailable' | 'rejected';
    reasonCodes: string[];
    items?: RankedInvestigationDto[] | null;
  };
  pillarEvidence: {
    state: 'evaluated' | 'unavailable' | 'rejected';
    reasonCodes: string[];
    groups?: PillarGroupDto[] | null;
  };
}
