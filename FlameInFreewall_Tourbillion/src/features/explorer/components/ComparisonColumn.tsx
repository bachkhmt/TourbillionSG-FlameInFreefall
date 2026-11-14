'use client';

import React from 'react';
import Link from 'next/link';
import { X, Building2, ExternalLink, Tag, Activity, AlertTriangle } from 'lucide-react';
import type { MappedComparisonStudy, MappedObservableSummary } from '@/types/api';

export interface ComparisonColumnProps {
  study: MappedComparisonStudy;
  onRemove?: (id: string) => void;
}

function formatSummaryValue(summary: MappedObservableSummary): string {
  const unitSuffix = summary.unit ? ` ${summary.unit}` : '';
  if (summary.minValue === null || summary.maxValue === null) {
    return `Non-numeric (n=${summary.count})`;
  }
  const range =
    summary.minValue === summary.maxValue
      ? `${summary.minValue}${unitSuffix}`
      : `${summary.minValue}..${summary.maxValue}${unitSuffix}`;
  return `${range} (n=${summary.count})`;
}

export const ComparisonColumn: React.FC<ComparisonColumnProps> = ({
  study,
  onRemove,
}) => {
  const inv = study.investigation;
  const unavailableEntries = Object.entries(inv.unavailableFields);

  return (
    <article
      data-testid={`comparison-column-${inv.id}`}
      className="flex flex-col justify-between rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 p-4 sm:p-5 shadow-xs transition-all"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              data-testid={`comparison-code-${inv.id}`}
              className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-[#D4FC02] text-zinc-950 border border-lime-300"
            >
              {inv.psiId}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white border border-gray-200 text-zinc-700">
              {study.context.origin}
            </span>
          </div>

          {onRemove && (
            <button
              type="button"
              data-testid={`remove-column-${inv.id}`}
              onClick={() => onRemove(inv.id)}
              className="p-1 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title={`Remove ${inv.psiId} from comparison`}
              aria-label={`Remove ${inv.psiId} from comparison`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <h3
          data-testid={`comparison-title-${inv.id}`}
          className="text-sm font-bold text-zinc-900 line-clamp-2 leading-snug"
        >
          {inv.title}
        </h3>

        <div className="space-y-2.5 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-gray-200/80 space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 flex items-center gap-1 font-semibold">
              <Building2 className="w-3 h-3 text-[#0B2374]" />
              <span>Platform</span>
            </span>
            <div className="font-semibold text-zinc-900">
              {inv.platform ?? 'Platform unmapped'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-gray-200/80 space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 flex items-center gap-1 font-semibold">
              <Tag className="w-3 h-3 text-[#0B2374]" />
              <span>Tags</span>
            </span>
            <div className="text-[11px] text-zinc-700">
              {inv.tags.length > 0 ? inv.tags.map((t) => t.label).join(', ') : 'No tags mapped'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-gray-200/80 space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-semibold">
              Observed Materials &amp; Gravities
            </span>
            <div className="font-semibold text-zinc-900">
              {study.observedMaterials.length > 0 ? study.observedMaterials.join(', ') : 'None observed'}
            </div>
            <div className="text-[11px] text-zinc-500">
              Gravity: {study.observedGravities.length > 0 ? study.observedGravities.join(', ') : 'None observed'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-gray-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-zinc-500 flex items-center gap-1 font-semibold">
                <Activity className="w-3 h-3 text-[#0B2374]" />
                <span>Observable Summaries</span>
              </span>
              <span className="text-[10px] font-bold text-[#0B2374]">
                {study.observations.total} obs
              </span>
            </div>
            {study.observableSummaries.length > 0 ? (
              <div className="space-y-1">
                {study.observableSummaries.map((summary) => (
                  <div key={`${summary.observable}-${summary.unit}`} className="text-[11px] text-zinc-800">
                    <span className="font-semibold">{summary.observable}:</span> {formatSummaryValue(summary)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400">No observables summarized</div>
            )}
          </div>

          {unavailableEntries.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {unavailableEntries.map(([field, reason]) => (
                <span
                  key={field}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-800"
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>{field}: {reason}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200 mt-3">
        <Link
          href={`/explorer/${inv.routeKey}`}
          data-testid={`comparison-column-details-${inv.id}`}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-xs font-semibold text-zinc-800 border border-gray-200 shadow-2xs transition-colors"
        >
          <span>Inspect Study</span>
          <ExternalLink className="w-3 h-3 text-[#0B2374]" />
        </Link>
      </div>
    </article>
  );
};
