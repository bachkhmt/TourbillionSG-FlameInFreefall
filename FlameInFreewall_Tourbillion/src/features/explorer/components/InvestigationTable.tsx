'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Tag } from 'lucide-react';
import type { MappedInvestigation } from '@/types/api';

export interface InvestigationTableProps {
  investigations: MappedInvestigation[];
  compareList: string[];
  onToggleCompare: (id: string) => void;
}

export const InvestigationTable: React.FC<InvestigationTableProps> = ({
  investigations,
  compareList,
  onToggleCompare,
}) => {
  return (
    <div
      data-testid="investigations-table"
      className="w-full bg-white rounded-3xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/90 text-[11px] uppercase tracking-wider text-zinc-600 font-bold">
              <th className="py-3.5 px-4 w-14 text-center">Compare</th>
              <th className="py-3.5 px-4 min-w-[260px]">PSI ID &amp; Study Title</th>
              <th className="py-3.5 px-4 min-w-[140px]">Platform</th>
              <th className="py-3.5 px-4 min-w-[180px]">Tags</th>
              <th className="py-3.5 px-4 min-w-[150px]">Provenance</th>
              <th className="py-3.5 px-4 w-28 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-zinc-800">
            {investigations.map((study) => {
              const isComparing = compareList.includes(study.id);
              const visibleTags = study.tags.slice(0, 3);
              const unavailableKeys = Object.keys(study.unavailableFields);

              return (
                <tr
                  key={study.id}
                  data-testid={`investigation-row-${study.id}`}
                  className={`border-b border-gray-100 hover:bg-gray-50/70 text-zinc-800 transition-colors group ${
                    isComparing ? 'bg-lime-50/40' : ''
                  }`}
                >
                  {/* Compare Checkbox */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      data-testid={`table-compare-btn-${study.id}`}
                      onClick={() => onToggleCompare(study.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 cursor-pointer ${
                        isComparing
                          ? 'bg-[#D4FC02] border-[#D4FC02] text-zinc-950 font-bold shadow-2xs'
                          : 'border-gray-300 hover:border-gray-400 bg-white text-transparent'
                      }`}
                      title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                    >
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${isComparing ? 'opacity-100' : 'opacity-0'}`}
                      />
                    </button>
                  </td>

                  {/* PSI ID, Title & Purpose */}
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/explorer/${study.routeKey}`}
                      className="group/link block space-y-0.5"
                    >
                      <div className="font-bold text-xs text-[#0B2374] group-hover/link:underline">
                        {study.psiId}
                      </div>
                      <div className="font-semibold text-zinc-900 group-hover/link:text-[#0B2374] transition-colors line-clamp-1">
                        {study.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 line-clamp-1">
                        {study.researchPurpose ?? 'No research purpose recorded'}
                      </div>
                    </Link>
                  </td>

                  {/* Platform */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-zinc-800 border border-gray-200">
                      {study.platform ?? 'Platform unmapped'}
                    </span>
                  </td>

                  {/* Tags */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-1">
                      {visibleTags.length > 0 ? (
                        visibleTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#0B2374] text-[10px] font-semibold"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-zinc-400">No tags</span>
                      )}
                    </div>
                  </td>

                  {/* Provenance & Unavailable */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-lime-50 text-lime-900 border border-lime-300">
                        {study.context.origin} · {study.context.reviewState}
                      </span>
                      {unavailableKeys.length > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {unavailableKeys.length} unavailable
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/explorer/${study.routeKey}`}
                      data-testid={`table-inspect-${study.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#0B2374] hover:bg-blue-50 transition-colors"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
