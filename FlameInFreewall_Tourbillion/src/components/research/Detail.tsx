"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { numeric, type Run, type Telemetry } from "@/lib/workspace-api";
import { useDataset } from "@/store/useDatasetStore";
import { useAiAssistantStore } from "@/store/useAiAssistantStore";
import {
  DatasetGate,
  ResearchHeader,
  SourceLink,
  ExportLinks,
  button,
  field,
  panel,
} from "./Shared";
import { StudyContext } from "./Evidence";

function RunEvidence({ run }: { run: Run }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold">{run.externalRunKey}</h3>
        <SourceLink
          id={run.sourceId}
          label={`Original table · row ${run.rowNumber}`}
        />
      </div>
      <p className="text-xs text-slate-500">
        Source checked · {run.conditions.material} ·{" "}
        {run.conditions.gravityG == null
          ? `exact gravity unknown (${run.conditions.gravityRegime} regime from catalog)`
          : `${numeric(run.conditions.gravityG)} g from source`}
        {run.recordKind && ` · ${run.recordKind.replaceAll("_", " ")}`}
      </p>
      {(run.sampleGeometry ||
        run.conditions.oxygenContext ||
        run.conditions.flowContext ||
        run.conditions.flameConfiguration) && (
        <dl className="grid gap-3 text-xs sm:grid-cols-2">
          {[
            ["Geometry", run.sampleGeometry],
            ["Oxygen context", run.conditions.oxygenContext],
            ["Flow context", run.conditions.flowContext],
            ["Flame configuration", run.conditions.flameConfiguration],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-400">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
      )}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        {run.issues.map((issue) => (
          <p key={issue}>{issue}</p>
        ))}
      </div>
      {run.conditions.pressureConversion && (
        <p className="text-xs text-slate-500">
          Normalization: {run.conditions.pressureConversion}. Original pressure
          remains in the table below.
        </p>
      )}
      <div className="overflow-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="border-b text-slate-400">
            <tr>
              {[
                "Observable",
                "Original value",
                "Original unit",
                "Normalized value",
                "Provenance",
              ].map((label) => (
                <th key={label} className="p-2 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {run.observations.map((o, i) => (
              <tr key={`${o.name}-${i}`} className="border-b border-slate-100">
                <td className="p-2">{o.name.replaceAll("_", " ")}</td>
                <td className="p-2 font-semibold">{o.raw || "Unknown"}</td>
                <td className="p-2">{o.originalUnit}</td>
                <td className="p-2">
                  {o.value == null ? "Not normalized" : numeric(o.value, 5)}
                </td>
                <td className="p-2">
                  <SourceLink id={o.sourceId} label={o.locator} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="rounded-xl border border-slate-200 p-3 text-xs">
        <summary className="cursor-pointer font-bold">
          All original fields · CSV row {run.rowNumber}
        </summary>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(run.raw).map(([k, v]) => (
            <div key={k}>
              <dt className="text-slate-400">{k}</dt>
              <dd className="break-words font-medium">
                {v || "Unknown / blank in source"}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

function TelemetryPlot({
  series,
  runLabel,
}: {
  series: Telemetry;
  runLabel: string;
}) {
  const points = series.points.filter(
    (p): p is { timeSec: number; value: number } =>
      p.timeSec != null &&
      p.value != null &&
      Number.isFinite(p.timeSec) &&
      Number.isFinite(p.value),
  );
  if (!points.length) return <p>No usable original channel samples.</p>;
  const xmin = points.reduce(
      (min, point) => Math.min(min, point.timeSec),
      Infinity,
    ),
    xmax = points.reduce(
      (max, point) => Math.max(max, point.timeSec),
      -Infinity,
    ),
    ymin = points.reduce((min, point) => Math.min(min, point.value), Infinity),
    ymax = points.reduce((max, point) => Math.max(max, point.value), -Infinity);
  const stride = Math.max(1, Math.ceil(points.length / 2000));
  const displayed = points.filter(
    (_, index) => index % stride === 0 || index === points.length - 1,
  );
  const label = series.label || series.channel.replaceAll("_", " ");
  const x = (v: number) => 55 + ((v - xmin) / (xmax - xmin || 1)) * 540;
  const y = (v: number) => 220 - ((v - ymin) / (ymax - ymin || 1)) * 180;
  return (
    <figure className="space-y-4">
      <figcaption className="text-sm font-bold">
        Original {label} · {runLabel}
      </figcaption>
      <svg
        viewBox="0 0 650 280"
        className="w-full rounded-xl bg-slate-50"
        role="img"
        aria-label={`Original ${label} (${series.unit}) over time (${series.timeUnit})`}
      >
        <path d="M55 35 V220 H610" fill="none" stroke="#94a3b8" />
        {displayed.map((p, i) => (
          <circle
            key={i}
            cx={x(p.timeSec)}
            cy={y(p.value)}
            r="2.2"
            fill="#245cc0"
          >
            <title>
              {p.timeSec} {series.timeUnit} · {p.value} {series.unit}
            </title>
          </circle>
        ))}
        <text x="55" y="240" fontSize="11" fill="#64748b">
          {numeric(xmin)} {series.timeUnit}
        </text>
        <text x="565" y="240" fontSize="11" fill="#64748b">
          {numeric(xmax)} {series.timeUnit}
        </text>
        <text x="5" y="45" fontSize="11" fill="#64748b">
          {numeric(ymax)} {series.unit}
        </text>
        <text x="5" y="220" fontSize="11" fill="#64748b">
          {numeric(ymin)}
        </text>
        <text x="250" y="265" fontSize="12" fill="#64748b">
          Time · original source offset ({series.timeUnit})
        </text>
      </svg>
      <p className="text-xs leading-6 text-slate-500">
        {points.length} original samples.{" "}
        {displayed.length < points.length &&
          `${displayed.length} source samples shown for display performance. `}
        {series.timeReference}. Dots are source observations; no missing channel
        has been inferred.
      </p>
      {series.description && (
        <p className="text-xs leading-6 text-slate-500">{series.description}</p>
      )}
      <SourceLink
        id={series.sourceId}
        label="Inspect original telemetry source"
      />
    </figure>
  );
}

export function ResearchDetail({ studyId }: { studyId?: string }) {
  const params = useParams();
  const id =
    studyId ?? (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? "";
  const { data } = useDataset();
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState("FLEX-007");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [channel, setChannel] = useState("");
  const openAssistant = useAiAssistantStore((s) => s.setOpen);
  const setContext = useAiAssistantStore((s) => s.setActiveContextStudyId);
  const study = data?.investigations.find((s) =>
    [s.id, s.uuid, s.psiId].includes(id),
  );
  const runs = data?.runs.filter((r) => r.investigationId === study?.id) ?? [];
  const run =
    runs.find((r) => r.id === selected || r.externalRunKey === selected) ??
    runs[0];
  const filtered = runs.filter((r) =>
    `${r.externalRunKey} ${r.conditions.material}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const channels = run
    ? (data?.telemetryChannels?.[run.id] ??
      (data?.telemetry[run.id] ? [data.telemetry[run.id]] : []))
    : [];
  const channelKey = (series: Telemetry, index: number) =>
    `${run?.id}:${series.channel}:${series.sourceId}:${index}`;
  const series =
    channels.find((series, index) => channelKey(series, index) === channel) ??
    channels[0];
  return (
    <DatasetGate>
      {data &&
        (study ? (
          <div
            className="mx-auto max-w-7xl space-y-6 pb-20"
            data-testid="live-study-detail"
          >
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"
            >
              <ArrowLeft size={14} />
              All experiments
            </Link>
            <ResearchHeader
              title={`${study.code} · ${study.title}`}
              description={`${study.psiId} · ${study.platform} · dataset version ${study.version}. ${study.runCount > 0 ? "Imported source records; review caveats before interpreting values." : (study.evidenceCoverage?.documents ?? 0) > 0 ? "Document or configuration evidence is available; no source records have been imported." : "Metadata only: source records have not been imported for this investigation."}`}
            />
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Investigation views"
            >
              {[
                ["overview", "Overview"],
                ["runs", `Source records (${runs.length})`],
                ["telemetry", "Original telemetry"],
                ["sources", "Sources & caveats"],
                ["export", "Export & Data Card"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={tab === value}
                  className={`${button} ${tab === value ? "!bg-[#0B2374] !text-white" : ""}`}
                  onClick={() => setTab(value)}
                >
                  {label}
                </button>
              ))}
              <button
                className={`${button} ml-auto`}
                onClick={() => {
                  setContext(study.id);
                  openAssistant(true);
                }}
              >
                <MessageSquare size={14} />
                Ask about this study
              </button>
            </div>
            <section className={`${panel} space-y-5`}>
              {tab === "overview" && (
                <>
                  <h2 className="text-xl font-bold">
                    Source & experiment context
                  </h2>
                  <dl className="grid gap-5 text-sm sm:grid-cols-2">
                    {[
                      ["Hardware", study.hardware],
                      ["Imported rows", String(study.runCount)],
                      ["Dataset license", study.license],
                      [
                        "Review status",
                        typeof study.evidenceCoverage?.reviewed === "number"
                          ? `Source checked; independently reviewed: ${study.evidenceCoverage.reviewed}`
                          : "Review status unavailable in this historical release",
                      ],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="mb-2 text-xs text-slate-400">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <SourceLink
                    id={study.metadataSourceId}
                    label="Inspect catalog metadata"
                  />
                  <StudyContext study={study} />
                  {run && (
                    <div className="border-t border-slate-100 pt-5">
                      <RunEvidence run={run} />
                    </div>
                  )}
                </>
              )}
              {(tab === "runs" || tab === "telemetry") && runs.length > 0 && (
                <label className="block max-w-xl text-xs font-bold">
                  Select source record
                  <select
                    className={`${field} mt-2`}
                    value={run?.id ?? ""}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {runs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.externalRunKey} · {r.conditions.material}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {tab === "runs" && (
                <>
                  {!runs.length ? (
                    <p>No source records imported for this study.</p>
                  ) : (
                    <>
                      <input
                        className={field}
                        aria-label="Search test runs"
                        placeholder="Search run ID or material…"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(0);
                        }}
                      />
                      <div className="overflow-auto">
                        <table className="w-full min-w-[600px] text-left text-xs">
                          <thead className="text-slate-400">
                            <tr>
                              {[
                                "Run",
                                "Material",
                                "O₂ % / basis",
                                "Pressure psia",
                                "Airflow cm/s",
                              ].map((h) => (
                                <th key={h} className="p-3 font-medium">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filtered
                              .slice(page * 20, page * 20 + 20)
                              .map((r) => (
                                <tr
                                  key={r.id}
                                  className={`border-t border-slate-100 ${r.id === run?.id ? "bg-blue-50" : ""}`}
                                >
                                  <td className="p-3">
                                    <button
                                      className="font-bold text-[#0B2374] underline"
                                      onClick={() => setSelected(r.id)}
                                    >
                                      {r.externalRunKey}
                                    </button>
                                  </td>
                                  <td className="max-w-52 p-3">
                                    {r.conditions.material}
                                  </td>
                                  <td className="p-3">
                                    {numeric(r.conditions.oxygenPct)}
                                    <br />
                                    <span className="text-slate-400">
                                      {r.conditions.oxygenBasis}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    {numeric(r.conditions.pressurePsi)}
                                  </td>
                                  <td className="p-3">
                                    {numeric(r.conditions.airflowCmS)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <button
                          className={button}
                          disabled={page === 0}
                          onClick={() => setPage(page - 1)}
                        >
                          Previous
                        </button>
                        <span>
                          {filtered.length} rows · page {page + 1}
                        </span>
                        <button
                          className={button}
                          disabled={(page + 1) * 20 >= filtered.length}
                          onClick={() => setPage(page + 1)}
                        >
                          Next
                        </button>
                      </div>
                      {run && <RunEvidence run={run} />}
                    </>
                  )}
                </>
              )}
              {tab === "telemetry" &&
                (series && run ? (
                  <div className="space-y-4">
                    <label className="block max-w-xl text-xs font-bold">
                      Measurement channel
                      <select
                        className={`${field} mt-2`}
                        value={channelKey(series, channels.indexOf(series))}
                        onChange={(event) => setChannel(event.target.value)}
                      >
                        {channels.map((item, index) => (
                          <option
                            key={channelKey(item, index)}
                            value={channelKey(item, index)}
                          >
                            {item.label || item.channel.replaceAll("_", " ")} ·{" "}
                            {item.unit}
                          </option>
                        ))}
                      </select>
                    </label>
                    <TelemetryPlot
                      series={series}
                      runLabel={run.externalRunKey}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                    <h2 className="font-bold">
                      No original telemetry imported for this run
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Scalar measurements are not converted into synthetic
                      sensor curves. Choose another run or inspect its scalar
                      measurements and source documents.
                    </p>
                  </div>
                ))}
              {tab === "sources" && (
                <>
                  <h2 className="text-lg font-bold">
                    Versioned source manifest
                  </h2>
                  <div className="space-y-4">
                    {data.sources
                      .filter((s) => s.investigationId === study.id)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <SourceLink id={s.id} label={s.filename} />
                          <p className="mt-2 break-all text-xs leading-6 text-slate-400">
                            Study v{s.studyVersion} · file v{s.fileVersion} ·{" "}
                            {s.license}
                            <br />
                            SHA-256 {s.sha256}
                          </p>
                        </div>
                      ))}
                  </div>
                  <p className="text-sm text-slate-500">
                    Direct file provenance does not establish independent
                    scientific validation.
                  </p>
                </>
              )}
              {tab === "export" && (
                <>
                  <h2 className="font-bold">Export this published revision</h2>
                  <p className="text-sm leading-7 text-slate-500">
                    JSON retains original fields, units, source hashes and
                    conflicts. CSV is the normalized condition projection: blank
                    means unknown. Export the JSON alongside the notebook.
                  </p>
                  <ExportLinks ids={[study.id]} />
                </>
              )}
            </section>
          </div>
        ) : (
          <div className={panel}>
            <h1 className="text-xl font-bold">Investigation not found</h1>
            <p className="my-3 text-sm">
              No matching ID exists in this release.
            </p>
            <Link href="/explorer" className={button}>
              Return to Explorer
            </Link>
          </div>
        ))}
    </DatasetGate>
  );
}
