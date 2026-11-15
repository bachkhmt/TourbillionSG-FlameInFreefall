import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
  ComparisonBar,
  ComparisonColumn,
  ComparisonMatrixTable,
  ComparisonModal,
  ParameterDeltaSummary,
} from '@/features/explorer';
import { Header } from '../src/components/layout/Header';
import ExplorerPage from '../src/app/(dashboard)/explorer/page';
import { mapComparisonDto } from '../src/api/mappers';
import * as apiServices from '../src/api/services';
import { useWorkspaceStore } from '../src/store/useWorkspaceStore';
import { toastStore } from '../src/components/toast/toast-store';
import { renderWithQuery } from './test-utils';
import {
  makeCapabilitiesDto,
  makeComparisonDto,
  makeInvestigationDto,
  makePageDto,
} from './fixtures/backendFixtures';

const mockPush = vi.fn();

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
  useParams: () => ({ id: 'e1a75331-3f1f-57b8-9042-405ff61dff51' }),
}));

vi.mock('@/api/services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/services')>();
  return {
    ...actual,
    getCatalogCapabilities: vi.fn(),
    listInvestigations: vi.fn(),
    compareInvestigations: vi.fn(),
  };
});

const INV_1_ID = 'e1a75331-3f1f-57b8-9042-405ff61dff51';
const INV_2_ID = 'afa58280-0d0c-58a3-926a-1499a1e20a96';

const INV_1 = makeInvestigationDto({
  id: INV_1_ID,
  psiId: 'SYNTHETIC-PHASE4-1',
  title: 'Synthetic Flame Study One',
  platform: 'MSG',
});

const INV_2 = makeInvestigationDto({
  id: INV_2_ID,
  psiId: 'SYNTHETIC-PHASE4-2',
  slug: 'saffire-synthetic',
  title: 'Synthetic Flame Study Two',
  platform: null,
});

describe('Multi-Study Comparison System (Backend Wired)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().resetWorkspace();
    toastStore.clear();

    vi.mocked(apiServices.getCatalogCapabilities).mockResolvedValue(makeCapabilitiesDto());
    vi.mocked(apiServices.listInvestigations).mockResolvedValue(
      makePageDto([INV_1, INV_2], { total: 2, offset: 0, limit: 20, next: null })
    );
    vi.mocked(apiServices.compareInvestigations).mockResolvedValue(makeComparisonDto());

    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-comparison-csv-url');
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  // ---------------------------------------------------------------------------
  // 1. ComparisonBar Component Tests
  // ---------------------------------------------------------------------------
  describe('ComparisonBar Component', () => {
    it('renders null when compareList is empty', () => {
      const { container } = renderWithQuery(
        <ComparisonBar compareList={[]} onRemove={vi.fn()} onClear={vi.fn()} onOpenModal={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders floating selection bar with study labels and falls back for unknown IDs', () => {
      renderWithQuery(
        <ComparisonBar
          compareList={[INV_1_ID, INV_2_ID]}
          studies={[{ id: INV_1_ID, label: 'SYNTHETIC-PHASE4-1' }]}
          onRemove={vi.fn()}
          onClear={vi.fn()}
          onOpenModal={vi.fn()}
        />
      );

      expect(screen.getByTestId('explorer-comparison-dock')).toBeInTheDocument();
      expect(screen.getByTestId(`compare-chip-${INV_1_ID}`).textContent).toContain(
        'SYNTHETIC-PHASE4-1'
      );
      expect(screen.getByTestId(`compare-chip-${INV_2_ID}`).textContent).toContain(
        INV_2_ID.slice(0, 8)
      );
      expect(screen.getByText('Compare (2/3):')).toBeInTheDocument();
    });

    it('disables Compare button when fewer than 2 studies selected', () => {
      const handleOpen = vi.fn();
      renderWithQuery(
        <ComparisonBar
          compareList={[INV_1_ID]}
          onRemove={vi.fn()}
          onClear={vi.fn()}
          onOpenModal={handleOpen}
        />
      );

      const compareBtn = screen.getByTestId('open-comparison-modal-btn') as HTMLButtonElement;
      expect(compareBtn.disabled).toBe(true);
      expect(screen.getByTestId('compare-btn-tooltip').textContent).toBe('Select 1 more study to compare');

      fireEvent.click(compareBtn);
      expect(handleOpen).not.toHaveBeenCalled();
    });

    it('enables Compare button for 2+ studies and triggers callbacks', () => {
      const handleOpen = vi.fn();
      const handleRemove = vi.fn();
      const handleClear = vi.fn();
      renderWithQuery(
        <ComparisonBar
          compareList={[INV_1_ID, INV_2_ID]}
          onRemove={handleRemove}
          onClear={handleClear}
          onOpenModal={handleOpen}
        />
      );

      fireEvent.click(screen.getByTestId('open-comparison-modal-btn'));
      expect(handleOpen).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId(`remove-compare-${INV_1_ID}`));
      expect(handleRemove).toHaveBeenCalledWith(INV_1_ID);

      fireEvent.click(screen.getByTestId('clear-all-compare-btn'));
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('falls back to Zustand workspace store when props are omitted', () => {
      act(() => {
        useWorkspaceStore.getState().toggleCompare(INV_1_ID);
        useWorkspaceStore.getState().toggleCompare(INV_2_ID);
      });

      renderWithQuery(<ComparisonBar />);
      expect(screen.getByTestId(`compare-chip-${INV_1_ID}`)).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('clear-all-compare-btn'));
      expect(useWorkspaceStore.getState().compareList).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Mapped Comparison Subcomponents
  // ---------------------------------------------------------------------------
  describe('Mapped Comparison Subcomponents', () => {
    it('ParameterDeltaSummary renders counts and honest comparability not_established notice', () => {
      const comparison = mapComparisonDto(makeComparisonDto());
      renderWithQuery(<ParameterDeltaSummary comparison={comparison} />);

      expect(screen.getByTestId('parameter-delta-summary')).toBeInTheDocument();
      expect(screen.getByTestId('comparison-comparability-badge').textContent).toContain(
        'Comparability: not_established'
      );
      expect(screen.getByTestId('summary-studies-count').textContent).toContain('2 Investigations');
      expect(screen.getByTestId('comparability-notice').textContent).toContain(
        'SCIENTIFIC_COMPARISON_NOT_APPROVED'
      );
      expect(screen.getByTestId('comparability-notice').textContent).toContain(
        'SYNTHETIC TEST ONLY; not a NASA finding'
      );
    });

    it('ComparisonMatrixTable and ComparisonColumn render observableSummaries and unavailableFields', () => {
      const comparison = mapComparisonDto(makeComparisonDto());
      const handleRemove = vi.fn();

      renderWithQuery(
        <>
          <ComparisonMatrixTable studies={comparison.studies} onRemove={handleRemove} />
          <ComparisonColumn study={comparison.studies[1]} onRemove={handleRemove} />
        </>
      );

      expect(screen.getByTestId('comparison-matrix-table')).toBeInTheDocument();
      expect(screen.getAllByTestId(`comparison-code-${INV_1_ID}`).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/TEST_ONLY_OBSERVABLE/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Non-numeric/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/UNSUPPORTED_MAPPING/).length).toBeGreaterThanOrEqual(1);

      fireEvent.click(screen.getAllByTestId(`remove-column-${INV_2_ID}`)[0]);
      expect(handleRemove).toHaveBeenCalledWith(INV_2_ID);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ComparisonModal Component Tests
  // ---------------------------------------------------------------------------
  describe('ComparisonModal Component', () => {
    it('does not render or call POST /compare when isOpen is false', () => {
      renderWithQuery(
        <ComparisonModal isOpen={false} onClose={vi.fn()} compareList={[INV_1_ID, INV_2_ID]} />
      );
      expect(screen.queryByTestId('comparison-modal')).toBeNull();
      expect(apiServices.compareInvestigations).not.toHaveBeenCalled();
    });

    it('shows prompt without calling API when fewer than 2 studies are selected', () => {
      renderWithQuery(
        <ComparisonModal isOpen={true} onClose={vi.fn()} compareList={[INV_1_ID]} />
      );
      expect(screen.getByText('Select at least 2 studies')).toBeInTheDocument();
      expect(apiServices.compareInvestigations).not.toHaveBeenCalled();
    });

    it('renders loading shimmer while POST /compare is pending', () => {
      vi.mocked(apiServices.compareInvestigations).mockReturnValue(new Promise(() => {}));
      renderWithQuery(
        <ComparisonModal isOpen={true} onClose={vi.fn()} compareList={[INV_1_ID, INV_2_ID]} />
      );
      expect(screen.getByTestId('comparison-loading-shimmer')).toBeInTheDocument();
    });

    it('renders ApiErrorBanner on compare failure and retries cleanly', async () => {
      vi.mocked(apiServices.compareInvestigations)
        .mockRejectedValueOnce(new Error('Comparison service timeout'))
        .mockResolvedValueOnce(makeComparisonDto());

      renderWithQuery(
        <ComparisonModal isOpen={true} onClose={vi.fn()} compareList={[INV_1_ID, INV_2_ID]} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('api-error-banner')).toBeInTheDocument();
      });
      expect(screen.getByText(/Comparison service timeout/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

      await waitFor(() => {
        expect(screen.getByTestId('comparison-matrix-table')).toBeInTheDocument();
      });
      expect(apiServices.compareInvestigations).toHaveBeenCalledTimes(2);
    });

    it('switches between table matrix and cards views and exports CSV', async () => {
      renderWithQuery(
        <ComparisonModal isOpen={true} onClose={vi.fn()} compareList={[INV_1_ID, INV_2_ID]} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('comparison-matrix-table')).toBeInTheDocument();
      });

      expect(apiServices.compareInvestigations).toHaveBeenCalledWith(
        { investigationIds: [INV_1_ID, INV_2_ID], observationLimit: 100 },
        expect.anything()
      );

      fireEvent.click(screen.getByTestId('comparison-view-cards-btn'));
      expect(screen.getByTestId('comparison-grid')).toBeInTheDocument();
      expect(screen.getByTestId(`comparison-column-${INV_1_ID}`)).toBeInTheDocument();
      expect(screen.getByTestId(`comparison-column-${INV_2_ID}`)).toBeInTheDocument();

      const exportBtn = screen.getByTestId('export-comparison-csv-btn') as HTMLButtonElement;
      expect(exportBtn.disabled).toBe(false);
      fireEvent.click(exportBtn);

      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(toastStore.getToasts().some((t) => t.title.includes('Comparison CSV Exported'))).toBe(true);
    });

    it('navigates to /mission?compare=... and handles close interactions', async () => {
      const handleClose = vi.fn();
      renderWithQuery(
        <ComparisonModal isOpen={true} onClose={handleClose} compareList={[INV_1_ID, INV_2_ID]} />
      );

      fireEvent.click(screen.getByTestId('open-mission-workbench-btn'));
      expect(mockPush).toHaveBeenCalledWith(`/mission?compare=${INV_1_ID},${INV_2_ID}`);

      fireEvent.click(screen.getByTestId('close-comparison-modal-btn'));
      fireEvent.click(screen.getByTestId('comparison-modal-close-icon'));
      fireEvent.click(screen.getByTestId('comparison-modal-backdrop'));
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(5);
    });

    it('clicking Inspect Study in comparison view closes the comparison modal', async () => {
      const handleClose = vi.fn();
      renderWithQuery(
        <ComparisonModal isOpen={true} onClose={handleClose} compareList={[INV_1_ID, INV_2_ID]} />
      );

      await waitFor(() => {
        expect(screen.getByTestId(`comparison-column-details-${INV_1_ID}`)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId(`comparison-column-details-${INV_1_ID}`));
      expect(handleClose).toHaveBeenCalled();
      expect(useWorkspaceStore.getState().isComparisonModalOpen).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Header & ExplorerPage Integration Tests
  // ---------------------------------------------------------------------------
  describe('Header and ExplorerPage Integration', () => {
    it('Header comparison pill opens modal when >= 2 studies or warns when < 2', () => {
      act(() => {
        useWorkspaceStore.getState().toggleCompare(INV_1_ID);
      });

      const { rerender } = renderWithQuery(<Header />);
      fireEvent.click(screen.getByTestId('header-compare-trigger'));
      expect(useWorkspaceStore.getState().isComparisonModalOpen).toBe(false);
      expect(toastStore.getToasts().some((t) => t.title.includes('Select 1 more study'))).toBe(true);

      act(() => {
        useWorkspaceStore.getState().toggleCompare(INV_2_ID);
      });
      rerender(<Header />);
      fireEvent.click(screen.getByTestId('header-compare-trigger'));
      expect(useWorkspaceStore.getState().isComparisonModalOpen).toBe(true);
    });

    it('ExplorerPage connects floating comparison dock with live ComparisonModal workflow', async () => {
      renderWithQuery(<ExplorerPage />);

      await waitFor(() => {
        expect(screen.getByTestId(`compare-btn-${INV_1_ID}`)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId(`compare-btn-${INV_1_ID}`));
      fireEvent.click(screen.getByTestId(`compare-btn-${INV_2_ID}`));

      expect(screen.getByTestId('explorer-comparison-dock')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('open-comparison-modal-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('comparison-matrix-table')).toBeInTheDocument();
      });
      expect(screen.getByTestId(`comparison-column-${INV_1_ID}`)).toBeInTheDocument();
      expect(screen.getByTestId(`comparison-column-${INV_2_ID}`)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('close-comparison-modal-btn'));
      expect(useWorkspaceStore.getState().isComparisonModalOpen).toBe(false);
    });
  });
});
