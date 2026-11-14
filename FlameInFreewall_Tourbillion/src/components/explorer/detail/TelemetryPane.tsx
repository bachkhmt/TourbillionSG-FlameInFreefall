'use client';

import React, { useMemo, useState } from 'react';
import { Activity, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import type {
  MappedInvestigationDetail,
  MappedObservation,
  MappedRun,
} from '@/types/api';
import { useRunConditionsQuery, useRunMeasurementsQuery } from '@/hooks/api';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';

export interface TelemetryPaneProps {
  study: MappedInvestigationDetail;
  runs: MappedRun[];
  observations: MappedObservation[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export const TelemetryPane: React.FC<TelemetryPaneProps> = ({
  study,
  runs,
  observations,
  isLoading = false,
  error,
  onRetry,
}) => {
  const [selectedRunId, setSelectedRunId] = useState<string>('');

  const activeRun = useMemo(() => {
    if (runs.length === 0) return null;
    return runs.find((r) => r.id === selectedRunId) ?? runs[0];
  }, [runs, selectedRunId]);

  const activeRunId = activeRun?.id ?? null;
  const conditionsQuery = useRunConditionsQuery(activeRunId, { limit: 100 });
  const measurementsQuery = useRunMeasurementsQuery(activeRunId, { limit: 100 });

  const fallbackMeasurements = useMemo(
    () => observations.filter((obs) => obs.run.id === activeRunId).map((obs) => obs.measurement),
    [observations, activeRunId]
  );

  if (isLoading) {
    return (
      <div data-testid="telemetry-loading-shimmer" className="space-y-4">
        <div className="h-16 rounded-3xl bg-gray-200/60" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 rounded-3xl bg-gray-200/60" />
          <div className="h-44 rounded-3xl bg-gray-200/60" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ApiErrorBanner title="Unable to load run conditions & measurements" error={error} onRetry={onRetry} />
    );
  }

  if (!activeRun && observations.length === 0) {
    return (
      <div
        data-testid="telemetry-empty"
        className="p-8 text-center rounded-3xl bg-white border border-gray-100 text-xs text-zinc-500 shadow-xs"
      >
        No test runs or observations recorded for this investigation.
      </div>
    );
  }

  const conditions = conditionsQuery.data?.items ?? [];
  const measurements = measurementsQuery.data?.items ?? fallbackMeasurements;

  return (
    <div data-testid="telemetry-pane" className="space-y-6">
      {/* Header & Run Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0B2374]" />
            <span>Run Conditions &amp; Measured Observations</span>
          </h3>
          <p className="text-xs text-zinc-500">
            {study.psiId} · {observations.length} investigation observations loaded
          </p>
        </div>

        {runs.length > 0 && activeRun && (
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-2xl bg-gray-100 border border-gray-200/60 shrink-0">
            {runs.map((run) => (
              <button
                key={run.id}
                type="button"
                data-testid={`telemetry-run-btn-${run.id}`}
                onClick={() => setSelectedRunId(run.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeRun.id === run.id
                    ? 'bg-[#D4FC02] text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
                }`}
              >
                {run.externalRunKey ?? run.id.slice(0, 8)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Honest No-Synthetic-Curve Notice */}
      <div
        data-testid="telemetry-provenance-notice"
        className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900"
      >
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Displaying discrete experimental conditions and scalar measurements from the backend. Time-series waveforms are not synthesized when continuous sensor traces are unavailable.
        </p>
      </div>

      {/* Conditions & Measurements Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Conditions */}
        <div
          data-testid="run-conditions-panel"
          className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-950">Experimental Conditions</h4>
            {activeRun && (
              <span className="text-[11px] font-semibold text-zinc-500">
                {activeRun.materialType ?? 'Unmapped material'} · {activeRun.gravity ?? '—'}
              </span>
            )}
          </div>

          {conditionsQuery.isLoading ? (
            <div className="text-xs text-zinc-500 py-4">Loading conditions...</div>
          ) : conditionsQuery.isError ? (
            <ApiErrorBanner error={conditionsQuery.error} onRetry={() => conditionsQuery.refetch()} />
          ) : conditions.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4">No conditions recorded for the selected run.</p>
          ) : (
            <div className="space-y-2">
              {conditions.map((cond) => (
                <div
                  key={cond.id}
                  data-testid={`condition-item-${cond.id}`}
                  className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-zinc-900">{cond.variable}</div>
                    <div className="text-[11px] text-zinc-500">Status: {cond.dataStatus}</div>
                  </div>
                  <div className="text-right font-bold text-[#0B2374]">{cond.displayValue}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Measurements */}
        <div
          data-testid="run-measurements-panel"
          className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3"
        >
          <h4 className="text-sm font-bold text-zinc-950">Measured Observables</h4>

          {measurementsQuery.isLoading && fallbackMeasurements.length === 0 ? (
            <div className="text-xs text-zinc-500 py-4">Loading measurements...</div>
          ) : measurementsQuery.isError ? (
            <ApiErrorBanner error={measurementsQuery.error} onRetry={() => measurementsQuery.refetch()} />
          ) : measurements.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4">No measurements recorded for the selected run.</p>
          ) : (
            <div className="space-y-2">
              {measurements.map((meas) => {
                const unmappedKeys = Object.entries(meas.unavailableFields);
                return (
                  <div
                    key={meas.id}
                    data-testid={`measurement-item-${meas.id}`}
                    className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-900">{meas.observable}</span>
                      <span className="font-extrabold text-[#0B2374]">{meas.displayValue}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                      <span>
                        {meas.uncertainty !== null
                          ? `Uncertainty: ±${meas.uncertainty} ${meas.unit}`
                          : 'Uncertainty: not reported'}
                      </span>
                      {meas.rawAssetRef && (
                        <a
                          href={meas.rawAssetRef}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#0B2374] hover:underline font-semibold"
                        >
                          <span>Raw Asset</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {unmappedKeys.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {unmappedKeys.map(([field, reason]) => (
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
