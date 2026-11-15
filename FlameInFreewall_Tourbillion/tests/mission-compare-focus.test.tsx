import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MissionResearch } from '@/features/mission/components/MissionResearch';
import { parseCompareFocus, useMissionFocusKeys } from '@/features/mission/compareFocus';
import { getInvestigationById } from '@/api/services';
import { createTestQueryClient } from './test-utils';
import { makeInvestigationDetailDto } from './fixtures/backendFixtures';
import { apiPost } from '@/api/client';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import type { BriefRow, ResearchBrief } from '@/types/missionResearch';

vi.mock('@/api/client', () => ({ apiPost: vi.fn() }));
vi.mock('@/api/services', async (orig) => ({ ...(await orig<object>()), getInvestigationById: vi.fn() }));

// TEST ONLY rows: synthetic codes, not NASA evidence.
function row(investigationId: string, code: string): BriefRow {
  return {
    investigationId, code, title: `${code} synthetic`, purpose: 'prevention',
    selectionReason: `${code} reason`, passages: [],
    availability: { records: 0, documents: 0, excludedRecords: 0, independentlyReviewedRecords: null },
    conditionStatus: 'no_records', dimensions: [], record: null, limitations: [],
  };
}
const brief = {
  workflowId: 'prevention', revision: 'TEST_REVISION', citations: [], method: [], limitations: [], nextSteps: [],
  rows: [row('synthetic-a', 'SYN-A'), row('synthetic-b', 'SYN-B'), row('synthetic-c', 'SYN-C')],
} as unknown as ResearchBrief;

beforeEach(() => { useWorkspaceStore.getState().resetWorkspace(); vi.mocked(apiPost).mockReset(); vi.mocked(getInvestigationById).mockReset(); });
afterEach(cleanup);

describe('parseCompareFocus', () => {
  it('trims, dedupes, drops invalid keys and caps at three', () => {
    expect(parseCompareFocus(null)).toEqual([]);
    expect(parseCompareFocus(' flex , flex,bass-ii,,<script>,a b,saffire-iii,acme')).toEqual(['flex', 'bass-ii', 'saffire-iii']);
  });
});

describe('useMissionFocusKeys', () => {
  const UUID = 'e1a75331-3f1f-57b8-9042-405ff61dff51';
  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
  }

  it('resolves tray UUIDs to the catalog slug used by mission rows and dedupes', async () => {
    vi.mocked(getInvestigationById).mockResolvedValue(makeInvestigationDetailDto({ id: UUID, slug: 'synthetic-a' }));
    const { result } = renderHook(() => useMissionFocusKeys(`${UUID},synthetic-a,synthetic-b`), { wrapper });
    await waitFor(() => expect(result.current).toEqual(['synthetic-a', 'synthetic-b']));
    expect(getInvestigationById).toHaveBeenCalledTimes(1);
  });

  it('keeps an unresolvable UUID so the panel can report it', async () => {
    vi.mocked(getInvestigationById).mockRejectedValue(new Error('404'));
    const { result } = renderHook(() => useMissionFocusKeys(UUID), { wrapper });
    await waitFor(() => expect(getInvestigationById).toHaveBeenCalled());
    expect(result.current).toEqual([UUID]);
  });
});

describe('MissionResearch comparison focus', () => {
  it('announces the handed-over selection before analysis', () => {
    render(<MissionResearch focusKeys={['synthetic-a', 'synthetic-c']} />);
    expect(screen.getByTestId('compare-focus').textContent).toContain('2 investigations selected in Comparison');
  });

  it('shows only the selected investigations and can reveal all rows', async () => {
    vi.mocked(apiPost).mockResolvedValue(brief);
    render(<MissionResearch focusKeys={['synthetic-a', 'synthetic-c']} />);
    fireEvent.click(screen.getByText('Analyze evidence'));
    await screen.findByText('SYN-A');
    expect(screen.getByText('SYN-C')).toBeDefined();
    expect(screen.queryByText('SYN-B')).toBeNull();
    expect(screen.getByTestId('compare-focus-count').textContent).toContain('2 of 3');

    fireEvent.click(screen.getByRole('button', { name: /Show all 3 related investigations/ }));
    expect(screen.getByText('SYN-B')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Show only selected/ }));
    expect(screen.queryByText('SYN-B')).toBeNull();
  });

  it('says which selected investigations are not returned for the purpose instead of hiding them', async () => {
    vi.mocked(apiPost).mockResolvedValue(brief);
    render(<MissionResearch focusKeys={['synthetic-a', 'not-classified']} />);
    fireEvent.click(screen.getByText('Analyze evidence'));
    await screen.findByText('SYN-A');
    expect(screen.getByTestId('compare-focus-missing').textContent).toContain('1 selected investigation');
    expect(screen.getByTestId('compare-focus-missing').textContent).toContain('prevention');
  });

  it('keeps the full list when nothing was handed over', async () => {
    vi.mocked(apiPost).mockResolvedValue(brief);
    render(<MissionResearch />);
    fireEvent.click(screen.getByText('Analyze evidence'));
    await screen.findByText('SYN-B');
    expect(screen.queryByTestId('compare-focus')).toBeNull();
    expect(screen.getByText(/related investigations/).textContent).toContain('3');
  });
});
