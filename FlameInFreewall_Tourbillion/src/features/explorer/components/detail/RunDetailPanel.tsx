'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { MappedRun } from '@/types/api';
import { useRunConditionsQuery, useRunMeasurementsQuery } from '../../hooks/useRunQueries';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';

export interface RunDetailPanelProps {
  run: MappedRun;
  onClose: () => void;
}

/**
 * Displays live experimental conditions and measurements for a selected test run.
 */
export const RunDetailPanel: React.FC<RunDetailPanelProps> = ({ run, onClose }) => {
  const conditionsQuery = useRunConditionsQuery(run.id, { limit: 100 });
  const measurementsQuery = useRunMeasurementsQuery(run.id, { limit: 100 });

  return (
    <div
      data-testid="selected-run-inspector"
      className="p-5 rounded-3xl bg-white border border-blue-200/80 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-zinc-950">
            Run Detail: {run.externalRunKey ?? run.id}
          </h4>
          <p className="text-xs text-zinc-500">
            {run.materialType ?? 'Unmapped material'} · Gravity: {run.gravity ?? '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-gray-100 text-zinc-500 cursor-pointer"
          aria-label="Close run inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
          <div className="font-bold text-[#0B2374]">Conditions</div>
          {conditionsQuery.isLoading ? (
            <div className="text-zinc-500">Loading conditions...</div>
          ) : conditionsQuery.isError ? (
            <ApiErrorBanner error={conditionsQuery.error} onRetry={() => conditionsQuery.refetch()} />
          ) : (conditionsQuery.data?.items.length ?? 0) === 0 ? (
            <div className="text-zinc-500">No conditions recorded.</div>
          ) : (
            <ul className="space-y-1.5">
              {conditionsQuery.data?.items.map((cond) => (
                <li key={cond.id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-800">{cond.variable}</span>
                  <span className="text-zinc-600">
                    {cond.displayValue} ({cond.dataStatus})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
          <div className="font-bold text-[#0B2374]">Measurements</div>
          {measurementsQuery.isLoading ? (
            <div className="text-zinc-500">Loading measurements...</div>
          ) : measurementsQuery.isError ? (
            <ApiErrorBanner error={measurementsQuery.error} onRetry={() => measurementsQuery.refetch()} />
          ) : (measurementsQuery.data?.items.length ?? 0) === 0 ? (
            <div className="text-zinc-500">No measurements recorded.</div>
          ) : (
            <ul className="space-y-1.5">
              {measurementsQuery.data?.items.map((meas) => (
                <li key={meas.id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-800">{meas.observable}</span>
                  <span className="text-zinc-600">
                    {meas.displayValue}
                    {meas.uncertainty !== null ? ` ± ${meas.uncertainty}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
