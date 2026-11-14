'use client';

import React, { useMemo, useState } from 'react';
import { Search, AlertCircle, ChevronRight } from 'lucide-react';
import type { MappedInvestigationDetail, MappedRun } from '@/types/api';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { EndOfListIndicator } from '@/components/ui/EndOfListIndicator';
import { RunDetailPanel } from './RunDetailPanel';

export interface TestRunsTableProps {
  study: MappedInvestigationDetail;
  runs: MappedRun[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export const TestRunsTable: React.FC<TestRunsTableProps> = ({
  study,
  runs,
  isLoading = false,
  error,
  onRetry,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const filteredRuns = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return runs;
    return runs.filter((run) =>
      [run.id, run.externalRunKey ?? '', run.materialType ?? '', run.sampleGeometry ?? '', run.gravity ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [runs, filterQuery]);

  const stats = useMemo(() => {
    const materials = new Set(runs.map((r) => r.materialType).filter(Boolean));
    const gravities = new Set(runs.map((r) => r.gravity).filter(Boolean));
    const verifiedCount = runs.filter((r) => r.verification === 'verified').length;
    return {
      total: runs.length,
      materialsCount: materials.size,
      gravitiesLabel: gravities.size > 0 ? Array.from(gravities).join(', ') : 'Unmapped',
      verificationSummary: verifiedCount > 0 ? `${verifiedCount} Verified` : 'Not established',
    };
  }, [runs]);

  if (isLoading) {
    return (
      <div data-testid="runs-loading-shimmer" className="space-y-3">
        <div className="h-20 rounded-3xl bg-gray-200/60" />
        <div className="h-48 rounded-3xl bg-gray-200/60" />
      </div>
    );
  }

  if (error) {
    return <ApiErrorBanner title="Unable to load test runs" error={error} onRetry={onRetry} />;
  }

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? null;

  return (
    <div data-testid="test-runs-table-container" className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-3xl bg-white border border-gray-100 shadow-xs">
        <div>
          <div className="text-[10px] uppercase text-zinc-500 font-semibold">Loaded Runs</div>
          <div className="text-lg font-black text-[#0B2374] mt-0.5">
            {stats.total} / {study.runsMeta.total}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-zinc-500 font-semibold">Distinct Materials</div>
          <div className="text-lg font-black text-zinc-900 mt-0.5">{stats.materialsCount}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-zinc-500 font-semibold">Gravity Regimes</div>
          <div className="text-sm font-bold text-zinc-900 mt-1 truncate">{stats.gravitiesLabel}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-zinc-500 font-semibold">Verification</div>
          <div className="text-sm font-bold text-amber-800 mt-1">{stats.verificationSummary}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            data-testid="runs-search-input"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter by run key, material, geometry, gravity..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 focus:border-[#0B2374] focus:ring-1 focus:ring-[#0B2374] text-xs text-zinc-900 placeholder:text-zinc-400 outline-none shadow-xs"
          />
        </div>
        <div className="text-xs font-semibold text-zinc-500">
          Showing {filteredRuns.length} of {runs.length} Runs
        </div>
      </div>

      {filteredRuns.length === 0 ? (
        <div
          data-testid="no-runs-message"
          className="p-8 text-center rounded-3xl bg-white border border-gray-100 text-zinc-500 text-xs shadow-xs"
        >
          {runs.length === 0
            ? 'No test runs recorded for this investigation.'
            : 'No test runs match your search filter.'}
        </div>
      ) : (
        <div className="w-full bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]" data-testid="runs-table">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                  <th className="py-3 px-3.5">Run Key &amp; ID</th>
                  <th className="py-3 px-3.5">Material &amp; Geometry</th>
                  <th className="py-3 px-3.5">Gravity</th>
                  <th className="py-3 px-3.5">Records</th>
                  <th className="py-3 px-3.5">Verification</th>
                  <th className="py-3 px-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-zinc-700 font-medium">
                {filteredRuns.map((run) => {
                  const isSelected = selectedRunId === run.id;
                  return (
                    <tr
                      key={run.id}
                      data-testid={`run-row-${run.id}`}
                      onClick={() => setSelectedRunId(isSelected ? null : run.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-[#0B2374]">
                          {run.externalRunKey ?? run.id.slice(0, 8)}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[160px]">{run.id}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-zinc-900">
                          {run.materialType ?? 'Material unmapped'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {run.sampleGeometry ?? 'Geometry unmapped'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-zinc-800">{run.gravity ?? '—'}</td>
                      <td className="py-3 px-3.5 text-zinc-600">
                        {run.conditionsCount} cond · {run.measurementsCount} meas
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          <AlertCircle className="w-2.5 h-2.5 text-amber-700" />
                          <span>{run.verification}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          data-testid={`inspect-run-btn-${run.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRunId(isSelected ? null : run.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-zinc-800 text-[11px] font-bold cursor-pointer"
                        >
                          <span>{isSelected ? 'Hide' : 'Inspect'}</span>
                          <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRun && <RunDetailPanel run={selectedRun} onClose={() => setSelectedRunId(null)} />}

      {filteredRuns.length > 0 && <EndOfListIndicator text="End of recorded test runs" />}
    </div>
  );
};
