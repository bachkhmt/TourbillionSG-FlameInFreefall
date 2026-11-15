import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  ExplorerFiltersBar,
  InvestigationCard,
  InvestigationTable,
  ExplorerComparisonBar,
  StudyHeader,
  TestRunsTable,
  TelemetryPane,
  ClaimsList,
  ChamberOverviewTab,
  PsiExportTab,
} from '@/features/explorer';
import ExplorerPage from '../src/app/(dashboard)/explorer/page';
import StudyDetailPage from '../src/app/(dashboard)/explorer/[id]/page';
import { ApiClientError } from '../src/api/client';
import { useWorkspaceStore } from '../src/store/useWorkspaceStore';
import { toastStore } from '../src/components/toast/toast-store';
import {
  mapCatalogCapabilitiesDto,
  mapClaimDto,
  mapInvestigationDetailDto,
  mapInvestigationDto,
  mapObservationDto,
  mapRunDto,
  mapSourceDto,
} from '../src/api/mappers';
import * as apiServices from '../src/api/services';
import { renderWithQuery } from './test-utils';
import {
  makeCapabilitiesDto,
  makeClaimDto,
  makeClaimSourceDto,
  makeComparisonDto,
  makeConditionDto,
  makeInvestigationDetailDto,
  makeInvestigationDto,
  makeMeasurementDto,
  makeObservationDto,
  makePageDto,
  makeRunDto,
  makeSourceDto,
} from './fixtures/backendFixtures';

const mockPush = vi.fn();
let mockParams: { id?: string } = { id: 'bass' };

expect.extend({
  toBeInTheDocument(received) {
    const pass = Boolean(received);
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to be in document`,
    };
  },
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/explorer',
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => mockParams,
}));

vi.mock('@/api/services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/services')>();
  return {
    ...actual,
    getCatalogCapabilities: vi.fn(),
    listInvestigations: vi.fn(),
    getInvestigationById: vi.fn(),
    getInvestigationBySlug: vi.fn(),
    listInvestigationRuns: vi.fn(),
    listInvestigationMeasurements: vi.fn(),
    listInvestigationSources: vi.fn(),
    listInvestigationClaims: vi.fn(),
    listClaimSources: vi.fn(),
    listRunConditions: vi.fn(),
    listRunMeasurements: vi.fn(),
    compareInvestigations: vi.fn(),
  };
});

const INV_1 = makeInvestigationDto({
  id: 'e1a75331-3f1f-57b8-9042-405ff61dff51',
  psiId: 'SYNTHETIC-PHASE4-1',
  slug: null,
  title: 'Synthetic Flame Spread Study',
  platform: 'MSG',
});

const INV_2 = makeInvestigationDto({
  id: 'afa58280-0d0c-58a3-926a-1499a1e20a96',
  psiId: 'SYNTHETIC-PHASE4-2',
  slug: 'saffire-synthetic',
  title: 'Synthetic Saffire Spacecraft Fire',
  platform: null,
});

describe('Experiment Explorer & Detail Pages (/explorer & /explorer/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().resetWorkspace();
    toastStore.clear();
    mockParams = { id: 'bass' };

    vi.mocked(apiServices.getCatalogCapabilities).mockResolvedValue(makeCapabilitiesDto());
    vi.mocked(apiServices.listInvestigations).mockResolvedValue(
      makePageDto([INV_1, INV_2], { total: 2, offset: 0, limit: 20, next: null })
    );
    vi.mocked(apiServices.getInvestigationById).mockResolvedValue(makeInvestigationDetailDto());
    vi.mocked(apiServices.getInvestigationBySlug).mockResolvedValue(
      makeInvestigationDetailDto({
        id: INV_2.id,
        psiId: INV_2.psiId,
        slug: 'saffire-synthetic',
        title: INV_2.title,
        platform: null,
      })
    );
    vi.mocked(apiServices.listInvestigationRuns).mockResolvedValue(
      makePageDto([
        makeRunDto({ id: 'b8f882f6-6fde-5b18-a505-f668bdc12c42', externalRunKey: 'RUN-01' }),
        makeRunDto({
          id: 'f04922ad-2fbf-5afe-ba7e-bc5a01b9149f',
          externalRunKey: 'RUN-02',
          materialType: 'TEST_MATERIAL_B',
          gravity: '1g',
        }),
      ])
    );
    vi.mocked(apiServices.listInvestigationMeasurements).mockResolvedValue(
      makePageDto([makeObservationDto()])
    );
    vi.mocked(apiServices.listInvestigationSources).mockResolvedValue(
      makePageDto([makeSourceDto({ doi: '10.1000/synthetic-psi' })])
    );
    vi.mocked(apiServices.listInvestigationClaims).mockResolvedValue(
      makePageDto([makeClaimDto()])
    );
    vi.mocked(apiServices.listRunConditions).mockResolvedValue(
      makePageDto([makeConditionDto()])
    );
    vi.mocked(apiServices.listRunMeasurements).mockResolvedValue(
      makePageDto([makeMeasurementDto()])
    );
    vi.mocked(apiServices.compareInvestigations).mockResolvedValue(makeComparisonDto());

    // Mock URL for exports
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  // -------------------------------------------------------------------------
  // 0. Explorer Page Light Theme & API States
  // -------------------------------------------------------------------------
  describe('Explorer Page Query States', () => {
    it('renders loading shimmer while investigations query is pending', () => {
      vi.mocked(apiServices.listInvestigations).mockReturnValue(new Promise(() => {}));
      renderWithQuery(<ExplorerPage />);

      expect(screen.getByPlaceholderText(/Search investigations/i)).toBeInTheDocument();
      expect(screen.getByTestId('explorer-shimmer-grid')).toBeInTheDocument();
    });

    it('renders ApiErrorBanner on query error and retries when clicked', async () => {
      vi.mocked(apiServices.listInvestigations)
        .mockRejectedValueOnce(new Error('Catalog service unavailable'))
        .mockResolvedValueOnce(makePageDto([INV_1, INV_2]));

      renderWithQuery(<ExplorerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('api-error-banner')).toBeInTheDocument();
      });
      expect(screen.getByText(/Catalog service unavailable/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

      await waitFor(() => {
        expect(screen.getByTestId('explorer-grid-view')).toBeInTheDocument();
      });
      expect(apiServices.listInvestigations).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // 1. ExplorerFiltersBar
  // -------------------------------------------------------------------------
  describe('ExplorerFiltersBar', () => {
    it('renders backend-supported filter controls, search bar, capabilities hint, and view toggle', () => {
      const capabilities = mapCatalogCapabilitiesDto(makeCapabilitiesDto());
      renderWithQuery(
        <ExplorerFiltersBar
          searchQuery=""
          onSearchChange={vi.fn()}
          platformFilter="all"
          onPlatformFilterChange={vi.fn()}
          materialFilter=""
          onMaterialFilterChange={vi.fn()}
          gravityFilter="all"
          onGravityFilterChange={vi.fn()}
          sortBy="title-asc"
          onSortChange={vi.fn()}
          viewMode="grid"
          onViewModeChange={vi.fn()}
          totalCount={2}
          filteredCount={2}
          onResetFilters={vi.fn()}
          capabilities={capabilities}
        />
      );

      const bar = screen.getByTestId('explorer-filters-bar');
      expect(bar).toBeDefined();
      expect(bar.className).toContain('sticky');
      expect(bar.innerHTML).not.toContain('backdrop-blur-md');
      expect(bar.innerHTML).not.toContain('font-mono');
      expect(screen.getByTestId('explorer-search-input')).toBeDefined();
      expect(screen.getByTestId('material-filter-input')).toBeDefined();
      expect(screen.getByTestId('platform-filter-select')).toBeDefined();
      expect(screen.getByTestId('gravity-filter-select')).toBeDefined();
      expect(screen.getByTestId('sort-by-select')).toBeDefined();
      expect(screen.getByTestId('catalog-capabilities-hint')).toBeDefined();
      expect(screen.getByTestId('view-grid-btn')).toBeDefined();
      expect(screen.getByTestId('view-table-btn')).toBeDefined();
    });

    it('triggers platform, gravity, material, and sort filter changes', () => {
      const handlePlatform = vi.fn();
      const handleGravity = vi.fn();
      const handleMaterial = vi.fn();
      const handleSort = vi.fn();

      renderWithQuery(
        <ExplorerFiltersBar
          searchQuery=""
          onSearchChange={vi.fn()}
          platformFilter="all"
          onPlatformFilterChange={handlePlatform}
          materialFilter=""
          onMaterialFilterChange={handleMaterial}
          gravityFilter="all"
          onGravityFilterChange={handleGravity}
          sortBy="title-asc"
          onSortChange={handleSort}
          viewMode="grid"
          onViewModeChange={vi.fn()}
          totalCount={2}
          filteredCount={2}
          onResetFilters={vi.fn()}
        />
      );

      fireEvent.change(screen.getByTestId('platform-filter-select'), {
        target: { value: 'MSG' },
      });
      expect(handlePlatform).toHaveBeenCalledWith('MSG');

      fireEvent.change(screen.getByTestId('gravity-filter-select'), {
        target: { value: '0g' },
      });
      expect(handleGravity).toHaveBeenCalledWith('0g');

      fireEvent.change(screen.getByTestId('material-filter-input'), {
        target: { value: 'PMMA' },
      });
      expect(handleMaterial).toHaveBeenCalledWith('PMMA');

      fireEvent.change(screen.getByTestId('sort-by-select'), {
        target: { value: 'runs-desc' },
      });
      expect(handleSort).toHaveBeenCalledWith('runs-desc');
    });

    it('triggers search change on input and clear button', () => {
      const handleSearch = vi.fn();
      renderWithQuery(
        <ExplorerFiltersBar
          searchQuery="PMMA"
          onSearchChange={handleSearch}
          platformFilter="all"
          onPlatformFilterChange={vi.fn()}
          materialFilter=""
          onMaterialFilterChange={vi.fn()}
          gravityFilter="all"
          onGravityFilterChange={vi.fn()}
          sortBy="title-asc"
          onSortChange={vi.fn()}
          viewMode="grid"
          onViewModeChange={vi.fn()}
          totalCount={2}
          filteredCount={1}
          onResetFilters={vi.fn()}
        />
      );

      fireEvent.change(screen.getByTestId('explorer-search-input'), {
        target: { value: 'Saffire' },
      });
      expect(handleSearch).toHaveBeenCalledWith('Saffire');

      fireEvent.click(screen.getByTestId('clear-search-btn'));
      expect(handleSearch).toHaveBeenCalledWith('');
    });

    it('shows reset button when filtered and triggers onResetFilters', () => {
      const handleReset = vi.fn();
      renderWithQuery(
        <ExplorerFiltersBar
          searchQuery="PMMA"
          onSearchChange={vi.fn()}
          platformFilter="MSG"
          onPlatformFilterChange={vi.fn()}
          materialFilter="Nomex"
          onMaterialFilterChange={vi.fn()}
          gravityFilter="0g"
          onGravityFilterChange={vi.fn()}
          sortBy="runs-desc"
          onSortChange={vi.fn()}
          viewMode="grid"
          onViewModeChange={vi.fn()}
          totalCount={2}
          filteredCount={1}
          onResetFilters={handleReset}
        />
      );

      const resetBtn = screen.getByTestId('reset-filters-btn');
      expect(resetBtn).toBeDefined();
      fireEvent.click(resetBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 2. InvestigationCard & InvestigationTable
  // -------------------------------------------------------------------------
  describe('InvestigationCard', () => {
    it('renders MappedInvestigation psiId, platform, title, purpose, tags, and minimalist StructPaper style', () => {
      const study = mapInvestigationDto(INV_1);
      const handleToggle = vi.fn();

      renderWithQuery(
        <InvestigationCard
          investigation={study}
          isComparing={false}
          onToggleCompare={handleToggle}
        />
      );

      const card = screen.getByTestId(`investigation-card-${study.id}`);
      expect(card).toBeDefined();
      expect(card.className).toContain('rounded-3xl');
      expect(card.className).toContain('cursor-pointer');
      expect(card.innerHTML).not.toContain('emerald');
      expect(card.innerHTML).not.toContain('font-mono');
      expect(screen.getByText(study.psiId)).toBeDefined();
      expect(screen.getByText('MSG')).toBeDefined();
      expect(screen.getByText(study.title)).toBeDefined();
      expect(screen.getByText('TEST_ONLY exploration')).toBeDefined();
      expect(screen.getByText('Synthetic classification')).toBeDefined();
      expect(screen.getByText(study.title).closest('a')?.getAttribute('href')).toBe(
        `/explorer/${study.id}`
      );
    });

    it('renders Platform unmapped when platform is null and toggles compare state', () => {
      const study = mapInvestigationDto(INV_2);
      const handleToggle = vi.fn();

      const { rerender } = renderWithQuery(
        <InvestigationCard
          investigation={study}
          isComparing={false}
          onToggleCompare={handleToggle}
        />
      );

      expect(screen.getByText('Platform unmapped')).toBeDefined();
      expect(screen.getByText(study.title).closest('a')?.getAttribute('href')).toBe(
        '/explorer/saffire-synthetic'
      );

      fireEvent.click(screen.getByTestId(`compare-btn-${study.id}`));
      expect(handleToggle).toHaveBeenCalledWith(study.id);

      rerender(
        <InvestigationCard
          investigation={study}
          isComparing={true}
          onToggleCompare={handleToggle}
        />
      );
      expect(screen.getByText('Comparing')).toBeDefined();
    });
  });

  describe('InvestigationTable', () => {
    it('renders table rows for MappedInvestigation[] with routeKey inspect links', () => {
      const handleToggle = vi.fn();
      const testStudies = [mapInvestigationDto(INV_1), mapInvestigationDto(INV_2)];

      renderWithQuery(
        <InvestigationTable
          investigations={testStudies}
          compareList={[INV_1.id]}
          onToggleCompare={handleToggle}
        />
      );

      expect(screen.getByTestId('investigations-table')).toBeDefined();
      expect(screen.getByTestId(`investigation-row-${INV_1.id}`)).toBeDefined();
      expect(screen.getByTestId(`table-inspect-${INV_1.id}`).getAttribute('href')).toBe(
        `/explorer/${INV_1.id}`
      );
      expect(screen.getByTestId(`table-inspect-${INV_2.id}`).getAttribute('href')).toBe(
        '/explorer/saffire-synthetic'
      );

      fireEvent.click(screen.getByTestId(`table-compare-btn-${INV_1.id}`));
      expect(handleToggle).toHaveBeenCalledWith(INV_1.id);
    });
  });

  // -------------------------------------------------------------------------
  // 3. ExplorerComparisonBar
  // -------------------------------------------------------------------------
  describe('ExplorerComparisonBar', () => {
    it('renders null when compareList is empty', () => {
      const { container } = renderWithQuery(
        <ExplorerComparisonBar
          compareList={[]}
          onRemove={vi.fn()}
          onClear={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders study labels when studies are supplied and falls back cleanly for UUIDs', () => {
      const handleRemove = vi.fn();
      const handleClear = vi.fn();

      renderWithQuery(
        <ExplorerComparisonBar
          compareList={[INV_1.id, INV_2.id]}
          studies={[{ id: INV_1.id, label: INV_1.psiId }]}
          onRemove={handleRemove}
          onClear={handleClear}
        />
      );

      expect(screen.getByTestId('explorer-comparison-dock')).toBeDefined();
      expect(screen.getByTestId(`compare-chip-${INV_1.id}`).textContent).toContain(
        'SYNTHETIC-PHASE4-1'
      );
      expect(screen.getByTestId(`compare-chip-${INV_2.id}`).textContent).toContain(
        INV_2.id.slice(0, 8)
      );

      fireEvent.click(screen.getByTestId(`remove-compare-${INV_1.id}`));
      expect(handleRemove).toHaveBeenCalledWith(INV_1.id);

      fireEvent.click(screen.getByTestId('clear-all-compare-btn'));
      expect(handleClear).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 4. ExplorerCatalogPage (/explorer)
  // -------------------------------------------------------------------------
  describe('ExplorerCatalogPage (/explorer)', () => {
    it('renders live investigations in grid view with caveats banner and summary count', async () => {
      renderWithQuery(<ExplorerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('explorer-grid-view')).toBeDefined();
      });

      expect(screen.getByTestId('explorer-catalog-page')).toBeDefined();
      expect(screen.getByTestId('explorer-caveats-banner')).toBeInTheDocument();
      expect(screen.getByTestId('explorer-summary-count').textContent).toContain(
        'Showing 2 of 2 NASA PSI Studies'
      );
      expect(screen.getByTestId(`investigation-card-${INV_1.id}`)).toBeDefined();
      expect(screen.getByTestId(`investigation-card-${INV_2.id}`)).toBeDefined();
    });

    it('switches to table view when list button is clicked', async () => {
      renderWithQuery(<ExplorerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('explorer-grid-view')).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('view-table-btn'));

      expect(screen.getByTestId('investigations-table')).toBeDefined();
      expect(screen.queryByTestId('explorer-grid-view')).toBeNull();
    });

    it('sends only backend-supported filter and sort params to listInvestigations', async () => {
      renderWithQuery(<ExplorerPage />);

      await waitFor(() => {
        expect(apiServices.listInvestigations).toHaveBeenCalled();
      });

      fireEvent.change(screen.getByTestId('explorer-search-input'), {
        target: { value: 'Saffire' },
      });
      fireEvent.change(screen.getByTestId('platform-filter-select'), {
        target: { value: 'MSG' },
      });
      fireEvent.change(screen.getByTestId('material-filter-input'), {
        target: { value: 'PMMA' },
      });
      fireEvent.change(screen.getByTestId('gravity-filter-select'), {
        target: { value: '0g' },
      });
      fireEvent.change(screen.getByTestId('sort-by-select'), {
        target: { value: 'runs-desc' },
      });

      await waitFor(() => {
        const calls = vi.mocked(apiServices.listInvestigations).mock.calls;
        const latestParams = calls[calls.length - 1]?.[0] as Record<string, unknown>;
        expect(latestParams).toEqual({
          q: 'Saffire',
          platform: 'MSG',
          material: 'PMMA',
          gravityRaw: '0g',
          sort: 'runs-desc',
          offset: 0,
          limit: 20,
        });
        expect(latestParams).not.toHaveProperty('fuel');
        expect(latestParams).not.toHaveProperty('facility');
        expect(latestParams).not.toHaveProperty('gravity');
        expect(latestParams).not.toHaveProperty('category');
      });
    });

    it('shows empty state when backend returns 0 items and resets filters on button click', async () => {
      vi.mocked(apiServices.listInvestigations).mockImplementation(async (params) => {
        if (params?.q === 'nonexistent-string-xyz') {
          return makePageDto([], { total: 0, offset: 0, limit: 20, next: null });
        }
        return makePageDto([INV_1, INV_2]);
      });

      renderWithQuery(<ExplorerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('explorer-grid-view')).toBeDefined();
      });

      fireEvent.change(screen.getByTestId('explorer-search-input'), {
        target: { value: 'nonexistent-string-xyz' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('explorer-empty-state')).toBeDefined();
      });
      expect(screen.getByText('No investigations match your filters')).toBeDefined();
      expect(screen.queryByTestId('end-of-list-indicator')).toBeNull();

      fireEvent.click(screen.getByTestId('empty-reset-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('explorer-grid-view')).toBeDefined();
      });
      expect(screen.getByTestId('explorer-summary-count').textContent).toContain(
        'Showing 2 of 2 NASA PSI Studies'
      );
      expect(screen.getByTestId('end-of-list-indicator')).toBeInTheDocument();
    });

    it('renders pagination controls when total exceeds page limit and advances offset on Next', async () => {
      vi.mocked(apiServices.listInvestigations).mockImplementation(async (params) => {
        const offset = params?.offset ?? 0;
        return makePageDto(offset === 0 ? [INV_1] : [INV_2], {
          total: 25,
          offset,
          limit: 20,
          next: offset === 0 ? '/api/v1/investigations?offset=20&limit=20' : null,
        });
      });

      renderWithQuery(<ExplorerPage />);

      await waitFor(() => {
        expect(screen.getByTestId('explorer-pagination')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('pagination-next-btn'));

      await waitFor(() => {
        const calls = vi.mocked(apiServices.listInvestigations).mock.calls;
        expect(calls[calls.length - 1]?.[0]).toMatchObject({ offset: 20, limit: 20 });
      });
    });

    it('adds and removes studies to compare list in store and shows psiId in ComparisonBar', async () => {
      renderWithQuery(<ExplorerPage />);

      await waitFor(() => {
        expect(screen.getByTestId(`compare-btn-${INV_1.id}`)).toBeDefined();
      });

      fireEvent.click(screen.getByTestId(`compare-btn-${INV_1.id}`));

      expect(useWorkspaceStore.getState().compareList).toContain(INV_1.id);
      expect(screen.getByTestId('explorer-comparison-dock')).toBeDefined();
      expect(screen.getByTestId(`compare-chip-${INV_1.id}`).textContent).toContain(
        'SYNTHETIC-PHASE4-1'
      );

      fireEvent.click(screen.getByTestId('clear-all-compare-btn'));
      expect(useWorkspaceStore.getState().compareList).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Study Detail Components
  // -------------------------------------------------------------------------
  describe('Study Detail Components', () => {
    const study = mapInvestigationDetailDto(
      makeInvestigationDetailDto({ id: INV_1.id, psiId: INV_1.psiId, platform: 'MSG' })
    );
    const runs = [
      mapRunDto(makeRunDto({ id: 'b8f882f6-6fde-5b18-a505-f668bdc12c42', externalRunKey: 'RUN-01' })),
      mapRunDto(
        makeRunDto({
          id: 'f04922ad-2fbf-5afe-ba7e-bc5a01b9149f',
          externalRunKey: 'RUN-02',
          materialType: 'TEST_MATERIAL_B',
          gravity: '1g',
        })
      ),
    ];
    const observations = [mapObservationDto(makeObservationDto())];
    const sources = [mapSourceDto(makeSourceDto({ doi: '10.1000/synthetic-psi' }))];

    it('StudyHeader renders MappedInvestigationDetail, caveats, totals, and compare toggle', () => {
      const handleToggle = vi.fn();
      renderWithQuery(
        <StudyHeader
          study={study}
          sources={sources}
          isComparing={false}
          onToggleCompare={handleToggle}
        />
      );

      expect(screen.getByTestId('study-header')).toBeDefined();
      expect(screen.getByTestId('back-to-explorer-link')).toBeDefined();
      expect(screen.getByTestId('study-nasa-psi-link')).toBeDefined();
      expect(screen.getByTestId('study-caveats-notice')).toBeInTheDocument();
      expect(screen.getAllByText(study.psiId).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(study.title)).toBeDefined();

      fireEvent.click(screen.getByTestId('header-compare-btn'));
      expect(handleToggle).toHaveBeenCalledWith(study.id);
    });

    it('TestRunsTable displays MappedRun rows, search filter, and live run inspector', async () => {
      renderWithQuery(<TestRunsTable study={study} runs={runs} />);

      expect(screen.getByTestId('test-runs-table-container')).toBeDefined();
      expect(screen.getByTestId('runs-table')).toBeDefined();
      expect(screen.getByTestId(`run-row-${runs[0].id}`)).toBeDefined();

      fireEvent.change(screen.getByTestId('runs-search-input'), {
        target: { value: 'RUN-02' },
      });
      expect(screen.queryByTestId(`run-row-${runs[0].id}`)).toBeNull();
      expect(screen.getByTestId(`run-row-${runs[1].id}`)).toBeDefined();

      fireEvent.click(screen.getByTestId(`inspect-run-btn-${runs[1].id}`));
      await waitFor(() => {
        expect(screen.getByTestId('selected-run-inspector')).toBeInTheDocument();
        expect(screen.getByText('TEST_ONLY_OXYGEN')).toBeInTheDocument();
      });
    });

    it('TelemetryPane displays real conditions & measurements without fabricating curves', async () => {
      renderWithQuery(
        <TelemetryPane study={study} runs={runs} observations={observations} />
      );

      expect(screen.getByTestId('telemetry-pane')).toBeDefined();
      expect(screen.queryByTestId('telemetry-svg-chart')).toBeNull();
      expect(screen.getByTestId('telemetry-provenance-notice')).toBeInTheDocument();
      expect(screen.getByTestId('run-conditions-panel')).toBeInTheDocument();
      expect(screen.getByTestId('run-measurements-panel')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('TEST_ONLY_OXYGEN')).toBeInTheDocument();
        expect(screen.getByText('TEST_ONLY_OBSERVABLE')).toBeInTheDocument();
      });

      const run2Btn = screen.getByTestId(`telemetry-run-btn-${runs[1].id}`);
      fireEvent.click(run2Btn);
      expect(run2Btn.className).toContain('bg-[#D4FC02]');
    });

    it('ClaimsList renders claims, DOI links, and contextMismatch amber warnings', () => {
      const claimWithMismatch = mapClaimDto(
        makeClaimDto({
          sources: makePageDto([
            makeClaimSourceDto({
              contextMismatch: true,
              source: makeSourceDto({ doi: '10.1000/synthetic-psi' }),
            }),
          ]),
        })
      );

      renderWithQuery(<ClaimsList study={study} claims={[claimWithMismatch]} />);

      expect(screen.getByTestId('claims-list-container')).toBeDefined();
      expect(screen.getByTestId(`claim-card-${claimWithMismatch.id}`)).toBeDefined();
      expect(screen.getByTestId(`claim-mismatch-badge-${claimWithMismatch.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`claim-source-mismatch-${claimWithMismatch.sources[0].id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`doi-link-${claimWithMismatch.id}`)).toBeDefined();
    });

    it('ChamberOverviewTab renders researchPurpose, unavailableFields disclosure, and sources', () => {
      renderWithQuery(<ChamberOverviewTab study={study} sources={sources} />);

      expect(screen.getByTestId('chamber-overview-tab')).toBeDefined();
      expect(screen.getByTestId('unavailable-fields-card').textContent).toContain(
        'UNSUPPORTED_MAPPING'
      );
      expect(screen.getByTestId('study-sources-card').textContent).toContain('TEST_ONLY');
    });

    it('PsiExportTab triggers JSON and CSV exports for mapped study data', () => {
      const claims = [mapClaimDto(makeClaimDto())];
      renderWithQuery(
        <PsiExportTab
          study={study}
          runs={runs}
          observations={observations}
          sources={sources}
          claims={claims}
        />
      );

      expect(screen.getByTestId('psi-export-tab')).toBeDefined();
      fireEvent.click(screen.getByTestId('export-json-btn'));
      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('export-csv-btn'));
      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(2);
    });

    it('TestRunsTable renders pagination controls and honest search notice when runs are partially loaded', () => {
      const handleLoadMore = vi.fn();
      const handleLoadAll = vi.fn();

      renderWithQuery(
        <TestRunsTable
          study={study}
          runs={runs.slice(0, 1)}
          totalRuns={10}
          onLoadMore={handleLoadMore}
          onLoadAll={handleLoadAll}
          hasMore={true}
        />
      );

      expect(screen.getByTestId('runs-pagination-controls')).toBeInTheDocument();
      expect(screen.queryByTestId('end-of-list-indicator')).toBeNull();

      fireEvent.change(screen.getByTestId('runs-search-input'), {
        target: { value: 'RUN' },
      });
      expect(screen.getByTestId('runs-search-scope-notice')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('load-more-runs-btn'));
      expect(handleLoadMore).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('load-all-runs-btn'));
      expect(handleLoadAll).toHaveBeenCalledTimes(1);
    });

    it('ClaimsList allows loading additional provenance sources using useClaimSourcesQuery', async () => {
      vi.mocked(apiServices.listClaimSources).mockResolvedValueOnce(
        makePageDto([
          makeClaimSourceDto({
            id: 'second-source-id',
            sourceLocator: 'Second Source Locator',
            contextMismatch: false,
          }),
          makeClaimSourceDto({
            id: 'third-source-id',
            sourceLocator: 'Third Source Locator',
            contextMismatch: false,
          }),
        ])
      );

      const claimWithExtraSources = mapClaimDto(
        makeClaimDto({
          sources: {
            ...makePageDto([
              makeClaimSourceDto({
                sourceLocator: 'Initial Page 1 Locator',
                contextMismatch: false,
              }),
            ]),
            total: 3,
          },
        })
      );

      renderWithQuery(<ClaimsList study={study} claims={[claimWithExtraSources]} />);

      const loadMoreBtn = screen.getByTestId(`load-more-sources-${claimWithExtraSources.id}`);
      expect(loadMoreBtn).toBeInTheDocument();
      expect(loadMoreBtn.textContent).toContain('Load remaining 2 sources');

      fireEvent.click(loadMoreBtn);

      await waitFor(() => {
        expect(screen.getByText(/All 3 sources loaded/i)).toBeInTheDocument();
      });
    });

    it('PsiExportTab displays partial export warning and provides fetch full dataset button', () => {
      const handleFetchAll = vi.fn();
      const claims = [mapClaimDto(makeClaimDto())];

      renderWithQuery(
        <PsiExportTab
          study={study}
          runs={runs.slice(0, 1)}
          observations={observations}
          sources={sources}
          claims={claims}
          totalRuns={10}
          onFetchAllData={handleFetchAll}
        />
      );

      expect(screen.getByTestId('dataset-completeness-badge').textContent).toContain('Partial Dataset');
      expect(screen.getByTestId('partial-export-warning')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('fetch-all-export-btn'));
      expect(handleFetchAll).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Dynamic StudyDetailPage (/explorer/[id])
  // -------------------------------------------------------------------------
  describe('StudyDetailPage (/explorer/[id])', () => {
    it('renders detail page from backend hooks and switches across all 5 tabs', async () => {
      mockParams = { id: INV_1.id };
      renderWithQuery(<StudyDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId('study-detail-page')).toBeInTheDocument();
      });

      expect(screen.getByTestId('chamber-overview-tab')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('tab-runs'));
      expect(screen.getByTestId('test-runs-table-container')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('tab-telemetry'));
      expect(screen.getByTestId('telemetry-pane')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('tab-claims'));
      expect(screen.getByTestId('claims-list-container')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('tab-psi-export'));
      expect(screen.getByTestId('psi-export-tab')).toBeInTheDocument();
    });

    it('renders not found state on 404 ENTITY_NOT_FOUND', async () => {
      vi.mocked(apiServices.getInvestigationBySlug).mockRejectedValueOnce(
        new ApiClientError({
          status: 404,
          code: 'ENTITY_NOT_FOUND',
          message: 'Investigation not found',
        })
      );
      mockParams = { id: 'nonexistent-study-id' };
      renderWithQuery(<StudyDetailPage />);

      await waitFor(() => {
        expect(screen.getByTestId('study-not-found')).toBeInTheDocument();
      });
      expect(screen.getByText('Investigation Not Found')).toBeInTheDocument();
      expect(screen.getByTestId('not-found-return-link')).toBeInTheDocument();
    });
  });
});
