import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import PredictiveLabPage from '../src/app/(dashboard)/predictive-lab/page';
import * as apiServices from '@/api/services';
import { renderWithQuery } from './test-utils';
import { ApiClientError } from '@/api/client';
import { PREDICTIVE_LAB_REPORT, formatUnit, verdictFor } from '@/features/predictive-lab/report';

vi.mock('next/navigation', () => ({
  usePathname: () => '/predictive-lab',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('@/api/services', async (orig) => ({
  ...(await orig<object>()),
  getPredictionReadiness: vi.fn(),
}));

const readiness = vi.mocked(apiServices.getPredictionReadiness);
const NOT_READY = {
  state: 'not_ready' as const,
  reasons: ['model_selection_required'],
  modelId: null,
  modelVersion: null,
  datasetVersion: null,
  origin: 'unknown',
  capabilities: {},
  limitations: [],
};

beforeEach(() => {
  readiness.mockReset();
});
afterEach(cleanup);

describe('Predictive Lab page', () => {
  it('shows backend readiness with a plain-language reason and no prediction controls', async () => {
    readiness.mockResolvedValue(NOT_READY as never);
    renderWithQuery(<PredictiveLabPage />);

    expect(screen.getByRole('status').textContent).toMatch(/Checking model readiness/);
    await screen.findByText(/No model has been selected/);
    const card = screen.getByTestId('prediction-readiness');
    expect(card.textContent).toMatch(/Not ready/);
    expect(card.textContent).toMatch(/No model has been selected/);
    expect(card.textContent).toMatch(/model_selection_required/);
    expect(screen.getByText(/No predictions are served/)).toBeDefined();
    expect(screen.getByRole('link', { name: /Mission Evidence/ }).getAttribute('href')).toBe('/mission');
    // Report only: nothing accepts scenario input or shows a predicted value.
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(screen.queryByText(/predicted value/i)).toBeNull();
  });

  it('offers a retry when readiness cannot be loaded', async () => {
    readiness.mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce(NOT_READY as never);
    renderWithQuery(<PredictiveLabPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Retry/ }));
    await screen.findByText(/No model has been selected/);
    expect(readiness).toHaveBeenCalledTimes(2);
  });

  it('reports each exploratory experiment with honest labels and baseline comparison', async () => {
    readiness.mockResolvedValue(NOT_READY as never);
    renderWithQuery(<PredictiveLabPage />);
    const cards = await screen.findAllByTestId(/^experiment-/);
    expect(cards.map((c) => c.getAttribute('data-testid'))).toEqual([
      'experiment-flex_heptane',
      'experiment-cfig_normal',
      'experiment-cfi_droplet_khot',
      'experiment-saffire_ii_spread',
    ]);
    for (const card of cards) {
      expect(card.textContent).toMatch(/Blocked/);
      expect(card.textContent).toMatch(/Unreviewed/);
      expect(card.textContent).toMatch(/Not public/);
    }

    const cfi = within(screen.getByTestId('experiment-cfi_droplet_khot'));
    expect(cfi.getByText(/does not beat the median baseline/i)).toBeDefined();
    expect(cfi.getAllByText('mm²/s', { exact: false }).length).toBeGreaterThan(0);
    expect(cfi.queryByText('mm^2/s', { exact: false })).toBeNull();

    const cfig = within(screen.getByTestId('experiment-cfig_normal'));
    expect(cfig.getByText(/No validation plan yet/)).toBeDefined();
    expect(cfig.getByText('36.70', { exact: false })).toBeDefined();
    expect(cfig.getByText('41.70', { exact: false })).toBeDefined();
    // The notebook selects on group-mean MAE, so that column must be visible too.
    expect(cfig.getByRole('columnheader', { name: /Group-mean MAE/ })).toBeDefined();
    expect(cfig.getByText('36.94', { exact: false })).toBeDefined();
    expect(cfig.getByText(/compared on the 84 of 102 rows Ridge covers/)).toBeDefined();

    const flex = within(screen.getByTestId('experiment-flex_heptane'));
    expect(flex.getByText(/Only 3 held-out rows/)).toBeDefined();

    const saffire = within(screen.getByTestId('experiment-saffire_ii_spread'));
    expect(saffire.getByText(/no model comparison was run/)).toBeDefined();
    expect(saffire.queryByText(/audit\.json/)).toBeNull();
    expect(saffire.queryByRole('table')).toBeNull();
  });

  it('report data stays labelled exploratory: regenerating validated entries must be reviewed', () => {
    expect(PREDICTIVE_LAB_REPORT.experiments.length).toBeGreaterThan(0);
    for (const e of PREDICTIVE_LAB_REPORT.experiments) {
      expect([e.experiment, e.status, e.reviewStatus, e.publicReadiness]).toEqual([
        e.experiment,
        'blocked',
        'unreviewed',
        'not_ready',
      ]);
      expect(Object.keys(e.sources).length).toBeGreaterThan(0);
      expect(JSON.stringify(e)).not.toMatch(/selected_run_ids|predictions\.csv/);
    }
    expect(PREDICTIVE_LAB_REPORT.sourceNote).toMatch(/Exploratory and unreviewed/);
  });

  it('never substitutes mock readiness, even with mock fallback enabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_MOCK_FALLBACK', 'true');
    try {
      readiness.mockImplementation(() =>
        Promise.reject(new ApiClientError({ message: 'timeout', status: 0, code: 'REQUEST_TIMEOUT' }))
      );
      renderWithQuery(<PredictiveLabPage />);
      expect((await screen.findByRole('alert')).textContent).toMatch(/No status is assumed/);
      expect(screen.getByTestId('prediction-readiness').textContent).not.toMatch(/Ready \(/);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('shows the trained models’ outputs on held-out NASA runs, with domain flags', async () => {
    readiness.mockResolvedValue(NOT_READY as never);
    renderWithQuery(<PredictiveLabPage />);
    const cfig = within(await screen.findByTestId('experiment-cfig_normal'));
    expect(cfig.getByText(/not forecasts for new conditions/)).toBeDefined();
    expect(cfig.getByText(/91 of 102 runs lie outside the training domain/)).toBeDefined();
    expect(cfig.getAllByTestId('held-out-run')).toHaveLength(102);
    expect(cfig.getAllByText('unsupported')).toHaveLength(18);
    const chart = cfig.getByRole('img', { name: /Observed vs model output, cfig_normal/ });
    expect(chart.querySelectorAll('circle[data-model="ridge_basic"]')).toHaveLength(84);
    expect(chart.querySelectorAll('circle[data-model="median"]')).toHaveLength(102);

    const flex = within(screen.getByTestId('experiment-flex_heptane'));
    expect(flex.getAllByTestId('held-out-run')).toHaveLength(3);
    expect(within(screen.getByTestId('experiment-saffire_ii_spread')).queryByTestId('held-out-run')).toBeNull();
    // Still no way to ask for a prediction on new inputs.
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });

  it('does not show a stale status next to a refetch error', async () => {
    readiness.mockResolvedValueOnce(NOT_READY as never).mockRejectedValueOnce(new Error('503'));
    const { queryClient } = renderWithQuery(<PredictiveLabPage />);
    await screen.findByText(/No model has been selected/);
    await queryClient.refetchQueries();
    await screen.findByRole('alert');
    expect(screen.queryByText(/No model has been selected/)).toBeNull();
    expect(screen.getByTestId('prediction-readiness').textContent).not.toMatch(/Not ready/);
  });

  it('verdicts never turn missing or ineligible evidence into a baseline win', () => {
    const base = PREDICTIVE_LAB_REPORT.experiments.find((e) => e.experiment === 'cfig_normal')!;
    expect(verdictFor(base).kind).toBe('ridge-selected');
    expect(verdictFor({ ...base, candidateAvailable: false, candidate: null }).kind).toBe('no-selection-record');
    const ineligible = {
      ...base,
      comparisons: { ...base.comparisons!, ridge_basic: { ...base.comparisons!.ridge_basic, comparisonEligible: false } },
    };
    expect(verdictFor(ineligible).kind).toBe('not-comparable');
    expect(formatUnit('mm^2/s')).toBe('mm²/s');
  });

  it('never presents MAE as a safety or risk measure', async () => {
    readiness.mockResolvedValue(NOT_READY as never);
    renderWithQuery(<PredictiveLabPage />);
    await screen.findByTestId('prediction-readiness');
    expect(screen.getByText(/not a safety or risk measure/i)).toBeDefined();
    await waitFor(() => expect(screen.queryByText(/\bsafe\b|\bunsafe\b/i)).toBeNull());
  });
});
