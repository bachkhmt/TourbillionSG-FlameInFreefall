'use client';

import React from 'react';
import Link from 'next/link';
import { X, Building2, ExternalLink, Tag, AlertTriangle } from 'lucide-react';
import type { MappedComparisonStudy, MappedObservableSummary } from '@/types/api';

export interface ComparisonMatrixTableProps {
  studies: MappedComparisonStudy[];
  onRemove?: (id: string) => void;
}

function formatObservableRange(summary: MappedObservableSummary): string {
  const unitSuffix = summary.unit ? ` ${summary.unit}` : '';
  if (summary.minValue === null || summary.maxValue === null) {
    return `Non-numeric (${summary.count} obs)`;
  }
  const range =
    summary.minValue === summary.maxValue
      ? `${summary.minValue}${unitSuffix}`
      : `${summary.minValue}..${summary.maxValue}${unitSuffix}`;
  return `${range} (n=${summary.count})`;
}

export const ComparisonMatrixTable: React.FC<ComparisonMatrixTableProps> = ({
  studies,
  onRemove,
}) => {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xs">
      <div className="w-full overflow-x-auto">
        <table
          data-testid="comparison-matrix-table"
          className="w-full min-w-[680px] border-collapse text-left text-xs"
        >
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/90">
              <th className="sticky left-0 z-20 w-44 min-w-[160px] bg-gray-50/95 px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]">
                ATTRIBUTE
              </th>
              {studies.map((study) => {
                const inv = study.investigation;
                return (
                  <th
                    key={inv.id}
                    data-testid={`comparison-column-${inv.id}`}
                    className="px-4 py-3.5 min-w-[210px] align-top text-zinc-900 border-r last:border-r-0 border-gray-200/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        data-testid={`comparison-code-${inv.id}`}
                        className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-[#D4FC02] text-zinc-950 border border-lime-300"
                      >
                        {inv.psiId}
                      </span>
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
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-zinc-600 border-r border-gray-200">
                Title &amp; Origin
              </td>
              {studies.map((study) => (
                <td key={study.investigation.id} className="px-4 py-3 align-top border-r last:border-r-0 border-gray-100">
                  <div className="font-bold text-zinc-900 leading-snug">{study.investigation.title}</div>
                  <div className="text-[11px] text-zinc-500 mt-1 uppercase font-semibold">
                    {study.context.origin} · {study.context.reviewState}
                  </div>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-zinc-600 border-r border-gray-200">
                Platform
              </td>
              {studies.map((study) => (
                <td key={study.investigation.id} className="px-4 py-3 align-top border-r last:border-r-0 border-gray-100">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                    <Building2 className="w-3.5 h-3.5 text-[#0B2374] shrink-0" />
                    <span>{study.investigation.platform ?? 'Platform unmapped'}</span>
                  </div>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-zinc-600 border-r border-gray-200">
                Tags
              </td>
              {studies.map((study) => (
                <td key={study.investigation.id} className="px-4 py-3 align-top border-r last:border-r-0 border-gray-100">
                  {study.investigation.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {study.investigation.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-semibold text-zinc-700"
                        >
                          <Tag className="w-2.5 h-2.5 text-[#0B2374]" />
                          <span>{tag.label}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-400">No tags mapped</span>
                  )}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-zinc-600 border-r border-gray-200">
                Observed Materials
              </td>
              {studies.map((study) => (
                <td key={study.investigation.id} className="px-4 py-3 align-top text-zinc-800 border-r last:border-r-0 border-gray-100">
                  {study.observedMaterials.length > 0 ? study.observedMaterials.join(', ') : 'None observed'}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-zinc-600 border-r border-gray-200">
                Observed Gravities
              </td>
              {studies.map((study) => (
                <td key={study.investigation.id} className="px-4 py-3 align-top font-semibold text-zinc-800 border-r last:border-r-0 border-gray-100">
                  {study.observedGravities.length > 0 ? study.observedGravities.join(', ') : 'None observed'}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-zinc-600 border-r border-gray-200">
                Observations Total
              </td>
              {studies.map((study) => (
                <td key={study.investigation.id} className="px-4 py-3 align-top font-bold text-[#0B2374] border-r last:border-r-0 border-gray-100">
                  {study.observations.total} observations ({study.observations.items.length} loaded)
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-zinc-600 border-r border-gray-200">
                Observable Summaries
              </td>
              {studies.map((study) => (
                <td key={study.investigation.id} className="px-4 py-3 align-top border-r last:border-r-0 border-gray-100 space-y-1.5">
                  {study.observableSummaries.length > 0 ? (
                    study.observableSummaries.map((summary) => (
                      <div key={`${summary.observable}-${summary.unit}`} className="text-[11px]">
                        <span className="font-bold text-zinc-900">{summary.observable}:</span>{' '}
                        <span className="text-zinc-700">{formatObservableRange(summary)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-zinc-400">No observables summarized</span>
                  )}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-zinc-600 border-r border-gray-200">
                Unavailable Fields
              </td>
              {studies.map((study) => {
                const entries = Object.entries(study.investigation.unavailableFields);
                return (
                  <td key={study.investigation.id} className="px-4 py-3 align-top border-r last:border-r-0 border-gray-100">
                    {entries.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {entries.map(([field, reason]) => (
                          <span
                            key={field}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-800"
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>{field}: {reason}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-400">None</span>
                    )}
                  </td>
                );
              })}
            </tr>

            <tr className="bg-gray-50/30">
              <td className="sticky left-0 z-10 bg-gray-50/90 px-4 py-3 font-bold text-zinc-600 border-r border-gray-200">
                Detail View
              </td>
              {studies.map((study) => (
                <td key={study.investigation.id} className="px-4 py-3 align-top border-r last:border-r-0 border-gray-100">
                  <Link
                    href={`/explorer/${study.investigation.routeKey}`}
                    data-testid={`comparison-column-details-${study.investigation.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-xs font-semibold text-zinc-800 border border-gray-200 shadow-2xs transition-colors"
                  >
                    <span>Inspect Study</span>
                    <ExternalLink className="w-3 h-3 text-[#0B2374]" />
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
