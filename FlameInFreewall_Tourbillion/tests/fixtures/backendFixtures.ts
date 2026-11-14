import type {
  ApiErrorEnvelopeDto, CatalogCapabilitiesDto, ClaimDto, ClaimSourceDto,
  ComparisonDto, ConditionDto, ContextDto, DashboardDto, InvestigationDetailDto,
  InvestigationDto, MeasurementDto, ObservationDto, PaginatedPageDto, RunDto,
  SourceDto, TagDto,
} from '@/api/dto';

const INV_1_ID = 'e1a75331-3f1f-57b8-9042-405ff61dff51';
const INV_2_ID = 'afa58280-0d0c-58a3-926a-1499a1e20a96';
const RUN_1_ID = 'b8f882f6-6fde-5b18-a505-f668bdc12c42';
const RUN_2_ID = 'f04922ad-2fbf-5afe-ba7e-bc5a01b9149f';
const SOURCE_1_ID = 'd0127a19-6b2a-5186-8dd6-8ffb213832c2';
const CLAIM_1_ID = '1dc0b6db-25b6-5438-9322-ec1d4cf35f58';

/** Builds a synthetic Phase 4 `ContextDto` fixture. */
export function makeContextDto(overrides: Partial<ContextDto> = {}): ContextDto {
  return {
    collectionId: 'synthetic-phase4-v1', origin: 'synthetic', reviewState: 'unreviewed',
    caveats: ['SYNTHETIC TEST ONLY; not a NASA finding'], ...overrides,
  };
}

/** Builds a typed `PaginatedPageDto<T>` fixture around `items`. */
export function makePageDto<T>(
  items: T[],
  overrides: Partial<Omit<PaginatedPageDto<T>, 'items'>> = {}
): PaginatedPageDto<T> {
  return {
    items, total: overrides.total ?? items.length, offset: overrides.offset ?? 0,
    limit: overrides.limit ?? 20, next: overrides.next ?? null,
    context: overrides.context ?? makeContextDto(),
  };
}

/** Builds a `TagDto` fixture. */
export function makeTagDto(overrides: Partial<TagDto> = {}): TagDto {
  return {
    id: 'f9411dd8-413d-5791-85a2-53d7f5877e36', slug: 'synthetic-phase4-tag',
    label: 'Synthetic classification', category: null, context: makeContextDto(), ...overrides,
  };
}

/** Builds an `InvestigationDto` fixture. */
export function makeInvestigationDto(overrides: Partial<InvestigationDto> = {}): InvestigationDto {
  const context = overrides.context ?? makeContextDto();
  return {
    id: INV_1_ID, psiId: 'SYNTHETIC-PHASE4-1', slug: null, title: 'Synthetic tied title',
    researchPurpose: 'TEST_ONLY exploration', platform: 'TEST_PLATFORM',
    tags: makePageDto([makeTagDto({ context })], { context }),
    unavailableFields: { slug: 'UNSUPPORTED_MAPPING' }, context, ...overrides,
  };
}

/** Builds an `InvestigationDetailDto` fixture with collection links. */
export function makeInvestigationDetailDto(
  overrides: Partial<InvestigationDetailDto> = {}
): InvestigationDetailDto {
  const base = makeInvestigationDto(overrides);
  return {
    ...base,
    runs: { href: `/api/v1/investigations/${base.id}/runs`, total: 2 },
    sources: { href: `/api/v1/investigations/${base.id}/sources`, total: 2 },
    claims: { href: `/api/v1/investigations/${base.id}/claims`, total: 1 },
    ...overrides,
  };
}

/** Builds a `RunDto` fixture. */
export function makeRunDto(overrides: Partial<RunDto> = {}): RunDto {
  const id = overrides.id ?? RUN_1_ID;
  const context = overrides.context ?? makeContextDto();
  return {
    id, investigationId: INV_1_ID, externalRunKey: 'TEST_ONLY_RUN',
    materialType: 'TEST_MATERIAL_A', sampleGeometry: null, gravity: '0g', verification: 'unknown',
    unavailableFields: { verification: 'VERIFICATION_NOT_ESTABLISHED' },
    conditions: { href: `/api/v1/runs/${id}/conditions`, total: 1 },
    measurements: { href: `/api/v1/runs/${id}/measurements`, total: 1 },
    context, ...overrides,
  };
}

/** Builds a `ConditionDto` fixture. */
export function makeConditionDto(overrides: Partial<ConditionDto> = {}): ConditionDto {
  return {
    id: '9ecacd48-1779-5eb3-ad27-1c8d24126183', testRunId: RUN_1_ID,
    variable: 'TEST_ONLY_OXYGEN', valueNumeric: '0', valueText: null, unit: '%',
    dataStatus: 'TEST_ONLY', context: makeContextDto(), ...overrides,
  };
}

/** Builds a `MeasurementDto` fixture. */
export function makeMeasurementDto(overrides: Partial<MeasurementDto> = {}): MeasurementDto {
  return {
    id: 'df180e4b-1e90-5815-b67a-6cba24b2ce89', testRunId: RUN_1_ID,
    observable: 'TEST_ONLY_OBSERVABLE', measuredValue: '0', unit: 'mm/s',
    rawAssetRef: 'https://example.invalid/synthetic/raw', uncertainty: null,
    unavailableFields: { uncertainty: 'MISSING_SOURCE_DATA' }, context: makeContextDto(), ...overrides,
  };
}

/** Builds an `ObservationDto` fixture. */
export function makeObservationDto(overrides: Partial<ObservationDto> = {}): ObservationDto {
  const context = overrides.context ?? makeContextDto();
  return {
    measurement: makeMeasurementDto({ context }), run: makeRunDto({ context }), context, ...overrides,
  };
}

/** Builds a `SourceDto` fixture. */
export function makeSourceDto(overrides: Partial<SourceDto> = {}): SourceDto {
  return {
    id: SOURCE_1_ID, investigationId: INV_1_ID,
    sourceUrl: 'https://example.invalid/synthetic/0', doi: null, documentType: 'TEST_ONLY',
    version: null, ingestionStatus: 'SYNTHETIC_UNREVIEWED', context: makeContextDto(), ...overrides,
  };
}

/** Builds a `ClaimSourceDto` fixture. */
export function makeClaimSourceDto(overrides: Partial<ClaimSourceDto> = {}): ClaimSourceDto {
  const context = overrides.context ?? makeContextDto();
  return {
    id: '63371883-7b34-5688-b4f7-fd40d13e0e7f', claimId: CLAIM_1_ID,
    source: makeSourceDto({ context }), testRunId: RUN_1_ID, runInvestigationId: INV_1_ID,
    sourceLocator: 'TEST_ONLY locator 0', sourceExcerpt: 'SYNTHETIC excerpt',
    contextMismatch: false, context, ...overrides,
  };
}

/** Builds a `ClaimDto` fixture. */
export function makeClaimDto(overrides: Partial<ClaimDto> = {}): ClaimDto {
  const context = overrides.context ?? makeContextDto();
  const claimId = overrides.id ?? CLAIM_1_ID;
  return {
    id: claimId, claimText: 'SYNTHETIC TEST ONLY; not a NASA finding',
    evidenceStatus: 'TEST_ONLY', reviewStatus: 'SYNTHETIC_UNREVIEWED',
    limitation: 'No scientific validity', createdAt: '2020-01-01T00:00:00Z',
    sources: makePageDto([makeClaimSourceDto({ claimId, context })], { context }),
    context, ...overrides,
  };
}

/** Builds a `DashboardDto` fixture with gated aggregate fields set to `null`. */
export function makeDashboardDto(overrides: Partial<DashboardDto> = {}): DashboardDto {
  const context = overrides.context ?? makeContextDto();
  return {
    selection: { collectionId: context.collectionId },
    investigationCount: 4, runCount: 4, claimCount: 2, sourceCount: 3, verifiedRunCount: null,
    sourceCoverage: { numerator: 2, denominator: 4, ratio: '0.5' },
    fuelDistribution: null, facilityDistribution: null, gravityDistribution: null,
    featuredInvestigations: [
      makeInvestigationDto({ context }),
      makeInvestigationDto({ id: INV_2_ID, psiId: 'SYNTHETIC-PHASE4-2', context }),
    ],
    unavailableFields: {
      verifiedRunCount: 'VERIFICATION_NOT_ESTABLISHED',
      fuelDistribution: 'UNSUPPORTED_MAPPING',
      facilityDistribution: 'UNSUPPORTED_MAPPING',
      gravityDistribution: 'UNSUPPORTED_MAPPING',
    },
    context, ...overrides,
  };
}

/** Builds a `ComparisonDto` fixture across two synthetic investigations. */
export function makeComparisonDto(overrides: Partial<ComparisonDto> = {}): ComparisonDto {
  const context = overrides.context ?? makeContextDto();
  const study1 = makeInvestigationDto({ id: INV_1_ID, psiId: 'SYNTHETIC-PHASE4-1', context });
  const study2 = makeInvestigationDto({ id: INV_2_ID, psiId: 'SYNTHETIC-PHASE4-2', context });
  const run2 = makeRunDto({ id: RUN_2_ID, investigationId: INV_2_ID, gravity: '1g', context });
  const meas2 = makeMeasurementDto({ id: '63b3f138-0d4a-5bfc-81e5-ea1e5a4168f4', testRunId: RUN_2_ID, measuredValue: null, context });
  return {
    studies: [
      { investigation: study1, observations: makePageDto([makeObservationDto({ context })], { context }), context },
      { investigation: study2, observations: makePageDto([makeObservationDto({ run: run2, measurement: meas2, context })], { context }), context },
    ],
    deltas: null, highlights: null, comparability: 'not_established',
    unavailableFields: { deltas: 'SCIENTIFIC_COMPARISON_NOT_APPROVED', highlights: 'SCIENTIFIC_COMPARISON_NOT_APPROVED' },
    context, ...overrides,
  };
}

/** Builds a `CatalogCapabilitiesDto` fixture. */
export function makeCapabilitiesDto(overrides: Partial<CatalogCapabilitiesDto> = {}): CatalogCapabilitiesDto {
  return {
    supportedFilters: ['q', 'platform', 'material', 'gravityRaw', 'tag', 'purpose'],
    supportedSorts: ['title-asc', 'runs-desc'],
    unsupportedFilters: ['evidenceStatus', 'reviewStatus', 'sourceType'],
    unsupportedSorts: ['relevance'],
    unavailableDisplayFields: ['slug', 'verification'],
    maxPageSize: 100, context: makeContextDto(), ...overrides,
  };
}

/** Builds an `ApiErrorEnvelopeDto` fixture. */
export function makeApiErrorEnvelopeDto(overrides: Partial<ApiErrorEnvelopeDto> = {}): ApiErrorEnvelopeDto {
  return {
    error: {
      code: 'INVALID_REQUEST', message: 'Synthetic invalid request error',
      fields: ['limit'], supportedValues: ['1..100'], ...overrides.error,
    },
    context: overrides.context ?? makeContextDto(),
  };
}
