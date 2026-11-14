'use client';

import React from 'react';
import { Sparkles, Layers, Activity, FlaskConical, AlertTriangle } from 'lucide-react';
import type { MappedComparisonResult } from '@/types/api';

export interface ParameterDeltaSummaryProps {
  comparison: MappedComparisonResult;
}

export const ParameterDeltaSummary: React.FC<ParameterDeltaSummaryProps> = ({
  comparison,
}) => {
  const uniqueMaterials = Array.from(
    new Set(comparison.studies.flatMap((study) => study.observedMaterials))
  );
  const uniqueGravities = Array.from(
    new Set(comparison.studies.flatMap((study) => study.observedGravities))
  );
  const uniqueObservables = Array.from(
    new Set(
      comparison.studies.flatMap((study) =>
        study.observableSummaries.map((item) => item.observable)
      )
    )
  );
  const totalObservations = comparison.studies.reduce(
    (sum, study) => sum + study.observations.total,
    0
  );
  const unavailableEntries = Object.entries(comparison.unavailableFields);

  return (
    <div
      data-testid="parameter-delta-summary"
      className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#0B2374] font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#0B2374]" />
          <span>Observed Cross-Study Scope</span>
        </span>
        <span
          data-testid="comparison-comparability-badge"
          className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] normal-case font-bold"
        >
          Comparability: {comparison.comparability}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div
          data-testid="summary-studies-count"
          className="p-3 rounded-2xl bg-gray-100 border border-gray-200 text-zinc-800 space-y-1"
        >
          <div className="text-[10px] uppercase text-zinc-500 flex items-center gap-1 font-semibold">
            <Layers className="w-3 h-3 text-[#0B2374]" />
            <span>Studies Compared</span>
          </div>
          <div className="font-bold text-zinc-950">{comparison.studies.length} Investigations</div>
          <div className="text-[10px] text-zinc-600">{totalObservations} total observations</div>
        </div>

        <div
          data-testid="summary-materials-count"
          className="p-3 rounded-2xl bg-gray-100 border border-gray-200 text-zinc-800 space-y-1"
        >
          <div className="text-[10px] uppercase text-zinc-500 flex items-center gap-1 font-semibold">
            <FlaskConical className="w-3 h-3 text-amber-600" />
            <span>Observed Materials</span>
          </div>
          <div className="font-bold text-zinc-950">{uniqueMaterials.length} Distinct</div>
          <div className="text-[10px] text-zinc-500 truncate">
            {uniqueMaterials.length > 0 ? uniqueMaterials.join(', ') : 'None observed'}
          </div>
        </div>

        <div
          data-testid="summary-gravities-count"
          className="p-3 rounded-2xl bg-gray-100 border border-gray-200 text-zinc-800 space-y-1"
        >
          <div className="text-[10px] uppercase text-zinc-500 flex items-center gap-1 font-semibold">
            <Activity className="w-3 h-3 text-[#0B2374]" />
            <span>Gravity Regimes</span>
          </div>
          <div className="font-bold text-zinc-950">{uniqueGravities.length} Observed</div>
          <div className="text-[10px] text-zinc-500 truncate">
            {uniqueGravities.length > 0 ? uniqueGravities.join(', ') : 'None observed'}
          </div>
        </div>

        <div
          data-testid="summary-observables-count"
          className="p-3 rounded-2xl bg-gray-100 border border-gray-200 text-zinc-800 space-y-1"
        >
          <div className="text-[10px] uppercase text-zinc-500 flex items-center gap-1 font-semibold">
            <Activity className="w-3 h-3 text-[#0B2374]" />
            <span>Observables</span>
          </div>
          <div className="font-bold text-zinc-950">{uniqueObservables.length} Distinct</div>
          <div className="text-[10px] text-zinc-500 truncate">
            {uniqueObservables.length > 0 ? uniqueObservables.join(', ') : 'None recorded'}
          </div>
        </div>
      </div>

      {/* Honest Comparability & Withheld Deltas/Highlights Notice */}
      <div
        data-testid="comparability-notice"
        className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-1.5"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Cross-study comparability is <span className="underline">{comparison.comparability}</span>
              {comparison.deltas === null && comparison.highlights === null
                ? ' — automated parameter deltas and comparative highlights are withheld.'
                : '.'}
            </p>
            {unavailableEntries.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {unavailableEntries.map(([field, reason]) => (
                  <span
                    key={field}
                    className="px-2 py-0.5 rounded-full bg-white border border-amber-200 text-[10px] font-bold text-amber-900"
                  >
                    {field}: {reason}
                  </span>
                ))}
              </div>
            )}
            {comparison.context.caveats.length > 0 && (
              <p className="text-[11px] text-amber-800">
                {comparison.context.caveats.join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
