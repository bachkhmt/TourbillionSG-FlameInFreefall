'use client';

import React from 'react';
import {
  Database,
  ExternalLink,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
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
}

export const PsiExportTab: React.FC<PsiExportTabProps> = ({
  study,
  runs,
  observations,
  sources,
  claims,
}) => {
  const handleExportJson = () => {
    const payload = {
      investigation: study,
      runs,
      observations,
      sources,
      claims,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    triggerFileDownload(blob, `flameguard-${study.psiId.toLowerCase()}-psi-export.json`);
    toast.success(
      `Exported ${study.psiId} JSON bundle`,
      `Included ${runs.length} runs, ${observations.length} observations, and ${claims.length} claims.`
    );
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
    toast.success(
      `Exported ${rows.length} rows to CSV`,
      'Tabular study dataset ready for offline scientific analysis.'
    );
  };

  const portalUrl = sources[0]?.sourceUrl ?? 'https://psi.nasa.gov/';

  return (
    <div data-testid="psi-export-tab" className="space-y-6">
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-4">
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

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 text-zinc-800 text-xs font-bold uppercase">
            {study.context.origin} · {study.context.reviewState}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold">PSI Identifier</span>
            <div className="font-bold text-[#0B2374] mt-0.5">{study.psiId}</div>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold">Loaded Runs &amp; Observations</span>
            <div className="font-bold text-zinc-900 mt-0.5">
              {runs.length} runs · {observations.length} observations
            </div>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-semibold">Sources &amp; Claims</span>
            <div className="font-bold text-zinc-700 mt-0.5">
              {sources.length} sources · {claims.length} claims
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            data-testid="export-json-btn"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2374] hover:bg-[#081b59] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
            <span>Export Investigation (JSON)</span>
          </button>

          <button
            type="button"
            data-testid="export-csv-btn"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-zinc-800 font-bold text-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>Export Observations (CSV)</span>
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
