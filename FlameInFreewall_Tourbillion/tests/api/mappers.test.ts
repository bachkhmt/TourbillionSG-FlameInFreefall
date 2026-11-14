import { describe, it, expect } from 'vitest';
import {
  computeNumericRange,
  formatDecimalDisplay,
  getFieldUnavailableReason,
  mapCatalogCapabilitiesDto,
  mapClaimDto,
  mapClaimSourceDto,
  mapComparisonDto,
  mapConditionDto,
  mapContext,
  mapDashboardSummaryDto,
  mapInvestigationDetailDto,
  mapInvestigationDto,
  mapMeasurementDto,
  mapObservationDto,
  mapPaginatedPage,
  mapRunDto,
  mapSourceDto,
  mapTagDto,
  mapUnavailableFields,
  parseDecimalString,
} from '@/api/mappers';
import {
  makeCapabilitiesDto,
  makeClaimDto,
  makeClaimSourceDto,
  makeComparisonDto,
  makeConditionDto,
  makeContextDto,
  makeDashboardDto,
  makeInvestigationDetailDto,
  makeInvestigationDto,
  makeMeasurementDto,
  makeObservationDto,
  makePageDto,
  makeRunDto,
  makeSourceDto,
  makeTagDto,
} from '../fixtures/backendFixtures';

describe('decimalMapper', () => {
  it('parses valid DecimalString values strictly and normalizes -0', () => {
    expect(parseDecimalString('21.0')).toBe(21);
    expect(parseDecimalString('-0.16')).toBe(-0.16);
    expect(parseDecimalString('0')).toBe(0);
    expect(Object.is(parseDecimalString('-0'), 0)).toBe(true);
    expect(parseDecimalString('  +42.5  ')).toBe(42.5);
    expect(parseDecimalString('.75')).toBe(0.75);
  });

  it('rejects scientific notation, non-numeric strings, and nullish values', () => {
    expect(parseDecimalString('1e5')).toBeNull();
    expect(parseDecimalString('1E-3')).toBeNull();
    expect(parseDecimalString('NaN')).toBeNull();
    expect(parseDecimalString('Infinity')).toBeNull();
    expect(parseDecimalString('12.')).toBeNull();
    expect(parseDecimalString('abc')).toBeNull();
    expect(parseDecimalString('')).toBeNull();
    expect(parseDecimalString('   ')).toBeNull();
    expect(parseDecimalString(null)).toBeNull();
    expect(parseDecimalString(undefined)).toBeNull();
  });

  it('formats decimal values with optional units and fallback', () => {
    expect(formatDecimalDisplay('21.0', '%')).toBe('21 %');
    expect(formatDecimalDisplay(-0.16, 'mm/s')).toBe('-0.16 mm/s');
    expect(formatDecimalDisplay('0', '  ')).toBe('0');
    expect(formatDecimalDisplay(null, 'mm/s')).toBe('—');
    expect(formatDecimalDisplay('1e5', 'mm/s', 'Unavailable')).toBe('Unavailable');
  });

  it('computes numeric ranges while ignoring null and invalid entries', () => {
    expect(computeNumericRange(['10.5', null, -2, '1e5', '4.25', undefined])).toEqual({
      min: -2,
      max: 10.5,
      count: 3,
    });
    expect(computeNumericRange([null, undefined, 'invalid'])).toEqual({
      min: null,
      max: null,
      count: 0,
    });
  });
});

describe('contextMapper', () => {
  it('maps context provenance flags and clones caveats', () => {
    const dto = makeContextDto({
      collectionId: 'real-psi-v1',
      origin: 'real',
      reviewState: 'curated',
      caveats: ['Curated subset'],
    });
    const mapped = mapContext(dto);

    expect(mapped).toEqual({
      collectionId: 'real-psi-v1',
      origin: 'real',
      reviewState: 'curated',
      caveats: ['Curated subset'],
      isSynthetic: false,
      isUnreviewed: false,
    });
    expect(mapped.caveats).not.toBe(dto.caveats);

    const synthetic = mapContext(makeContextDto());
    expect(synthetic.isSynthetic).toBe(true);
    expect(synthetic.isUnreviewed).toBe(true);
  });

  it('maps unavailableFields defensively and looks up field reasons', () => {
    const unavailable = mapUnavailableFields({ slug: 'UNSUPPORTED_MAPPING' });
    expect(unavailable).toEqual({ slug: 'UNSUPPORTED_MAPPING' });
    expect(getFieldUnavailableReason(unavailable, 'slug')).toBe('UNSUPPORTED_MAPPING');
    expect(getFieldUnavailableReason(unavailable, 'title')).toBeNull();
    expect(getFieldUnavailableReason(null, 'slug')).toBeNull();
  });

  it('maps paginated pages and calculates hasMore accurately', () => {
    const page1 = mapPaginatedPage(
      makePageDto([makeTagDto()], { total: 5, offset: 0, limit: 1, next: '/next' }),
      mapTagDto
    );
    expect(page1.items).toHaveLength(1);
    expect(page1.hasMore).toBe(true);
    expect(page1.next).toBe('/next');
    expect(page1.context.isSynthetic).toBe(true);

    const pageLast = mapPaginatedPage(
      makePageDto([makeTagDto()], { total: 1, offset: 0, limit: 20, next: null }),
      mapTagDto
    );
    expect(pageLast.hasMore).toBe(false);
  });
});

describe('investigationMapper', () => {
  it('maps InvestigationDto preferring slug over id for routeKey', () => {
    const noSlug = mapInvestigationDto(makeInvestigationDto({ slug: null }));
    expect(noSlug.routeKey).toBe(noSlug.id);
    expect(noSlug.tags).toHaveLength(1);
    expect(noSlug.tagsTotal).toBe(1);
    expect(getFieldUnavailableReason(noSlug.unavailableFields, 'slug')).toBe(
      'UNSUPPORTED_MAPPING'
    );

    const withSlug = mapInvestigationDto(makeInvestigationDto({ slug: 'saffire-i' }));
    expect(withSlug.slug).toBe('saffire-i');
    expect(withSlug.routeKey).toBe('saffire-i');
  });

  it('maps InvestigationDetailDto collection links to runsMeta, sourcesMeta, claimsMeta', () => {
    const detail = mapInvestigationDetailDto(makeInvestigationDetailDto());
    expect(detail.runsMeta).toEqual({
      href: `/api/v1/investigations/${detail.id}/runs`,
      total: 2,
    });
    expect(detail.sourcesMeta).toEqual({
      href: `/api/v1/investigations/${detail.id}/sources`,
      total: 2,
    });
    expect(detail.claimsMeta).toEqual({
      href: `/api/v1/investigations/${detail.id}/claims`,
      total: 1,
    });
  });

  it('maps CatalogCapabilitiesDto cleanly', () => {
    const dto = makeCapabilitiesDto();
    const mapped = mapCatalogCapabilitiesDto(dto);
    expect(mapped.supportedFilters).toEqual(dto.supportedFilters);
    expect(mapped.unsupportedSorts).toEqual(dto.unsupportedSorts);
    expect(mapped.maxPageSize).toBe(100);
    expect(mapped.context.isSynthetic).toBe(true);
  });
});

describe('runMapper', () => {
  it('maps ConditionDto numeric, text-only, and missing values', () => {
    const numeric = mapConditionDto(makeConditionDto({ valueNumeric: '21.0', unit: '%' }));
    expect(numeric.valueNumeric).toBe(21);
    expect(numeric.rawValueNumeric).toBe('21.0');
    expect(numeric.displayValue).toBe('21 %');

    const textOnly = mapConditionDto(
      makeConditionDto({ valueNumeric: null, valueText: 'Ambient air', unit: null })
    );
    expect(textOnly.valueNumeric).toBeNull();
    expect(textOnly.displayValue).toBe('Ambient air');

    const missing = mapConditionDto(
      makeConditionDto({ valueNumeric: null, valueText: null, unit: '%' })
    );
    expect(missing.displayValue).toBe('—');
  });

  it('maps MeasurementDto with parsed measuredValue, uncertainty, and displayValue', () => {
    const mapped = mapMeasurementDto(
      makeMeasurementDto({ measuredValue: '12.50', uncertainty: '0.25', unit: 'mm/s' })
    );
    expect(mapped.measuredValue).toBe(12.5);
    expect(mapped.rawMeasuredValue).toBe('12.50');
    expect(mapped.uncertainty).toBe(0.25);
    expect(mapped.rawUncertainty).toBe('0.25');
    expect(mapped.displayValue).toBe('12.5 mm/s');

    const missing = mapMeasurementDto(makeMeasurementDto({ measuredValue: null }));
    expect(missing.measuredValue).toBeNull();
    expect(missing.displayValue).toBe('—');
    expect(missing.unavailableFields.uncertainty).toBe('MISSING_SOURCE_DATA');
  });

  it('maps RunDto and ObservationDto preserving counts and unavailability', () => {
    const run = mapRunDto(makeRunDto());
    expect(run.conditionsCount).toBe(1);
    expect(run.measurementsCount).toBe(1);
    expect(run.unavailableFields.verification).toBe('VERIFICATION_NOT_ESTABLISHED');

    const obs = mapObservationDto(makeObservationDto());
    expect(obs.run.id).toBe(run.id);
    expect(obs.measurement.measuredValue).toBe(0);
    expect(obs.context.isSynthetic).toBe(true);
  });
});

describe('evidenceMapper', () => {
  it('maps SourceDto, ClaimSourceDto, and derives Claim.hasContextMismatch', () => {
    const source = mapSourceDto(makeSourceDto({ doi: '10.1234/psi' }));
    expect(source.doi).toBe('10.1234/psi');

    const claimSource = mapClaimSourceDto(makeClaimSourceDto({ contextMismatch: true }));
    expect(claimSource.contextMismatch).toBe(true);
    expect(claimSource.source.id).toBe(source.id);

    const cleanClaim = mapClaimDto(makeClaimDto());
    expect(cleanClaim.hasContextMismatch).toBe(false);
    expect(cleanClaim.sourcesTotal).toBe(1);

    const mismatchedClaim = mapClaimDto(
      makeClaimDto({
        sources: makePageDto([
          makeClaimSourceDto({ contextMismatch: false }),
          makeClaimSourceDto({ id: 'src-2', contextMismatch: true }),
        ]),
      })
    );
    expect(mismatchedClaim.hasContextMismatch).toBe(true);
    expect(mismatchedClaim.sourcesTotal).toBe(2);
  });
});

describe('dashboardMapper', () => {
  it('maps DashboardDto and computes percentage safely', () => {
    const mapped = mapDashboardSummaryDto(makeDashboardDto());
    expect(mapped.verifiedRunCount).toBeNull();
    expect(mapped.fuelDistribution).toBeNull();
    expect(mapped.facilityDistribution).toBeNull();
    expect(mapped.gravityDistribution).toBeNull();
    expect(mapped.sourceCoverage).toEqual({
      numerator: 2,
      denominator: 4,
      ratio: 0.5,
      percentage: 50,
      rawRatio: '0.5',
    });
    expect(mapped.featuredInvestigations).toHaveLength(2);
  });

  it('handles zero denominator and null ratio without NaN or Infinity', () => {
    const zeroDenom = mapDashboardSummaryDto(
      makeDashboardDto({
        sourceCoverage: { numerator: 0, denominator: 0, ratio: null },
      })
    );
    expect(zeroDenom.sourceCoverage).toEqual({
      numerator: 0,
      denominator: 0,
      ratio: null,
      percentage: null,
      rawRatio: null,
    });
  });
});

describe('comparisonMapper', () => {
  it('groups observableSummaries per study without fabricating deltas or highlights', () => {
    const obsA = makeObservationDto({
      run: makeRunDto({ materialType: 'PMMA', gravity: '0g' }),
      measurement: makeMeasurementDto({ observable: 'spread_rate', measuredValue: '1.5', unit: 'mm/s' }),
    });
    const obsB = makeObservationDto({
      run: makeRunDto({ id: 'run-b', materialType: 'PMMA', gravity: '1g' }),
      measurement: makeMeasurementDto({ id: 'm-b', observable: 'spread_rate', measuredValue: '4.5', unit: 'mm/s' }),
    });
    const dto = makeComparisonDto();
    dto.studies[0].observations = makePageDto([obsA, obsB]);

    const mapped = mapComparisonDto(dto);
    expect(mapped.deltas).toBeNull();
    expect(mapped.highlights).toBeNull();
    expect(mapped.comparability).toBe('not_established');
    expect(mapped.unavailableFields.deltas).toBe('SCIENTIFIC_COMPARISON_NOT_APPROVED');

    expect(mapped.studies[0].observedMaterials).toEqual(['PMMA']);
    expect(mapped.studies[0].observedGravities).toEqual(['0g', '1g']);
    expect(mapped.studies[0].observableSummaries).toEqual([
      {
        observable: 'spread_rate',
        unit: 'mm/s',
        count: 2,
        minValue: 1.5,
        maxValue: 4.5,
      },
    ]);

    expect(mapped.studies[1].observableSummaries).toEqual([
      {
        observable: 'TEST_ONLY_OBSERVABLE',
        unit: 'mm/s',
        count: 1,
        minValue: null,
        maxValue: null,
      },
    ]);
  });
});
