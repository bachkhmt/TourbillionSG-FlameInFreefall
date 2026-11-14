import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { apiQueryKeys, isUuid } from '@/hooks/api';
import {
  useDashboardSummaryQuery,
  useHealthQuery,
  useReadyQuery,
} from '@/features/dashboard';
import {
  useCatalogCapabilitiesQuery,
  useClaimSourcesQuery,
  useCompareInvestigationsMutation,
  useComparisonQuery,
  useInvestigationClaimsQuery,
  useInvestigationDetailQuery,
  useInvestigationMeasurementsQuery,
  useInvestigationRunsQuery,
  useInvestigationsQuery,
  useInvestigationSourcesQuery,
  useInvestigationTagsQuery,
  useRunConditionsQuery,
  useRunMeasurementsQuery,
} from '@/features/explorer';
import * as apiServices from '@/api/services';
import { createTestQueryClient } from '../test-utils';
import {
  makeCapabilitiesDto,
  makeClaimDto,
  makeClaimSourceDto,
  makeComparisonDto,
  makeConditionDto,
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

vi.mock('@/api/services', () => ({
  getHealth: vi.fn(),
  getReady: vi.fn(),
  getCatalogCapabilities: vi.fn(),
  listInvestigations: vi.fn(),
  getInvestigationById: vi.fn(),
  getInvestigationBySlug: vi.fn(),
  getInvestigationTags: vi.fn(),
  listInvestigationRuns: vi.fn(),
  listRunConditions: vi.fn(),
  listRunMeasurements: vi.fn(),
  listInvestigationMeasurements: vi.fn(),
  listInvestigationSources: vi.fn(),
  listInvestigationClaims: vi.fn(),
  listClaimSources: vi.fn(),
  getDashboardSummary: vi.fn(),
  compareInvestigations: vi.fn(),
}));

const mockedServices = vi.mocked(apiServices);

function createWrapper(queryClient: QueryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const VALID_UUID = 'e1a75331-3f1f-57b8-9042-405ff61dff51';
const SECOND_UUID = 'afa58280-0d0c-58a3-926a-1499a1e20a96';
const THIRD_UUID = 'b8f882f6-6fde-5b18-a505-f668bdc12c42';
const FOURTH_UUID = 'f04922ad-2fbf-5afe-ba7e-bc5a01b9149f';

describe('Task 5: TanStack Query Keys & Custom API Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('apiQueryKeys', () => {
    it('builds deterministic query keys and sorts comparison IDs without mutating input', () => {
      const input = ['id-b', 'id-a'];
      const key = apiQueryKeys.comparison(input, { observationLimit: 10 });

      expect(input).toEqual(['id-b', 'id-a']);
      expect(key).toEqual([
        'api',
        'compare',
        ['id-a', 'id-b'],
        { observationLimit: 10 },
      ]);
      expect(apiQueryKeys.health).toEqual(['api', 'health']);
      expect(apiQueryKeys.ready).toEqual(['api', 'ready']);
      expect(apiQueryKeys.catalogCapabilities).toEqual([
        'api',
        'catalog',
        'capabilities',
      ]);
      expect(apiQueryKeys.investigations()).toEqual(['api', 'investigations', {}]);
      expect(apiQueryKeys.dashboardSummary()).toEqual([
        'api',
        'dashboard',
        'summary',
        {},
      ]);
    });
  });

  describe('Health & readiness queries', () => {
    it('fetches health and ready status with AbortSignal', async () => {
      mockedServices.getHealth.mockResolvedValueOnce({
        status: 'ok',
        service: 'flameguard-api',
      });
      mockedServices.getReady.mockResolvedValueOnce({
        status: 'ready',
        service: 'flameguard-api',
        database: 'ok',
      });

      const wrapper = createWrapper();
      const { result: healthResult } = renderHook(() => useHealthQuery(), {
        wrapper,
      });
      const { result: readyResult } = renderHook(() => useReadyQuery(), {
        wrapper,
      });

      await waitFor(() => {
        expect(healthResult.current.isSuccess).toBe(true);
        expect(readyResult.current.isSuccess).toBe(true);
      });

      expect(healthResult.current.data).toEqual({
        status: 'ok',
        service: 'flameguard-api',
      });
      expect(readyResult.current.data).toEqual({
        status: 'ready',
        service: 'flameguard-api',
        database: 'ok',
      });
      expect(mockedServices.getHealth).toHaveBeenCalledWith(
        expect.any(AbortSignal)
      );
      expect(mockedServices.getReady).toHaveBeenCalledWith(
        expect.any(AbortSignal)
      );
    });

    it('respects enabled: false on health and ready queries', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useHealthQuery({ enabled: false }),
        { wrapper }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedServices.getHealth).not.toHaveBeenCalled();
    });
  });

  describe('useDashboardSummaryQuery', () => {
    it('transitions loading -> success and maps domain summary', async () => {
      mockedServices.getDashboardSummary.mockResolvedValueOnce(
        makeDashboardDto()
      );

      const { result } = renderHook(
        () => useDashboardSummaryQuery({ platform: 'ISS' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedServices.getDashboardSummary).toHaveBeenCalledWith(
        { platform: 'ISS' },
        expect.any(AbortSignal)
      );
      expect(result.current.data?.investigationCount).toBe(4);
      expect(result.current.data?.sourceCoverage.percentage).toBe(50);
      expect(result.current.data?.fuelDistribution).toBeNull();
      expect(result.current.data?.featuredInvestigations).toHaveLength(2);
      expect(result.current.data?.featuredInvestigations[0].routeKey).toBe(
        VALID_UUID
      );
    });

    it('surfaces error and recovers cleanly via refetch()', async () => {
      mockedServices.getDashboardSummary
        .mockRejectedValueOnce(new Error('Telemetry backend offline'))
        .mockResolvedValueOnce(makeDashboardDto());

      const { result } = renderHook(() => useDashboardSummaryQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Telemetry backend offline');

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.investigationCount).toBe(4);
      expect(mockedServices.getDashboardSummary).toHaveBeenCalledTimes(2);
    });
  });

  describe('Catalog & investigation detail queries', () => {
    it('fetches capabilities and paginated investigations as mapped models', async () => {
      mockedServices.getCatalogCapabilities.mockResolvedValueOnce(
        makeCapabilitiesDto()
      );
      mockedServices.listInvestigations.mockResolvedValueOnce(
        makePageDto([
          makeInvestigationDto({
            id: VALID_UUID,
            slug: 'saffire-iv-pmma',
          }),
        ])
      );

      const wrapper = createWrapper();
      const { result: capResult } = renderHook(
        () => useCatalogCapabilitiesQuery(),
        { wrapper }
      );
      const { result: listResult } = renderHook(
        () => useInvestigationsQuery({ q: 'pmma', limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(capResult.current.isSuccess).toBe(true);
        expect(listResult.current.isSuccess).toBe(true);
      });

      expect(capResult.current.data?.maxPageSize).toBe(100);
      expect(capResult.current.data?.context.isSynthetic).toBe(true);
      expect(mockedServices.listInvestigations).toHaveBeenCalledWith(
        { q: 'pmma', limit: 10 },
        expect.any(AbortSignal)
      );
      expect(listResult.current.data?.items[0].routeKey).toBe(
        'saffire-iv-pmma'
      );
    });

    it('detects strict UUID v1-5 vs slugs with isUuid()', () => {
      expect(isUuid(VALID_UUID)).toBe(true);
      expect(isUuid(VALID_UUID.toUpperCase())).toBe(true);
      expect(isUuid('saffire-iv-pmma')).toBe(false);
      expect(isUuid('')).toBe(false);
      expect(isUuid('e1a75331-3f1f-67b8-9042-405ff61dff51')).toBe(false);
    });

    it('routes UUID to getInvestigationById and slug to getInvestigationBySlug', async () => {
      mockedServices.getInvestigationById.mockResolvedValueOnce(
        makeInvestigationDetailDto({ id: VALID_UUID })
      );
      mockedServices.getInvestigationBySlug.mockResolvedValueOnce(
        makeInvestigationDetailDto({ id: SECOND_UUID, slug: 'saffire-iv-pmma' })
      );

      const wrapper = createWrapper();
      const { result: byIdResult } = renderHook(
        () => useInvestigationDetailQuery(`  ${VALID_UUID}  `),
        { wrapper }
      );
      const { result: bySlugResult } = renderHook(
        () => useInvestigationDetailQuery('saffire-iv-pmma'),
        { wrapper }
      );

      await waitFor(() => {
        expect(byIdResult.current.isSuccess).toBe(true);
        expect(bySlugResult.current.isSuccess).toBe(true);
      });

      expect(mockedServices.getInvestigationById).toHaveBeenCalledWith(
        VALID_UUID,
        expect.any(AbortSignal)
      );
      expect(mockedServices.getInvestigationBySlug).toHaveBeenCalledWith(
        'saffire-iv-pmma',
        expect.any(AbortSignal)
      );
      expect(byIdResult.current.data?.runsMeta.total).toBe(2);
      expect(bySlugResult.current.data?.routeKey).toBe('saffire-iv-pmma');
    });

    it('keeps useInvestigationDetailQuery and useInvestigationTagsQuery disabled when ID is missing', () => {
      const wrapper = createWrapper();
      const { result: emptyDetail } = renderHook(
        () => useInvestigationDetailQuery('   '),
        { wrapper }
      );
      const { result: nullDetail } = renderHook(
        () => useInvestigationDetailQuery(null),
        { wrapper }
      );
      const { result: emptyTags } = renderHook(
        () => useInvestigationTagsQuery(undefined),
        { wrapper }
      );

      expect(emptyDetail.current.fetchStatus).toBe('idle');
      expect(nullDetail.current.fetchStatus).toBe('idle');
      expect(emptyTags.current.fetchStatus).toBe('idle');
      expect(mockedServices.getInvestigationById).not.toHaveBeenCalled();
      expect(mockedServices.getInvestigationBySlug).not.toHaveBeenCalled();
      expect(mockedServices.getInvestigationTags).not.toHaveBeenCalled();
    });

    it('fetches paginated tags when investigationId is provided', async () => {
      mockedServices.getInvestigationTags.mockResolvedValueOnce(
        makePageDto([makeTagDto()])
      );

      const { result } = renderHook(
        () => useInvestigationTagsQuery(VALID_UUID, { offset: 0, limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedServices.getInvestigationTags).toHaveBeenCalledWith(
        VALID_UUID,
        { offset: 0, limit: 10 },
        expect.any(AbortSignal)
      );
      expect(result.current.data?.items[0].slug).toBe('synthetic-phase4-tag');
    });
  });

  describe('Runs, conditions, measurements & evidence queries', () => {
    it('guards dependent run and evidence queries when ID is empty or null', () => {
      const wrapper = createWrapper();
      const { result: runs } = renderHook(() => useInvestigationRunsQuery(''), {
        wrapper,
      });
      const { result: conditions } = renderHook(
        () => useRunConditionsQuery(null),
        { wrapper }
      );
      const { result: runMeasurements } = renderHook(
        () => useRunMeasurementsQuery(undefined),
        { wrapper }
      );
      const { result: invMeasurements } = renderHook(
        () => useInvestigationMeasurementsQuery('  '),
        { wrapper }
      );
      const { result: sources } = renderHook(
        () => useInvestigationSourcesQuery(null),
        { wrapper }
      );
      const { result: claims } = renderHook(
        () => useInvestigationClaimsQuery(''),
        { wrapper }
      );
      const { result: claimSources } = renderHook(
        () => useClaimSourcesQuery(undefined),
        { wrapper }
      );

      for (const hookResult of [
        runs,
        conditions,
        runMeasurements,
        invMeasurements,
        sources,
        claims,
        claimSources,
      ]) {
        expect(hookResult.current.fetchStatus).toBe('idle');
      }

      expect(mockedServices.listInvestigationRuns).not.toHaveBeenCalled();
      expect(mockedServices.listRunConditions).not.toHaveBeenCalled();
      expect(mockedServices.listRunMeasurements).not.toHaveBeenCalled();
      expect(
        mockedServices.listInvestigationMeasurements
      ).not.toHaveBeenCalled();
      expect(mockedServices.listInvestigationSources).not.toHaveBeenCalled();
      expect(mockedServices.listInvestigationClaims).not.toHaveBeenCalled();
      expect(mockedServices.listClaimSources).not.toHaveBeenCalled();
    });

    it('fetches and maps runs, conditions, measurements, observations, sources, and claims', async () => {
      mockedServices.listInvestigationRuns.mockResolvedValueOnce(
        makePageDto([makeRunDto()])
      );
      mockedServices.listRunConditions.mockResolvedValueOnce(
        makePageDto([makeConditionDto()])
      );
      mockedServices.listRunMeasurements.mockResolvedValueOnce(
        makePageDto([makeMeasurementDto()])
      );
      mockedServices.listInvestigationMeasurements.mockResolvedValueOnce(
        makePageDto([makeObservationDto()])
      );
      mockedServices.listInvestigationSources.mockResolvedValueOnce(
        makePageDto([makeSourceDto()])
      );
      mockedServices.listInvestigationClaims.mockResolvedValueOnce(
        makePageDto([makeClaimDto()])
      );
      mockedServices.listClaimSources.mockResolvedValueOnce(
        makePageDto([makeClaimSourceDto({ contextMismatch: true })])
      );

      const wrapper = createWrapper();
      const { result: runs } = renderHook(
        () => useInvestigationRunsQuery(VALID_UUID, { limit: 20 }),
        { wrapper }
      );
      const { result: conditions } = renderHook(
        () => useRunConditionsQuery(THIRD_UUID),
        { wrapper }
      );
      const { result: runMeasurements } = renderHook(
        () => useRunMeasurementsQuery(THIRD_UUID),
        { wrapper }
      );
      const { result: invMeasurements } = renderHook(
        () => useInvestigationMeasurementsQuery(VALID_UUID),
        { wrapper }
      );
      const { result: sources } = renderHook(
        () => useInvestigationSourcesQuery(VALID_UUID),
        { wrapper }
      );
      const { result: claims } = renderHook(
        () => useInvestigationClaimsQuery(VALID_UUID),
        { wrapper }
      );
      const { result: claimSources } = renderHook(
        () => useClaimSourcesQuery('claim-1'),
        { wrapper }
      );

      await waitFor(() => {
        expect(runs.current.isSuccess).toBe(true);
        expect(conditions.current.isSuccess).toBe(true);
        expect(runMeasurements.current.isSuccess).toBe(true);
        expect(invMeasurements.current.isSuccess).toBe(true);
        expect(sources.current.isSuccess).toBe(true);
        expect(claims.current.isSuccess).toBe(true);
        expect(claimSources.current.isSuccess).toBe(true);
      });

      expect(runs.current.data?.items[0].conditionsCount).toBe(1);
      expect(conditions.current.data?.items[0].valueNumeric).toBe(0);
      expect(runMeasurements.current.data?.items[0].displayValue).toBe('0 mm/s');
      expect(
        invMeasurements.current.data?.items[0].measurement.observable
      ).toBe('TEST_ONLY_OBSERVABLE');
      expect(sources.current.data?.items[0].documentType).toBe('TEST_ONLY');
      expect(claims.current.data?.items[0].hasContextMismatch).toBe(false);
      expect(claimSources.current.data?.items[0].contextMismatch).toBe(true);
    });
  });

  describe('Comparison query & mutation', () => {
    it('enables useComparisonQuery only for 2-3 distinct non-empty IDs', async () => {
      mockedServices.compareInvestigations.mockResolvedValueOnce(
        makeComparisonDto()
      );

      const wrapper = createWrapper();

      const { result: oneId } = renderHook(
        () => useComparisonQuery([VALID_UUID]),
        { wrapper }
      );
      const { result: duplicateIds } = renderHook(
        () => useComparisonQuery([VALID_UUID, VALID_UUID]),
        { wrapper }
      );
      const { result: fourIds } = renderHook(
        () =>
          useComparisonQuery([
            VALID_UUID,
            SECOND_UUID,
            THIRD_UUID,
            FOURTH_UUID,
          ]),
        { wrapper }
      );

      expect(oneId.current.fetchStatus).toBe('idle');
      expect(duplicateIds.current.fetchStatus).toBe('idle');
      expect(fourIds.current.fetchStatus).toBe('idle');
      expect(mockedServices.compareInvestigations).not.toHaveBeenCalled();

      const { result: twoIds } = renderHook(
        () =>
          useComparisonQuery(
            [` ${VALID_UUID} `, SECOND_UUID, VALID_UUID],
            { observationOffset: 0, observationLimit: 25 }
          ),
        { wrapper }
      );

      await waitFor(() => {
        expect(twoIds.current.isSuccess).toBe(true);
      });

      expect(mockedServices.compareInvestigations).toHaveBeenCalledWith(
        {
          investigationIds: [VALID_UUID, SECOND_UUID],
          observationOffset: 0,
          observationLimit: 25,
        },
        expect.any(AbortSignal)
      );
      expect(twoIds.current.data?.deltas).toBeNull();
      expect(twoIds.current.data?.highlights).toBeNull();
      expect(twoIds.current.data?.studies).toHaveLength(2);
    });

    it('runs useCompareInvestigationsMutation and returns mapped comparison result', async () => {
      mockedServices.compareInvestigations.mockResolvedValueOnce(
        makeComparisonDto()
      );

      const { result } = renderHook(() => useCompareInvestigationsMutation(), {
        wrapper: createWrapper(),
      });

      let mappedResult;
      await act(async () => {
        mappedResult = await result.current.mutateAsync({
          investigationIds: [VALID_UUID, SECOND_UUID],
        });
      });

      expect(mockedServices.compareInvestigations).toHaveBeenCalledWith({
        investigationIds: [VALID_UUID, SECOND_UUID],
      });
      expect(mappedResult).toMatchObject({
        deltas: null,
        highlights: null,
        comparability: 'not_established',
      });
    });
  });
});
