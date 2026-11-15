import React from 'react';
import type { ExperimentReport, HeldOutRun, ModelComparison } from '../report';
import { MIN_GROUPS_FOR_CONCLUSION, formatUnit, verdictFor } from '../report';
import { reasonText } from '../reasons';
import { HeldOutChart } from './HeldOutChart';

const pill = 'rounded-full px-2.5 py-0.5 text-[11px] font-bold';

function mae(value: number) {
  return value < 1 ? value.toFixed(3) : value.toFixed(2);
}

function value(v: number | null | undefined) {
  if (v == null) return '—';
  return Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(2);
}

function Row({ label, model, unit }: { label: string; model: ModelComparison; unit: string }) {
  return (
    <tr>
      <th scope="row" className="py-1 pr-4 text-left font-semibold">{label}</th>
      <td className="py-1 pr-4">{mae(model.rowMae)} {unit}</td>
      <td className="py-1 pr-4">{mae(model.groupMeanMae)} {unit}</td>
      <td className="py-1 pr-4">{model.rows}</td>
      <td className="py-1">{model.groups}</td>
    </tr>
  );
}

function flags(run: HeldOutRun) {
  return [
    run.outsideTrainJointDomain && 'outside training domain',
    run.outsideTrainBounds && 'outside training range',
    run.unsupportedCategory && 'unseen category',
  ]
    .filter(Boolean)
    .join(', ');
}

function HeldOut({ report, unit }: { report: ExperimentReport; unit: string }) {
  const runs = report.heldOut;
  if (!runs.length) return null;
  const outside = runs.filter((r) => r.outsideTrainJointDomain).length;
  return (
    <section aria-label={`Held-out model outputs for ${report.experiment}`} className="space-y-2">
      <h4 className="text-xs font-black uppercase tracking-wide text-slate-500">
        Model outputs on held-out NASA runs
      </h4>
      <p className="text-xs text-slate-600">
        Each run was hidden from training and predicted afterwards. These are evaluation outputs on past
        experiments, not forecasts for new conditions. {outside} of {runs.length} runs lie outside the
        training domain.
      </p>
      <HeldOutChart runs={runs} unit={unit} label={`Observed vs model output, ${report.experiment}`} />
      <details className="text-xs">
        <summary className="cursor-pointer font-bold text-[#0B2374]">Show all {runs.length} held-out runs</summary>
        <div className="mt-2 max-h-72 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500">
                <th scope="col" className="pr-3">NASA run</th>
                <th scope="col" className="pr-3">Observed</th>
                <th scope="col" className="pr-3">Median</th>
                <th scope="col" className="pr-3">Ridge</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={`${run.fold}-${run.groupId}-${run.runId}-${run.eventId}`} data-testid="held-out-run">
                  <th scope="row" className="pr-3 text-left font-mono font-normal">{run.runId}</th>
                  <td className="pr-3">{value(run.actual)}</td>
                  <td className="pr-3">{value(run.predictions.median)}</td>
                  <td className="pr-3">{run.predictions.ridge_basic == null ? 'unsupported' : value(run.predictions.ridge_basic)}</td>
                  <td className="text-slate-500">{flags(run)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function ExperimentCard({ report }: { report: ExperimentReport }) {
  const verdict = verdictFor(report);
  const c = report.comparisons;
  const unit = formatUnit(report.unit);
  const subset = c && c.ridge_basic.supportedRows < c.ridge_basic.totalRows;

  return (
    <article
      data-testid={`experiment-${report.experiment}`}
      className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3 text-sm"
    >
      <header className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <span className={`${pill} bg-amber-100 text-amber-900`}>
            {report.status === 'blocked' ? 'Blocked' : report.status}
          </span>
          <span className={`${pill} bg-slate-100 text-slate-700`}>
            {report.reviewStatus === 'unreviewed' ? 'Unreviewed' : report.reviewStatus}
          </span>
          <span className={`${pill} bg-slate-100 text-slate-700`}>
            {report.publicReadiness === 'not_ready' ? 'Not public' : report.publicReadiness}
          </span>
        </div>
        <h3 className="text-base font-black text-slate-900">
          {report.experiment} · {report.target} <span className="font-normal">({unit})</span>
        </h3>
        <p className="text-slate-600">
          Protocol <code>{report.protocol.id}</code>. {report.protocol.scope}
        </p>
      </header>

      <ul className="list-disc pl-5 text-slate-700">
        {report.reasons.map((code) => (
          <li key={code}>{reasonText(code)}</li>
        ))}
      </ul>

      {c ? (
        <>
          <table className="w-full text-xs">
            <caption className="text-left text-slate-500 pb-1">
              Held-out error in the original unit (lower is better). Groups are held out together; the notebook
              selects models on group-mean MAE.
            </caption>
            <thead>
              <tr className="text-left text-slate-500">
                <th scope="col" className="pr-4">Model</th>
                <th scope="col" className="pr-4">Row MAE</th>
                <th scope="col" className="pr-4">Group-mean MAE</th>
                <th scope="col" className="pr-4">Rows</th>
                <th scope="col">Groups</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Median baseline" model={c.median} unit={unit} />
              <Row label={`Ridge (${report.features.join(', ') || 'no features'})`} model={c.ridge_basic} unit={unit} />
            </tbody>
          </table>
          {subset && (
            <p className="text-xs text-slate-600">
              Ridge covers {c.ridge_basic.supportedRows} of {c.ridge_basic.totalRows} rows; both models are
              compared on those rows. The median baseline on all {c.median_all_rows.rows} rows has row MAE{' '}
              {mae(c.median_all_rows.rowMae)} {unit} and group-mean MAE {mae(c.median_all_rows.groupMeanMae)} {unit}.
            </p>
          )}
          <p className="text-xs font-semibold text-slate-800">
            {verdict.kind === 'insufficient' &&
              `Only ${verdict.rows} held-out rows in ${verdict.groups} groups — too few to conclude either model is better (needs at least ${MIN_GROUPS_FOR_CONCLUSION} groups).`}
            {verdict.kind === 'not-comparable' && 'The notebook marked this comparison as not eligible; no conclusion is drawn.'}
            {verdict.kind === 'no-selection-record' && 'The notebook recorded no model selection; no conclusion is drawn.'}
            {verdict.kind === 'baseline-wins' &&
              'Ridge does not beat the median baseline; the notebook selected no model.'}
            {verdict.kind === 'ridge-selected' &&
              `The notebook selected Ridge over the median baseline on group-mean MAE${
                subset ? `, compared on the ${c.ridge_basic.supportedRows} of ${c.ridge_basic.totalRows} rows Ridge covers` : ''
              }. Still exploratory and unvalidated.`}
          </p>
          <HeldOut report={report} unit={unit} />
        </>
      ) : (
        <p className="text-xs font-semibold text-slate-800">
          Not enough independent groups to evaluate; no model comparison was run.
        </p>
      )}

      <p className="text-[11px] text-slate-500 break-all">
        Run {report.runId} · sources{' '}
        {Object.entries(report.sources)
          .map(([file, sha]) => `${file} ${sha.slice(0, 12)}`)
          .join(' · ')}
      </p>
    </article>
  );
}
