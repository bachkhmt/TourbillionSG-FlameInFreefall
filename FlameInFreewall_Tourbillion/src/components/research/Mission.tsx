"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  api,
  numeric,
  type Analysis,
  type Scenario,
  type MissionContext,
  type Pillar,
} from "@/lib/workspace-api";
import { useDataset, useDatasetStore } from "@/store/useDatasetStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  DatasetGate,
  ResearchHeader,
  SourceLink,
  button,
  field,
  panel,
} from "./Shared";
import { CitedPassages, PILLARS, PillarBadges } from "./Evidence";

const MISSION_CONTEXTS: MissionContext[] = [
  "custom",
  "iss",
  "spacecraft",
  "lunar",
  "mars",
  "rover",
];
const MAP_COLORS = [
  "#0B2374",
  "#0891b2",
  "#7c3aed",
  "#b45309",
  "#be185d",
  "#047857",
  "#475569",
  "#c2410c",
];
function studyColor(id: string) {
  return MAP_COLORS[
    Array.from(id).reduce(
      (hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
      0,
    ) % MAP_COLORS.length
  ];
}

function ModelReadiness({ revision }: { revision: string }) {
  const [readiness, setReadiness] = useState<{
    available: boolean;
    reason: string;
    requirements: { id: string; label: string; ready: boolean }[];
    notice: string;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setReadiness(null);
    setError("");
    void api<NonNullable<typeof readiness>>(
      `/model-readiness?revision=${encodeURIComponent(revision)}`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!controller.signal.aborted) setReadiness(response);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      });
    return () => controller.abort();
  }, [revision]);
  return (
    <section className={`${panel} space-y-4`}>
      <h2 className="text-lg font-bold">Prediction offline</h2>
      <p className="text-sm leading-7 text-slate-500">
        {readiness?.reason ||
          "No validated model artifact, applicability domain or measured uncertainty is installed. Numerical predictions require independent validation."}
      </p>
      {readiness ? (
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-500">
          {readiness.requirements.map((requirement) => (
            <li key={requirement.id}>
              {requirement.label}:{" "}
              {requirement.ready ? "available" : "unavailable"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">
          {error
            ? "Detailed readiness could not be loaded. Prediction remains unavailable."
            : "Loading model prerequisites…"}
        </p>
      )}
      {readiness?.notice && (
        <p className="text-xs leading-6 text-slate-500">{readiness.notice}</p>
      )}
    </section>
  );
}

interface MapPoint {
  runId: string;
  investigationId: string;
  label: string;
  oxygenPct: number;
  pressurePsi: number;
  sourceId: string;
  rowNumber: number;
}

function EvidenceMap() {
  const { data } = useDataset();
  const [basis, setBasis] = useState("mole_percent");
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!data) return;
    const controller = new AbortController();
    setError("");
    setLoading(true);
    setSelected(null);
    setPoints([]);
    void api<{ points: MapPoint[] }>(
      `/evidence-map?revision=${data.revision}&basis=${basis}`,
      { signal: controller.signal },
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setPoints(result.points);
        setLoading(false);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [data, basis]);
  const maxPressure = points.reduce(
    (max, point) => Math.max(max, point.pressurePsi),
    25,
  );
  const studyIds = [
    ...new Set(points.map((point) => point.investigationId)),
  ].sort();
  return (
    <section className={`${panel} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Observed evidence map</h2>
        <select
          className={`${field} !w-auto`}
          aria-label="Map oxygen basis"
          value={basis}
          onChange={(e) => setBasis(e.target.value)}
        >
          <option value="mole_percent">O₂ · mole percent</option>
          <option value="volume_percent">O₂ · volume percent</option>
        </select>
      </div>
      <p className="text-xs leading-6 text-slate-500">
        Each dot is an imported run with both O₂ and pressure. Empty areas are
        unobserved in this pilot; rectangles and interpolation do not establish
        coverage. Select a dot to inspect its source.
      </p>
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Loading map…</p>}
      {!loading &&
        !error &&
        (points.length ? (
          <>
            <svg
              viewBox="0 0 720 290"
              role="img"
              aria-label="Observed oxygen and pressure conditions"
              className="w-full rounded-xl bg-slate-50"
            >
              {[0, 25, 50, 75, 100].map((x) => (
                <g key={x}>
                  <path d={`M${65 + x * 6} 25 V235`} stroke="#e2e8f0" />
                  <text x={55 + x * 6} y="255" fontSize="11" fill="#64748b">
                    {x}%
                  </text>
                </g>
              ))}
              {[0, 0.5, 1].map((f) => (
                <g key={f}>
                  <path d={`M65 ${235 - f * 210} H665`} stroke="#e2e8f0" />
                  <text x="12" y={239 - f * 210} fontSize="11" fill="#64748b">
                    {numeric(f * maxPressure, 1)}
                  </text>
                </g>
              ))}
              {points.map((p) => (
                <circle
                  key={p.runId}
                  cx={65 + p.oxygenPct * 6}
                  cy={235 - (p.pressurePsi / maxPressure) * 210}
                  r="3"
                  fill={studyColor(p.investigationId)}
                  opacity="0.65"
                  className="cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect ${p.label}`}
                  onClick={() => setSelected(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSelected(p);
                  }}
                >
                  <title>
                    {p.label} · {numeric(p.oxygenPct)}% ·{" "}
                    {numeric(p.pressurePsi)} psia
                  </title>
                </circle>
              ))}
              <text x="290" y="280" fontSize="12" fill="#64748b">
                Oxygen · {basis.replace("_", " ")}
              </text>
              <text x="12" y="15" fontSize="11" fill="#64748b">
                psia
              </text>
            </svg>
            <div
              className="flex flex-wrap gap-3 text-xs text-slate-500"
              aria-label="Evidence map legend"
            >
              <span>{points.length} observed points</span>
              {studyIds.map((id) => (
                <span key={id} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: studyColor(id) }}
                  />
                  {data?.investigations.find((study) => study.id === id)
                    ?.code || id}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-sm text-slate-500">
            No paired O₂/pressure points with this basis. Missing conditions
            remain unknown and do not become map coverage.
          </p>
        ))}
      {selected && (
        <div className="rounded-xl bg-blue-50 p-3 text-xs">
          <b>{selected.label}</b> · {numeric(selected.oxygenPct)}% O₂ ·{" "}
          {numeric(selected.pressurePsi)} psia ·{" "}
          <SourceLink
            id={selected.sourceId}
            label={`CSV row ${selected.rowNumber}`}
          />
        </div>
      )}
      <p className="text-xs text-slate-400">
        Solid O₂/flow map is unavailable until calibrated flow evidence is
        imported.
      </p>
    </section>
  );
}

export function ResearchMission() {
  const { data } = useDataset();
  const active = useWorkspaceStore((s) => s.activeScenario);
  const update = useWorkspaceStore((s) => s.updateActiveScenario);
  const [view, setView] = useState("evidence");
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [share, setShare] = useState("");
  const scenario: Scenario = {
    oxygenPct: active.oxygenPct,
    oxygenBasis: active.oxygenBasis ?? "volume_percent",
    pressurePsi: active.pressurePsi,
    gravityG: active.gravity,
    airflowCmS: active.airflowVelocity,
    material: active.material,
    pillar: active.pillar ?? "all",
    missionContext: active.missionContext ?? "custom",
  };
  const signature = JSON.stringify(scenario);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("view") === "prediction") setView("prediction");
    try {
      const raw = url.searchParams.get("scenario");
      if (!raw) return;
      const s = JSON.parse(raw) as Scenario;
      if (
        [s.oxygenPct, s.pressurePsi, s.gravityG, s.airflowCmS].every(
          Number.isFinite,
        ) &&
        ["mole_percent", "volume_percent"].includes(s.oxygenBasis) &&
        typeof s.material === "string" &&
        s.oxygenPct >= 0 &&
        s.oxygenPct <= 100 &&
        s.pressurePsi > 0 &&
        s.pressurePsi <= 100 &&
        s.gravityG >= 0 &&
        s.gravityG <= 1 &&
        s.airflowCmS >= 0 &&
        s.airflowCmS <= 100 &&
        ["all", ...PILLARS].includes(s.pillar ?? "all") &&
        MISSION_CONTEXTS.includes(s.missionContext ?? "custom")
      ) {
        update({
          oxygenPct: s.oxygenPct,
          pressurePsi: s.pressurePsi,
          gravity: s.gravityG,
          airflowVelocity: s.airflowCmS,
          material: s.material,
          oxygenBasis: s.oxygenBasis,
          pillar: s.pillar ?? "all",
          missionContext: s.missionContext ?? "custom",
        });
      }
    } catch {
      setError("The shared scenario is invalid. Default parameters are shown.");
    }
  }, [update]);
  useEffect(() => {
    setResult(null);
  }, [signature, data?.revision]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await api<Analysis>("/scenarios/analyze", {
        method: "POST",
        body: JSON.stringify({ ...scenario, revision: data.revision }),
      });
      const current = useWorkspaceStore.getState().activeScenario;
      if (
        current.oxygenPct === scenario.oxygenPct &&
        current.pressurePsi === scenario.pressurePsi &&
        current.gravity === scenario.gravityG &&
        current.airflowVelocity === scenario.airflowCmS &&
        current.material === scenario.material &&
        (current.oxygenBasis ?? "volume_percent") === scenario.oxygenBasis &&
        (current.pillar ?? "all") === scenario.pillar &&
        (current.missionContext ?? "custom") === scenario.missionContext &&
        useDatasetStore.getState().data?.revision === response.revision &&
        response.revision === data.revision
      )
        setResult(response);
    } catch (e) {
      if (useDatasetStore.getState().data?.revision === data.revision) {
        setError(e instanceof Error ? e.message : "Analysis unavailable");
      }
    } finally {
      setLoading(false);
    }
  }
  function shareScenario() {
    const url = new URL(window.location.href);
    url.searchParams.set("scenario", signature);
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", url);
    setShare(url.toString());
  }
  return (
    <DatasetGate>
      {data && (
        <div
          className="mx-auto max-w-7xl space-y-6 pb-20"
          data-testid="mission-workbench"
        >
          <ResearchHeader
            title="Mission Scenario Workbench"
            description="Find related observations within a pinned dataset revision. Matching is a condition lookup with explicit tolerances; it does not predict fire behavior or determine spacecraft safety."
          />
          <div className="flex flex-wrap gap-2">
            <button
              className={`${button} ${view === "evidence" ? "!bg-[#0B2374] !text-white" : ""}`}
              onClick={() => setView("evidence")}
            >
              NASA evidence analysis
            </button>
            <button
              className={`${button} ${view === "prediction" ? "!bg-[#0B2374] !text-white" : ""}`}
              onClick={() => setView("prediction")}
            >
              Predictive Lab · readiness only
            </button>
          </div>
          <form onSubmit={submit} className={`${panel} space-y-5`}>
            <div className="flex flex-wrap gap-2">
              {data.presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={button}
                  onClick={() =>
                    update({
                      name: p.name,
                      gravity: p.gravityG,
                      oxygenPct: p.oxygenPct,
                      pressurePsi: p.pressurePsi,
                      airflowVelocity: p.airflowCmS,
                      material: p.material,
                      oxygenBasis: p.oxygenBasis,
                    })
                  }
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Presets are illustrative query configurations, not measurements or
              operational recommendations.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-bold">
                Research purpose
                <select
                  className={`${field} mt-2`}
                  value={scenario.pillar}
                  onChange={(event) =>
                    update({ pillar: event.target.value as Pillar | "all" })
                  }
                >
                  <option value="all">All fire safety purposes</option>
                  {PILLARS.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose[0].toUpperCase() + purpose.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Mission context
                <select
                  className={`${field} mt-2`}
                  value={scenario.missionContext}
                  onChange={(event) =>
                    update({
                      missionContext: event.target.value as MissionContext,
                    })
                  }
                >
                  {MISSION_CONTEXTS.map((context) => (
                    <option key={context} value={context}>
                      {context === "iss"
                        ? "ISS"
                        : context[0].toUpperCase() + context.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Oxygen (%)
                <input
                  className={`${field} mt-2`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={active.oxygenPct}
                  onChange={(e) =>
                    update({ oxygenPct: Number(e.target.value) })
                  }
                />
              </label>
              <label className="text-xs font-bold">
                Oxygen basis
                <select
                  className={`${field} mt-2`}
                  value={scenario.oxygenBasis}
                  onChange={(e) =>
                    update({
                      oxygenBasis: e.target.value as Scenario["oxygenBasis"],
                    })
                  }
                >
                  <option value="volume_percent">Volume percent</option>
                  <option value="mole_percent">Mole percent</option>
                </select>
              </label>
              <label className="text-xs font-bold">
                Absolute pressure (psia)
                <input
                  className={`${field} mt-2`}
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  required
                  value={active.pressurePsi}
                  onChange={(e) =>
                    update({ pressurePsi: Number(e.target.value) })
                  }
                />
              </label>
              <label className="text-xs font-bold">
                Gravity target (g)
                <select
                  className={`${field} mt-2`}
                  value={active.gravity}
                  onChange={(e) => update({ gravity: Number(e.target.value) })}
                >
                  <option value="0">Microgravity target (0g nominal)</option>
                  <option value="0.16">Moon · 0.16g</option>
                  <option value="0.38">Mars · 0.38g</option>
                  <option value="1">Earth · 1g</option>
                </select>
              </label>
              <label className="text-xs font-bold">
                Material / fuel
                <input
                  className={`${field} mt-2`}
                  value={active.material}
                  maxLength={100}
                  required
                  onChange={(e) => update({ material: e.target.value })}
                />
              </label>
              <label className="text-xs font-bold">
                Airflow target (cm/s)
                <input
                  className={`${field} mt-2`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={active.airflowVelocity}
                  onChange={(e) =>
                    update({ airflowVelocity: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className={`${button} !bg-[#D4FC02]`}
                disabled={loading}
                type="submit"
              >
                {loading ? "Analyzing…" : "Analyze evidence"}
              </button>
              <button className={button} type="button" onClick={shareScenario}>
                Create scenario link
              </button>
            </div>
            {share && (
              <input
                aria-label="Shared scenario link"
                className={field}
                readOnly
                value={share}
                onFocus={(e) => e.target.select()}
              />
            )}
            <p className="text-xs text-slate-400">
              Lookup tolerances: O₂ ±0.5 percentage points · pressure ±0.2 psia
              · airflow ±0.5 cm/s. Oxygen bases are not mixed.
            </p>
            <p className="text-xs leading-6 text-slate-500">
              Mission context describes your research question; its label does
              not establish measured coverage or increase relevance on its own.
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
          </form>
          {view === "prediction" ? (
            <div className="space-y-4">
              <ModelReadiness revision={data.revision} />
              <button className={button} onClick={() => setView("evidence")}>
                Inspect available evidence
              </button>
            </div>
          ) : (
            <>
              {result?.studyRankings && (
                <section
                  className={`${panel} space-y-4`}
                  aria-label="Research relevance"
                >
                  <h2 className="text-lg font-bold">
                    Studies relevant to your research purpose
                  </h2>
                  <p className="text-xs leading-6 text-slate-500">
                    Relevance ranks research navigation, not fire risk or
                    probability. Condition counts below refer to one named best
                    record, never a combination of records.
                  </p>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {result.studyRankings.map((ranking) => (
                      <article
                        key={ranking.investigationId}
                        className="space-y-3 rounded-2xl border border-slate-200 p-4"
                      >
                        <Link
                          href={`/explorer/${ranking.investigationId}`}
                          className="font-bold text-[#0B2374]"
                        >
                          {data.investigations.find(
                            (study) => study.id === ranking.investigationId,
                          )?.code || ranking.investigationId}
                        </Link>
                        <PillarBadges pillars={ranking.pillars} />
                        <p className="text-xs text-slate-500">
                          {ranking.relevanceScore}/100 research relevance ·{" "}
                          {ranking.evidenceLevel.replaceAll("_", " ")}
                        </p>
                        <CitedPassages passages={ranking.reasons} />
                        <p className="text-xs leading-6 text-slate-500">
                          Best-record condition coverage:{" "}
                          {ranking.coverage.matched} matched ·{" "}
                          {ranking.coverage.unknown} unknown ·{" "}
                          {ranking.coverage.mismatched} mismatched.
                        </p>
                        {ranking.coverage.runId && (
                          <p className="text-xs text-slate-500">
                            Record:{" "}
                            {data.runs.find(
                              (run) => run.id === ranking.coverage.runId,
                            )?.externalRunKey || ranking.coverage.runId}
                          </p>
                        )}
                        {ranking.coverage.sourceId &&
                          ranking.coverage.locator && (
                            <SourceLink
                              id={ranking.coverage.sourceId}
                              label={ranking.coverage.locator}
                            />
                          )}
                      </article>
                    ))}
                  </div>
                  {!result.studyRankings.length && (
                    <p className="text-sm text-slate-500">
                      No classified investigations match this research purpose
                      in this release.
                    </p>
                  )}
                  <details className="text-xs leading-6 text-slate-500">
                    <summary className="cursor-pointer">
                      How research relevance is scored ·{" "}
                      {result.researchEngineVersion}
                    </summary>
                    <pre className="whitespace-pre-wrap break-words">
                      {typeof result.scoring === "string"
                        ? result.scoring
                        : JSON.stringify(result.scoring, null, 2)}
                    </pre>
                  </details>
                </section>
              )}
              {result && (
                <section
                  className={`${panel} space-y-4`}
                  aria-label="Condition analysis"
                >
                  <div className="flex flex-wrap items-center justify-between">
                    <h2 className="text-lg font-bold">
                      {result.exactMatchCount} combined exact matches
                    </h2>
                    <span className="text-xs text-slate-400">
                      {result.engineVersion}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-slate-500">
                    {result.notice}
                  </p>
                  <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                    Microgravity in metadata is a regime, not an exact g
                    measurement. Missing airflow and pressure remain unknown. A
                    high relevance score does not establish full condition
                    coverage.
                  </p>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {result.investigations.map((c) => (
                      <article
                        key={c.runId}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <Link
                          className="font-bold text-[#0B2374]"
                          href={`/explorer/${c.investigationId}`}
                        >
                          {c.investigationId.toUpperCase()} · {c.externalRunKey}
                        </Link>
                        <p className="my-3 text-xs text-slate-500">
                          {c.status} · {c.score}/100 lookup relevance
                        </p>
                        <dl className="space-y-2 text-xs">
                          {c.dimensions.map((d) => (
                            <div
                              className="flex justify-between gap-2"
                              key={d.dimension}
                            >
                              <dt className="capitalize text-slate-400">
                                {d.dimension}
                              </dt>
                              <dd
                                className={
                                  d.status === "match"
                                    ? "text-blue-700"
                                    : "text-slate-600"
                                }
                              >
                                {d.status.toUpperCase()}
                                {d.observed != null
                                  ? ` · ${typeof d.observed === "number" ? numeric(d.observed) : d.observed}`
                                  : ""}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  [
                    "Microgravity regime",
                    data.runs.filter(
                      (r) => r.conditions.gravityRegime === "microgravity",
                    ).length,
                  ],
                  [
                    "Moon 0.16g",
                    data.runs.filter((r) => r.conditions.gravityG === 0.16)
                      .length,
                  ],
                  [
                    "Mars 0.38g",
                    data.runs.filter((r) => r.conditions.gravityG === 0.38)
                      .length,
                  ],
                  [
                    "Earth 1g",
                    data.runs.filter((r) => r.conditions.gravityG === 1).length,
                  ],
                ].map(([label, count]) => (
                  <div className={`${panel} !p-4`} key={label}>
                    <b className="text-lg">{count}</b>
                    <p className="mt-1 text-xs text-slate-500">
                      {label} · source records
                    </p>
                  </div>
                ))}
              </div>
              <EvidenceMap />
            </>
          )}
        </div>
      )}
    </DatasetGate>
  );
}
