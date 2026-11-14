'use client';

import React from 'react';
import {
  Database,
  ExternalLink,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  DownloadCloud,
  Loader2,
  Info,
} from 'lucide-react';
import type {
  MappedClaim,
  MappedInvestigationDetail,
  MappedObservation,
  MappedRun,
  MappedSource,
} from '@/types/api';
import { escapeCsvCell, triggerFileDownload } from '@/lib/exportUtils';
import { toast } from '@/components/toast/toast-store';

export interface PsiExportTabProps {
  study: MappedInvestigationDetail;
  runs: MappedRun[];
  observations: MappedObservation[];
  sources: MappedSource[];
  claims: MappedClaim[];
  totalRuns?: number;
  totalObservations?: number;
  onFetchAllData?: () => Promise<void>;
  isFetchingAll?: boolean;
}

export const PsiExportTab: React.FC<PsiExportTabProps> = ({
  study,
  runs,
  observations,
  sources,
  claims,
  totalRuns,
  totalObservations,
  onFetchAllData,
  isFetchingAll = false,
}) => {
  const effectiveTotalRuns = totalRuns ?? study.runsMeta?.total ?? runs.length;
  const isRunsComplete = effectiveTotalRuns === 0 || runs.length >= effectiveTotalRuns;

  const handleExportJson = () => {
    const payload = {
      investigation: study,
      exportMetadata: {
        isComplete: isRunsComplete,
        exportedRunsCount: runs.length,
        totalAvailableRuns: effectiveTotalRuns,
        exportedObservationsCount: observations.length,
        exportedSourcesCount: sources.length,
        exportedClaimsCount: claims.length,
        exportedAt: new Date().toISOString(),
        disclaimer: isRunsComplete
          ? 'Full NASA PSI dataset bundle for this investigation.'
          : `Partial export: contains ${runs.length} of ${effectiveTotalRuns} recorded runs. Fetch full dataset before exporting for complete catalog analysis.`,
      },
      runs,
      observations,
      sources,
      claims,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    triggerFileDownload(blob, `flameguard-${study.psiId.toLowerCase()}-psi-export.json`);

    if (isRunsComplete) {
      toast.success(
        `Exported complete ${study.psiId} JSON bundle`,
        `Included all ${runs.length} runs, ${observations.length} observations, and ${claims.length} claims.`
      );
    } else {
      toast.warning(
        `Exported partial ${study.psiId} JSON bundle`,
        `Included ${runs.length} of ${effectiveTotalRuns} runs currently loaded. Use Fetch Full Dataset to export all.`
      );
    }
  };

  const handleExportCsv = () => {
    if (runs.length === 0 && observations.length === 0) {
      toast.warning('No test runs or observations available to export as CSV.');
      return;
    }

    const headers = [
      'runId',
      'externalRunKey',
      'materialType',
      'sampleGeometry',
      'gravity',
      'verification',
      'observable',
      'measuredValue',
      'unit',
      'uncertainty',
    ];

    const rows =
      observations.length > 0
        ? observations.map((obs) => [
            obs.run.id,
            obs.run.externalRunKey,
            obs.run.materialType,
            obs.run.sampleGeometry,
            obs.run.gravity,
            obs.run.verification,
            obs.measurement.observable,
            obs.measurement.rawMeasuredValue,
            obs.measurement.unit,
            obs.measurement.rawUncertainty,
          ])
        : runs.map((run) => [
            run.id,
            run.externalRunKey,
            run.materialType,
            run.sampleGeometry,
            run.gravity,
            run.verification,
            '',
            '',
            '',
            '',
          ]);

    const csv = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `flameguard-${study.psiId.toLowerCase()}-observations.csv`);

    if (isRunsComplete) {
      toast.success(
        `Exported complete ${rows.length} rows to CSV`,
        'Full tabular study dataset ready for scientific analysis.'
      );
    } else {
      toast.warning(
        `Exported partial ${rows.length} rows to CSV`,
        `Contains ${runs.length} of ${effectiveTotalRuns} runs. Fetch complete dataset to export all.`
      );
    }
  };

  const portalUrl = sources[0]?.sourceUrl ?? 'https://psi.nasa.gov/';

  return (
    <div data-testid="psi-export-tab" className="space-y-6">
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-5">
        {/* Header Title & Completeness Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0B2374]" />
              <span>NASA PSI Investigation Data Export</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Download mapped runs, scalar observations, sources, and claims with full context provenance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isRunsComplete ? (
              <span
                data-testid="dataset-completeness-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-50 border border-lime-300 text-lime-950 text-[11px] font-extrabold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-700" />
                <span>Complete Dataset ({runs.length} runs)</span>
              </span>
            ) : (
              <span
                data-testid="dataset-completeness-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-extrabold"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Partial Dataset ({runs.length} / {effectiveTotalRuns} runs loaded)</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 border border-gray-200 text-zinc-800 text-[11px] font-bold uppercase">
              {study.context.origin} · {study.context.reviewState}
            </span>
          </div>
        </div>

        {/* Loaded Counts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold">PSI Identifier</span>
            <div className="font-bold text-[#0B2374] mt-0.5">{study.psiId}</div>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold">Loaded Runs &amp; Observations</span>
            <div className="font-bold text-zinc-900 mt-0.5">
              {runs.length} {runs.length === 1 ? 'run' : 'runs'}
              {effectiveTotalRuns > runs.length && ` (of ${effectiveTotalRuns})`} · {observations.length} obs
            </div>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold">Sources &amp; Claims</span>
            <div className="font-bold text-zinc-700 mt-0.5">
              {sources.length} sources · {claims.length} claims
            </div>
          </div>
        </div>

        {/* Partial Dataset Action Banner */}
        {!isRunsComplete && (
          <div
            data-testid="partial-export-warning"
            className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950"
          >
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Partial Export Notice</div>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Exporting now will only include the <strong>{runs.length}</strong> runs and <strong>{observations.length}</strong> observations currently loaded in memory.
                  To ensure complete scientific integrity, fetch all {effectiveTotalRuns} records from NASA PSI before exporting.
                </p>
              </div>
            </div>
            {onFetchAllData && (
              <button
                type="button"
                data-testid="fetch-all-export-btn"
                onClick={onFetchAllData}
                disabled={isFetchingAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
              >
                {isFetchingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <DownloadCloud className="w-3.5 h-3.5" />
                )}
                <span>Fetch Full Investigation ({effectiveTotalRuns} runs)</span>
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            data-testid="export-json-btn"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2374] hover:bg-[#081b59] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
            <span>
              {isRunsComplete ? 'Export Investigation (JSON)' : `Export Loaded Subset (${runs.length} runs, JSON)`}
            </span>
          </button>

          <button
            type="button"
            data-testid="export-csv-btn"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-zinc-800 font-bold text-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>
              {isRunsComplete ? 'Export Observations (CSV)' : `Export Loaded Observations (CSV)`}
            </span>
          </button>

          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="psi-portal-button"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-zinc-700 hover:text-zinc-950 text-xs transition-colors font-medium ml-auto"
          >
            <span>Open PSI Source</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#0B2374]" />
          </a>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          {study.context.caveats.length > 0
            ? study.context.caveats.join(' · ')
            : `Collection ${study.context.collectionId} (${study.context.origin} · ${study.context.reviewState}). Verify raw NASA PSI artifacts before citing.`}
        </p>
      </div>
    </div>
  );
};
