/** Small synthetic API fixtures for UI behavior, not scientific evidence. */
import type { Answer, Scenario, Study, Workspace } from "@/lib/workspace-api";

const study = (
  id: string,
  code: string,
  psiId: string,
  runCount = 1,
): Study => ({
  id,
  uuid: `fixture-${id}`,
  code,
  psiId,
  title: `${code} fixture study`,
  platform: "Fixture platform",
  hardware: "Fixture hardware",
  researchArea: "Combustion",
  sourceUrl: "https://example.invalid",
  metadataSourceId: "source-table",
  version: 1,
  license: "CC0-1.0",
  doi: null,
  fuelType: id === "flex" ? "droplet" : "solid",
  runCount,
  coverage: runCount ? "run_level_pilot" : "metadata_only",
});
export const scenario: Scenario = {
  oxygenPct: 21,
  oxygenBasis: "volume_percent",
  pressurePsi: 14.7,
  gravityG: 0,
  airflowCmS: 5,
  material: "PMMA",
};
export const liveWorkspace: Workspace = {
  revision: "fixture-release-1",
  parserVersion: "fixture-parser",
  investigations: [
    study("flex", "FLEX", "PSI-69"),
    study("bass-ii", "BASS-II", "PSI-25"),
    study("cfi-g", "CFI-G", "PSI-159"),
    study("flex-2", "FLEX-2", "PSI-68", 0),
  ],
  runs: ["flex", "bass-ii", "cfi-g"].map((id, i) => ({
    id: `run-${id}`,
    investigationId: id,
    externalRunKey: i === 0 ? "FLEX-007" : `${id}-1`,
    sourceId: "source-table",
    rowNumber: 8,
    raw: { "Original diameter; mm": "1.87", Flow: "" },
    observations: [
      {
        name: "initial_droplet_diameter",
        raw: "1.87",
        value: 1.87,
        unit: "mm",
        originalUnit: "mm",
        sourceId: "source-table",
        locator: "CSV row 8",
        status: "source_checked",
      },
      {
        name: "initial_droplet_diameter",
        raw: "1.82",
        value: 1.82,
        unit: "mm",
        originalUnit: "mm",
        sourceId: "source-sheet",
        locator: "TEST CONDITIONS / D0",
        status: "source_checked",
      },
    ],
    issues: ["Source conflict: D0 differs across files; no value selected."],
    status: "source_checked",
    conditions: {
      oxygenPct: 21,
      oxygenBasis: "mole_percent",
      pressurePsi: i === 1 ? null : 14.7,
      airflowCmS: null,
      gravityG: null,
      gravityRegime: "microgravity",
      material: i === 0 ? "Heptane" : "PMMA",
      pressureConversion: null,
    },
  })),
  sources: [
    {
      id: "source-table",
      investigationId: "flex",
      filename: "fixture-table.csv",
      sha256: "a".repeat(64),
      fileVersion: 1,
      studyVersion: 5,
      sourceUrl: "https://example.invalid/table",
      license: "CC0-1.0",
      kind: "experimental_table",
      byteCount: 100,
      status: "source_checked",
    },
    {
      id: "source-sheet",
      investigationId: "flex",
      filename: "fixture-TestSheet.txt",
      sha256: "b".repeat(64),
      fileVersion: 2,
      studyVersion: 5,
      sourceUrl: "https://example.invalid/sheet",
      license: "CC0-1.0",
      kind: "raw_text_sample",
      byteCount: 100,
      status: "source_checked",
    },
  ],
  telemetry: {
    "run-flex": {
      sourceId: "source-table",
      channel: "droplet_diameter",
      unit: "mm",
      timeUnit: "s",
      timeReference: "Original offset",
      points: [
        { timeSec: -1, value: 1.87 },
        { timeSec: 1, value: 1.2 },
      ],
    },
  },
  limitations: ["Synthetic fixture; not scientific validation"],
  stats: {
    investigations: 4,
    runs: 3,
    sources: 2,
    chunks: 2,
    independentlyReviewedRuns: 0,
    telemetrySeries: 1,
  },
  presets: [
    {
      ...scenario,
      id: "iss",
      name: "ISS illustrative scenario",
      status: "illustrative_scenario",
    },
    {
      ...scenario,
      id: "lunar",
      name: "Lunar illustrative scenario",
      gravityG: 0.16,
      status: "illustrative_scenario",
    },
  ],
};
export const liveAnswer: Answer = {
  answer: {
    segments: [
      {
        text: "FLEX-007 D0 source conflict: CSV 1.87 mm; TestSheet 1.82 mm.",
        citations: ["chunk-sheet"],
      },
    ],
    coverage: "partial",
    missing: ["validation"],
  },
  chunks: [
    {
      id: "chunk-sheet",
      sourceId: "source-sheet",
      investigationId: "flex",
      text: "1.82 mm",
      heading: "FLEX-007",
      locator: "TEST CONDITIONS / D0",
      filename: "fixture-TestSheet.txt",
      sha256: "b".repeat(64),
      sourceUrl: "https://example.invalid",
      fileVersion: 2,
      studyVersion: 5,
      status: "source_checked",
    },
  ],
  meta: {
    mode: "retrieval_only",
    reason: null,
    corpusRevision: liveWorkspace.revision,
    latencyMs: 1,
  },
};

export async function fixtureFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const url = String(input);
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  let result: unknown;
  if (url.includes("/workspace")) result = structuredClone(liveWorkspace);
  else if (url.includes("/ask")) result = structuredClone(liveAnswer);
  else if (url.includes("/sources/"))
    result = { source: liveWorkspace.sources[1], text: "D0 (mm) = 1.82" };
  else if (url.includes("/compare"))
    result = {
      investigations: liveWorkspace.investigations.filter((s) =>
        body.investigationIds.includes(s.id),
      ),
      notice: "Metadata comparison; incompatible outcomes are not averaged.",
    };
  else if (url.includes("/evidence-map")) result = { points: [] };
  else if (url.includes("/scenarios/analyze"))
    result = {
      revision: liveWorkspace.revision,
      exactMatchCount: 0,
      engineVersion: "fixture-match-v1",
      notice: "Unknown conditions are not matches.",
      candidates: [],
      investigations: [],
      prediction: { available: false, reason: "No validated model" },
    };
  else throw new Error(`Unexpected test API request: ${url}`);
  return { ok: true, status: 200, json: async () => result } as Response;
}
