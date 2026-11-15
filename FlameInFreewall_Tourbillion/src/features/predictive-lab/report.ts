import rawReport from '@/data/predictiveLabReport.json';

/**
 * Snapshot of AI-team notebook evaluations (integrations/predictive_lab/report.py).
 * Exploratory and unreviewed: every entry is blocked / not_ready. Held-out evaluation outputs
 * only; nothing is predicted for new user inputs.
 */
export interface ModelComparison {
  rowMae: number;
  groupMeanMae: number;
  comparisonEligible: boolean;
  rows: number;
  groups: number;
  supportedRows: number;
  totalRows: number;
  coverageFraction: number;
}

export interface ExperimentReport {
  experiment: string;
  runId: string;
  target: string;
  unit: string;
  protocol: { id: string; scope: string };
  status: string;
  reviewStatus: string;
  publicReadiness: string;
  exploratoryResultsAvailable: boolean;
  reasons: string[];
  comparisons: Record<'median' | 'median_all_rows' | 'ridge_basic', ModelComparison> | null;
  /** Notebook's own model selection on group-mean MAE; null = nothing beat the baseline. */
  candidate: string | null;
  /** False when the notebook wrote no selection file (null candidate then means "unknown"). */
  candidateAvailable: boolean;
  features: string[];
  /** Model outputs on held-out NASA runs (evaluation, not forecasts for new conditions). */
  heldOut: HeldOutRun[];
  sources: Record<string, string>;
}

export interface HeldOutRun {
  fold: number;
  groupId: string;
  runId: string;
  eventId: string;
  actual: number;
  features: Record<string, string | number>;
  outsideTrainBounds: boolean;
  outsideTrainJointDomain: boolean;
  unsupportedCategory: boolean;
  /** null = the model does not support this run's inputs. */
  predictions: Partial<Record<'median' | 'ridge_basic', number | null>>;
}

export interface PredictiveLabReport {
  schemaVersion: number;
  sourceNote: string;
  experiments: ExperimentReport[];
}

export const PREDICTIVE_LAB_REPORT = rawReport as PredictiveLabReport;

/** Below this many held-out groups the page refuses to call either model better. */
export const MIN_GROUPS_FOR_CONCLUSION = 5;

export type Verdict =
  | { kind: 'insufficient'; groups: number; rows: number }
  | { kind: 'no-evaluation' }
  | { kind: 'no-selection-record' }
  | { kind: 'not-comparable' }
  | { kind: 'baseline-wins' }
  | { kind: 'ridge-selected' };

export function verdictFor(report: ExperimentReport): Verdict {
  const c = report.comparisons;
  if (!c) return { kind: 'no-evaluation' };
  if (!c.ridge_basic.comparisonEligible || !c.median.comparisonEligible) return { kind: 'not-comparable' };
  if (!report.candidateAvailable) return { kind: 'no-selection-record' };
  if (c.ridge_basic.groups < MIN_GROUPS_FOR_CONCLUSION) {
    return { kind: 'insufficient', groups: c.ridge_basic.groups, rows: c.ridge_basic.rows };
  }
  return report.candidate === 'ridge_basic' ? { kind: 'ridge-selected' } : { kind: 'baseline-wins' };
}

/** Display form of notebook unit strings (e.g. mm^2/s → mm²/s). */
export function formatUnit(unit: string): string {
  return unit.replace(/\^2/g, '²').replace(/\^3/g, '³');
}
