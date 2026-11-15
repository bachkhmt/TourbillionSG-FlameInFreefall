import React from 'react';
import type { HeldOutRun } from '../report';

const SIZE = 240;
const PAD = 34;

/** Observed (x) vs model output (y) on held-out runs; the diagonal is a perfect prediction. */
export function HeldOutChart({ runs, unit, label }: { runs: HeldOutRun[]; unit: string; label: string }) {
  const points = runs.flatMap((run) =>
    (['median', 'ridge_basic'] as const).flatMap((model) => {
      const value = run.predictions[model];
      return value == null ? [] : [{ model, x: run.actual, y: value, run }];
    })
  );
  if (!points.length) return null;
  const values = points.flatMap((p) => [p.x, p.y]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const scale = (v: number) => PAD + ((v - lo) / span) * (SIZE - 2 * PAD);
  // Axis precision follows the value span (0–304 s → "0", 0.2–0.5 mm²/s → "0.20").
  const fmt = (v: number) => v.toFixed(span >= 10 ? 0 : span >= 1 ? 1 : 2);

  return (
    <figure className="space-y-1">
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[280px] rounded-xl border border-slate-200 bg-slate-50"
      >
        <line x1={PAD} y1={SIZE - PAD} x2={SIZE - PAD} y2={PAD} stroke="#94a3b8" strokeDasharray="4 3" />
        <line x1={PAD} y1={SIZE - PAD} x2={SIZE - PAD} y2={SIZE - PAD} stroke="#cbd5e1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={SIZE - PAD} stroke="#cbd5e1" />
        <text x={PAD} y={SIZE - 8} fontSize="9" fill="#64748b">{fmt(lo)}</text>
        <text x={SIZE - PAD} y={SIZE - 8} fontSize="9" fill="#64748b" textAnchor="end">{fmt(hi)}</text>
        <text x={SIZE / 2} y={SIZE - 8} fontSize="9" fill="#475569" textAnchor="middle">observed ({unit})</text>
        <text x={10} y={SIZE / 2} fontSize="9" fill="#475569" textAnchor="middle" transform={`rotate(-90 10 ${SIZE / 2})`}>
          model output ({unit})
        </text>
        {points.map((p, i) => (
          <circle
            key={i}
            data-model={p.model}
            cx={scale(p.x)}
            cy={SIZE - scale(p.y)}
            r={3}
            fill={p.model === 'ridge_basic' ? '#0B2374' : 'none'}
            stroke={p.model === 'ridge_basic' ? '#0B2374' : '#d97706'}
            fillOpacity={p.run.outsideTrainJointDomain ? 0.35 : 0.9}
          >
            <title>{`${p.run.runId} · ${p.model === 'ridge_basic' ? 'Ridge' : 'Median'}: ${p.y} vs observed ${p.x} ${unit}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="text-[11px] text-slate-500">
        Filled navy = Ridge, amber ring = median baseline, faded = outside the training domain. Dashed line = perfect
        prediction.
      </figcaption>
    </figure>
  );
}
