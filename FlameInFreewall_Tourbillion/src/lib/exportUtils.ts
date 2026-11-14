import type { MappedComparisonResult } from '@/types/api';

/** Escapes a single cell value according to RFC-4180 CSV rules. */
export function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  return `"${String(val).replace(/"/g, '""')}"`;
}

/** Triggers a browser download for a generated Blob and revokes the object URL. */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Serializes a `MappedComparisonResult` into an RFC-4180 CSV string. */
export function buildComparisonCsv(comparison: MappedComparisonResult): string {
  const studies = comparison.studies;
  const headers = ['Attribute', ...studies.map((s) => s.investigation.psiId)];
  const rows: Array<[string, ...(string | number)[]]> = [
    ['PSI ID', ...studies.map((s) => s.investigation.psiId)],
    ['Title', ...studies.map((s) => s.investigation.title)],
    ['Platform', ...studies.map((s) => s.investigation.platform ?? 'Platform unmapped')],
    ['Tags', ...studies.map((s) => s.investigation.tags.map((t) => t.label).join('; ') || 'None')],
    ['Observations Total', ...studies.map((s) => s.observations.total)],
    ['Observed Materials', ...studies.map((s) => s.observedMaterials.join('; ') || 'None')],
    ['Observed Gravities', ...studies.map((s) => s.observedGravities.join('; ') || 'None')],
    [
      'Observable Summaries',
      ...studies.map((s) =>
        s.observableSummaries
          .map(
            (o) =>
              `${o.observable} (${o.unit}): ${o.minValue ?? 'n/a'}..${o.maxValue ?? 'n/a'} (n=${o.count})`
          )
          .join('; ') || 'None'
      ),
    ],
    ['Comparability', ...studies.map(() => comparison.comparability)],
  ];
  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');
}
