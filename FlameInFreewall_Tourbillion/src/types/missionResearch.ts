type Pillar = "prevention" | "detection" | "suppression";
interface Source { id: string; filename: string; sourceUrl: string; sha256: string; studyVersion: number; fileVersion: number; }
interface Observation { name: string; raw: string; value: number | null; unit: string | null; originalUnit: string; status: string; }
export interface BriefCitation {
  id: string;
  source: Source;
  locator: string;
}
export interface BriefRow {
  investigationId: string;
  code: string;
  title: string;
  purpose: Pillar;
  selectionReason: string;
  passages: {
    text: string;
    citationId: string;
    kind: "purpose" | "context" | "objective";
  }[];
  availability: {
    records: number;
    documents: number;
    excludedRecords: number;
    independentlyReviewedRecords: number | null;
  };
  conditionStatus: "not_requested" | "no_records" | "partial" | "exact";
  dimensions: {
    dimension: string;
    status: "match" | "related" | "mismatch" | "unknown";
    target: number | string;
    observed: number | string | null;
    unit: string | null;
    basis: string | null;
    tolerance: number | null;
    reason: string;
    citationId: string | null;
  }[];
  record: {
    id: string;
    externalRunKey: string;
    citationId: string;
    recordKind: string;
    observations: (Observation & { citationId: string })[];
    issues: string[];
  } | null;
  limitations: string[];
}
export type BriefScenario = { oxygenPct: number; oxygenBasis: string; pressurePsi: number; gravityG: number; airflowCmS: number; material: string };
export interface ResearchBrief {
  revision: string;
  engineVersion: string;
  workflowId: Pillar;
  question: string;
  scenario: BriefScenario | null;
  method: string[];
  rows: BriefRow[];
  citations: BriefCitation[];
  limitations: string[];
  nextSteps: string[];
}

