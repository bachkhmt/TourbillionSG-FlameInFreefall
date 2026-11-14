/** Public read projection. Missing measurements remain null across the API boundary. */
export type Pillar = "prevention" | "detection" | "suppression";
export type MissionContext =
  | "custom"
  | "iss"
  | "spacecraft"
  | "lunar"
  | "mars"
  | "rover";
export interface CitedText {
  text: string;
  sourceId: string;
  locator: string;
}
export interface Resource {
  id: string;
  title: string;
  url: string;
  kind: string;
  role: string;
  status: string;
  license?: string | null;
  sourceId?: string | null;
  investigationIds?: string[];
}
export interface Source {
  id: string;
  investigationId: string;
  filename: string;
  sha256: string;
  fileVersion: number;
  studyVersion: number;
  sourceUrl: string;
  license: string;
  kind: string;
  byteCount: number;
  status: string;
  doi?: string | null;
  contentType?: string;
}
export interface Study {
  id: string;
  uuid: string;
  psiId: string;
  code: string;
  title: string;
  platform: string;
  hardware: string;
  researchArea: string;
  sourceUrl: string;
  metadataSourceId: string;
  version: number;
  license: string;
  doi: string | null;
  fuelType: string | null;
  runCount: number;
  coverage: string;
  pillars?: Pillar[];
  summary?: CitedText[];
  objectives?: CitedText[];
  sampleGeometry?: string | null;
  sensors?: string[];
  sensorEvidence?: CitedText[];
  geometryEvidence?: CitedText[];
  limitations?: string[];
  evidenceCoverage?: {
    metadata: boolean;
    documents: number;
    records: number;
    reviewed: number;
  } | null;
  classification?: {
    basis: string;
    policyVersion: string;
    evidence: CitedText[];
  } | null;
}
export interface Observation {
  name: string;
  raw: string;
  value: number | null;
  unit: string | null;
  originalUnit: string;
  sourceId: string;
  locator: string;
  status: string;
}
export interface Run {
  id: string;
  investigationId: string;
  externalRunKey: string;
  sourceId: string;
  rowNumber: number;
  raw: Record<string, string>;
  observations: Observation[];
  issues: string[];
  status: string;
  recordKind?: string;
  sampleGeometry?: string | null;
  conditions: {
    oxygenPct: number | null;
    oxygenBasis: string | null;
    pressurePsi: number | null;
    airflowCmS: number | null;
    gravityG: number | null;
    gravityRegime: string;
    material: string;
    pressureConversion: string | null;
    oxygenContext?: string | null;
    flowContext?: string | null;
    flameConfiguration?: string | null;
  };
}
export interface Telemetry {
  sourceId: string;
  channel: string;
  unit: string;
  timeUnit: string;
  timeReference: string;
  points: { timeSec: number | null; value: number | null }[];
  label?: string;
  description?: string;
}
export interface Scenario {
  oxygenPct: number;
  oxygenBasis: "volume_percent" | "mole_percent";
  pressurePsi: number;
  gravityG: number;
  airflowCmS: number;
  material: string;
  pillar?: Pillar | "all";
  missionContext?: MissionContext;
}
export interface Workspace {
  revision: string;
  parserVersion: string;
  investigations: Study[];
  runs: Run[];
  sources: Source[];
  telemetry: Record<string, Telemetry>;
  telemetryChannels?: Record<string, Telemetry[]>;
  resources?: Resource[];
  limitations: string[];
  stats: {
    investigations: number;
    runs: number;
    sources: number;
    chunks: number;
    independentlyReviewedRuns: number;
    telemetrySeries: number;
  };
  presets: (Scenario & { id: string; name: string; status: string })[];
}
export interface AnswerChunk {
  id: string;
  sourceId: string;
  investigationId: string;
  text: string;
  heading: string;
  locator: string;
  filename: string;
  sha256: string;
  sourceUrl: string;
  fileVersion: number;
  studyVersion: number;
  status: string;
}
export interface Answer {
  answer: {
    segments: { text: string; citations: string[]; system?: boolean }[];
    coverage: string;
    missing: string[];
  };
  chunks: AnswerChunk[];
  meta: {
    mode: string;
    reason: string | null;
    corpusRevision: string;
    latencyMs: number;
  };
}
export interface Candidate {
  runId: string;
  investigationId: string;
  externalRunKey: string;
  status: string;
  score: number;
  dimensions: {
    dimension: string;
    status: string;
    observed: string | number | null;
    target: string | number;
    unit?: string;
    tolerance?: number;
    basis?: string | null;
  }[];
  issues: string[];
}
export interface Analysis {
  revision: string;
  exactMatchCount: number;
  engineVersion: string;
  notice: string;
  candidates: Candidate[];
  investigations: Candidate[];
  prediction: { available: boolean; reason: string };
  researchEngineVersion?: string;
  scoring?: string | Record<string, unknown>;
  studyRankings?: {
    investigationId: string;
    pillars: Pillar[];
    relevanceScore: number;
    reasons: CitedText[];
    evidenceLevel: string;
    coverage: {
      matched: number;
      unknown: number;
      mismatched: number;
      runId: string | null;
      sourceId: string | null;
      locator: string | null;
    };
  }[];
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(20000),
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    if (response.status === 409) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(
        typeof detail.detail === "string"
          ? detail.detail
          : "Dataset revision unavailable. Reload the latest release.",
      );
    }
    throw new Error(
      response.status === 503
        ? "Dataset unavailable. Start the backend and import the pilot."
        : `Request failed (${response.status}). Please retry.`,
    );
  }
  return response.json() as Promise<T>;
}

export function sourceUrl(
  sourceId: string,
  revision: string,
  original = false,
) {
  return `/api/v1/sources/${encodeURIComponent(sourceId)}${original ? "/original" : ""}?revision=${encodeURIComponent(revision)}`;
}

export function exportUrl(ids: string[], revision: string, format: string) {
  return `/api/v1/export?ids=${encodeURIComponent(ids.join(","))}&revision=${encodeURIComponent(revision)}&format=${format}`;
}

export function numeric(value: number | null | undefined, digits = 2): string {
  return value == null
    ? "Unknown"
    : value.toLocaleString("en-US", { maximumFractionDigits: digits });
}
