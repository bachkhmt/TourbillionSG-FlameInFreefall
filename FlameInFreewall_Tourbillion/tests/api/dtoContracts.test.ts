import { describe, it, expect } from 'vitest';
import {
  UNAVAILABLE_FIELD_REASONS,
  isApiErrorEnvelopeDto,
  isReadyDto,
  type ApiErrorEnvelopeDto,
  type CatalogCapabilitiesDto,
  type ClaimDto,
  type ComparisonDto,
  type ComparisonRequestDto,
  type ConditionDto,
  type ContextDto,
  type DashboardDto,
  type HealthDto,
  type InvestigationDetailDto,
  type InvestigationDto,
  type InvestigationListParamsDto,
  type MeasurementDto,
  type ObservationDto,
  type ReadyDto,
  type RunDto,
  type SourceDto,
  type TagDto,
} from '@/api/dto';
import {
  makeApiErrorEnvelopeDto,
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

function expectNoSnakeCaseKeys(record: Record<string, unknown>) {
  for (const key of Object.keys(record)) {
    expect(key).not.toContain('_');
  }
}

describe('Backend Wire DTO Contracts & Fixtures', () => {
  it('defines the exact 6 canonical UNAVAILABLE_FIELD_REASONS', () => {
    expect(UNAVAILABLE_FIELD_REASONS).toEqual([
      'MISSING_SOURCE_DATA',
      'UNSUPPORTED_MAPPING',
      'VERIFICATION_NOT_ESTABLISHED',
      'SCIENTIFIC_COMPARISON_NOT_APPROVED',
      'NO_DENOMINATOR',
      'ASSET_CONTRACT_PENDING',
    ]);
  });

  describe('isApiErrorEnvelopeDto', () => {
    it('accepts valid error envelopes including fixture output', () => {
      const envelope: ApiErrorEnvelopeDto = makeApiErrorEnvelopeDto();
      expect(isApiErrorEnvelopeDto(envelope)).toBe(true);
      expectNoSnakeCaseKeys(envelope as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(envelope.error as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(envelope.context as unknown as Record<string, unknown>);
    });

    it('rejects null, primitives, arrays, and malformed payloads', () => {
      expect(isApiErrorEnvelopeDto(null)).toBe(false);
      expect(isApiErrorEnvelopeDto(undefined)).toBe(false);
      expect(isApiErrorEnvelopeDto('error')).toBe(false);
      expect(isApiErrorEnvelopeDto([])).toBe(false);
      expect(isApiErrorEnvelopeDto({})).toBe(false);

      const base = makeApiErrorEnvelopeDto();
      expect(
        isApiErrorEnvelopeDto({
          ...base,
          error: { ...base.error, fields: [123] },
        })
      ).toBe(false);
      expect(
        isApiErrorEnvelopeDto({
          ...base,
          error: { ...base.error, supportedValues: null },
        })
      ).toBe(false);
      expect(
        isApiErrorEnvelopeDto({
          ...base,
          context: { ...base.context, origin: 'invalid_origin' },
        })
      ).toBe(false);
      expect(
        isApiErrorEnvelopeDto({
          ...base,
          context: { ...base.context, reviewState: 'approved' },
        })
      ).toBe(false);
      expect(
        isApiErrorEnvelopeDto({
          ...base,
          context: { ...base.context, caveats: ['ok', 42] },
        })
      ).toBe(false);
    });
  });

  describe('isReadyDto & HealthDto', () => {
    it('validates ReadyDto shape with type guard', () => {
      const ready: ReadyDto = {
        status: 'ready',
        service: 'flameguard-api',
        database: 'ok',
      };
      const unavailable: ReadyDto = {
        status: 'unavailable',
        service: 'flameguard-api',
        database: 'unavailable',
      };
      const health: HealthDto = { status: 'ok', service: 'flameguard-api' };

      expect(health.status).toBe('ok');
      expect(isReadyDto(ready)).toBe(true);
      expect(isReadyDto(unavailable)).toBe(true);
      expect(isReadyDto(health)).toBe(false);
      expect(isReadyDto(null)).toBe(false);
      expect(isReadyDto([])).toBe(false);
      expect(isReadyDto({ status: 'ready', service: 'api', database: 1 })).toBe(false);
    });
  });

  describe('Synthetic Phase 4 Fixture Builders', () => {
    it('builds ContextDto and PaginatedPageDto with canonical Phase 4 defaults', () => {
      const ctx: ContextDto = makeContextDto();
      expect(ctx.collectionId).toBe('synthetic-phase4-v1');
      expect(ctx.origin).toBe('synthetic');
      expect(ctx.reviewState).toBe('unreviewed');
      expect(Array.isArray(ctx.caveats)).toBe(true);

      const tag: TagDto = makeTagDto();
      const page = makePageDto([tag], { total: 5, offset: 0, limit: 20, next: null });
      expect(page.items).toHaveLength(1);
      expect(page.total).toBe(5);
      expect(page.offset).toBe(0);
      expect(page.limit).toBe(20);
      expect(page.next).toBeNull();
      expectNoSnakeCaseKeys(tag as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(page as unknown as Record<string, unknown>);
    });

    it('builds InvestigationDto, InvestigationDetailDto, and CatalogCapabilitiesDto', () => {
      const inv: InvestigationDto = makeInvestigationDto();
      const detail: InvestigationDetailDto = makeInvestigationDetailDto();
      const caps: CatalogCapabilitiesDto = makeCapabilitiesDto();
      const params: InvestigationListParamsDto = {
        q: 'synthetic',
        platform: 'TEST_PLATFORM',
        gravityRaw: '0g',
        sort: 'title-asc',
        offset: 0,
        limit: 20,
      };

      expect(inv.psiId).toBe('SYNTHETIC-PHASE4-1');
      expect(inv.slug).toBeNull();
      expect(detail.runs.href).toContain(detail.id);
      expect(detail.sources.total).toBeGreaterThanOrEqual(0);
      expect(detail.claims.total).toBeGreaterThanOrEqual(0);
      expect(caps.maxPageSize).toBe(100);
      expect(params.sort).toBe('title-asc');

      expectNoSnakeCaseKeys(inv as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(detail as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(caps as unknown as Record<string, unknown>);
    });

    it('builds RunDto, ConditionDto, MeasurementDto, and ObservationDto preserving DecimalString precision', () => {
      const run: RunDto = makeRunDto();
      const cond: ConditionDto = makeConditionDto();
      const meas: MeasurementDto = makeMeasurementDto({
        measuredValue: '0.10000000000000000001',
      });
      const obs: ObservationDto = makeObservationDto({ measurement: meas, run });

      expect(run.verification).toBe('unknown');
      expect(typeof meas.measuredValue).toBe('string');
      expect(meas.measuredValue).toBe('0.10000000000000000001');
      expect(obs.measurement.id).toBe(meas.id);
      expect(obs.run.id).toBe(run.id);

      expectNoSnakeCaseKeys(run as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(cond as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(meas as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(obs as unknown as Record<string, unknown>);
    });

    it('builds SourceDto, ClaimSourceDto, and ClaimDto with camelCase wire keys', () => {
      const src: SourceDto = makeSourceDto();
      const claimSource = makeClaimSourceDto({ source: src });
      const claim: ClaimDto = makeClaimDto();

      expect(claimSource.contextMismatch).toBe(false);
      expect(claimSource.source.id).toBe(src.id);
      expect(claim.sources.items.length).toBeGreaterThanOrEqual(1);

      expectNoSnakeCaseKeys(src as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(claimSource as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(claim as unknown as Record<string, unknown>);
    });

    it('builds DashboardDto and ComparisonDto with gated null fields and valid UnavailableReason keys', () => {
      const dashboard: DashboardDto = makeDashboardDto();
      const comparison: ComparisonDto = makeComparisonDto();
      const compareReq: ComparisonRequestDto = {
        investigationIds: [
          comparison.studies[0].investigation.id,
          comparison.studies[1].investigation.id,
        ],
        observationOffset: 0,
        observationLimit: 20,
      };

      expect(dashboard.verifiedRunCount).toBeNull();
      expect(dashboard.fuelDistribution).toBeNull();
      expect(dashboard.facilityDistribution).toBeNull();
      expect(dashboard.gravityDistribution).toBeNull();
      expect(dashboard.featuredInvestigations.length).toBeLessThanOrEqual(3);

      for (const reason of Object.values(dashboard.unavailableFields)) {
        expect(UNAVAILABLE_FIELD_REASONS).toContain(reason);
      }

      expect(comparison.studies.length).toBeGreaterThanOrEqual(2);
      expect(comparison.deltas).toBeNull();
      expect(comparison.highlights).toBeNull();
      expect(comparison.comparability).toBe('not_established');
      expect(compareReq.investigationIds).toHaveLength(2);

      expectNoSnakeCaseKeys(dashboard as unknown as Record<string, unknown>);
      expectNoSnakeCaseKeys(comparison as unknown as Record<string, unknown>);
    });
  });
});
