"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  FileCheck2,
  FlaskConical,
  Search,
  X,
} from "lucide-react";
import { api, type Study } from "@/lib/workspace-api";
import { useDataset, useDatasetStore } from "@/store/useDatasetStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  DatasetGate,
  ResearchHeader,
  ExportLinks,
  SourceLink,
  button,
  field,
  panel,
} from "./Shared";
import { CitedPassages, PILLARS, PillarBadges, StudyContext } from "./Evidence";

function StudyCard({ study }: { study: Study }) {
  const selected = useWorkspaceStore((s) => s.compareList.includes(study.id));
  const toggle = useWorkspaceStore((s) => s.toggleCompare);
  return (
    <article
      className={`${panel} flex flex-col gap-4`}
      data-testid={`live-study-${study.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-[#0B2374]">
          {study.psiId}
        </span>
        <span
          className={`text-xs font-semibold ${study.runCount ? "text-blue-700" : "text-slate-400"}`}
        >
          {study.runCount
            ? "Imported records"
            : (study.evidenceCoverage?.documents ?? 0) > 0
              ? "Document evidence"
              : "Metadata only"}
        </span>
      </div>
      <div>
        <h2 className="text-xl font-black">{study.code}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{study.title}</p>
      </div>
      <p className="text-xs leading-5 text-slate-500">{study.hardware}</p>
      <PillarBadges pillars={study.pillars} />
      <CitedPassages passages={study.summary?.slice(0, 1)} compact />
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
        <span>
          <b>{study.runCount}</b> imported rows · v{study.version}
        </span>
        <span>{study.license}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0B2374]"
          href={`/explorer/${study.id}`}
        >
          View investigation <ArrowRight size={14} />
        </Link>
        <button
          className={`${button} ${selected ? "!bg-[#D4FC02]/30" : ""}`}
          aria-pressed={selected}
          onClick={() => toggle(study.id)}
        >
          {selected ? "Selected" : "Compare"}
        </button>
      </div>
    </article>
  );
}

export function ResearchDashboard() {
  const { data } = useDataset();
  return (
    <DatasetGate>
      {data && (
        <div
          className="mx-auto max-w-7xl space-y-7 pb-16"
          data-testid="research-dashboard"
        >
          <ResearchHeader
            title="Microgravity Combustion Science"
            description="Explore original NASA PSI artifacts, inspect experimental conditions and trace every answer to a published source. This pilot keeps uncertain values and missing conditions visible."
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [data.stats.investigations, "NASA investigations", Database],
              [data.stats.runs, "Imported source records", FlaskConical],
              [data.stats.sources, "Versioned sources", FileCheck2],
              [
                data.stats.telemetrySeries,
                "Original telemetry series",
                Database,
              ],
            ].map(([value, label, Icon]) => {
              const Glyph = Icon as typeof Database;
              return (
                <div key={String(label)} className={panel}>
                  <Glyph className="mb-5 text-[#0B2374]" size={20} />
                  <div className="text-3xl font-black">{String(value)}</div>
                  <p className="mt-2 text-xs text-slate-500">{String(label)}</p>
                </div>
              );
            })}
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <section className={`${panel} space-y-4`}>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Start with the evidence
              </span>
              <h2 className="text-xl font-bold">
                Research evidence across fire safety.
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                Explore{" "}
                {
                  data.investigations.filter((study) => study.runCount > 0)
                    .length
                }{" "}
                investigations with imported records, alongside contextual
                documents and catalog metadata. Each source retains its version
                and limitations.
              </p>
              <Link
                href="/explorer"
                className={`${button} !bg-[#0B2374] !text-white`}
              >
                Explore experiments <ArrowRight size={15} />
              </Link>
              <Link href="/mission" className={`${button} ml-2`}>
                Inspect a mission scenario
              </Link>
            </section>
            <aside className={`${panel} !bg-[#0B2374] text-white`}>
              <p className="text-xs font-bold text-[#D4FC02]">
                EVIDENCE QUALITY
              </p>
              <h2 className="mt-4 text-xl font-bold">
                Source checked ≠ independently validated
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-200">
                {data.stats.independentlyReviewedRuns} independently reviewed
                runs. File hashes and transcription checks do not establish
                measurement accuracy, condition coverage, or spacecraft safety.
              </p>
              <p className="mt-4 text-xs text-slate-300">
                Prediction remains offline: no validated model is installed.
              </p>
            </aside>
          </div>
          <section
            className="grid gap-4 sm:grid-cols-3"
            aria-label="Fire safety research coverage"
          >
            {PILLARS.map((pillar) => {
              const studies = data.investigations.filter((study) =>
                study.pillars?.includes(pillar),
              );
              return (
                <Link
                  key={pillar}
                  href={`/explorer?pillar=${pillar}`}
                  className={panel}
                >
                  <h2 className="font-bold capitalize">{pillar}</h2>
                  <p className="mt-3 text-2xl font-black">{studies.length}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    related investigations ·{" "}
                    {studies.filter((study) => study.runCount > 0).length} with
                    imported records
                  </p>
                </Link>
              );
            })}
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold">
              Investigations with source records
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {data.investigations
                .filter((s) => s.runCount > 0)
                .map((s) => (
                  <StudyCard key={s.id} study={s} />
                ))}
            </div>
          </section>
          <div className={`${panel} text-xs leading-6 text-slate-500`}>
            {data.limitations.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </DatasetGate>
  );
}

export function ResearchExplorer() {
  const { data } = useDataset();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [pillar, setPillar] = useState("all");
  useEffect(() => {
    const selected = new URL(window.location.href).searchParams.get("pillar");
    if (PILLARS.includes(selected as (typeof PILLARS)[number]))
      setPillar(selected!);
  }, []);
  const ids = useWorkspaceStore((s) => s.compareList);
  const open = useWorkspaceStore((s) => s.setComparisonModalOpen);
  const clear = useWorkspaceStore((s) => s.clearCompare);
  const studies =
    data?.investigations.filter(
      (s) =>
        `${s.code} ${s.title} ${s.psiId}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (scope === "all" ||
          (scope === "runs"
            ? s.runCount > 0
            : (s.evidenceCoverage?.documents ?? 0) > 0)) &&
        (pillar === "all" ||
          s.pillars?.includes(pillar as (typeof PILLARS)[number])),
    ) ?? [];
  return (
    <DatasetGate>
      {data && (
        <div
          className="mx-auto max-w-7xl space-y-6 pb-24"
          data-testid="explorer-catalog-page"
        >
          <ResearchHeader
            title="Experiment Explorer"
            description="Search the NASA catalog and open the original source-backed pilot rows. Metadata-only entries do not imply that run data have been imported."
          />
          <div className={`${panel} flex flex-wrap items-center gap-4`}>
            <Search size={18} className="text-slate-400" />
            <input
              className={`${field} !w-auto min-w-0 flex-1`}
              placeholder="Search investigations, title or PSI ID…"
              aria-label="Search investigations"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className={`${field} !w-auto`}
              aria-label="Data coverage"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="all">All catalog entries</option>
              <option value="runs">With imported source records</option>
              <option value="documents">With document evidence</option>
            </select>
            <select
              className={`${field} !w-auto`}
              aria-label="Research purpose"
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
            >
              <option value="all">All fire safety purposes</option>
              {PILLARS.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {purpose[0].toUpperCase() + purpose.slice(1)}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              {studies.length} / {data.investigations.length} studies
            </span>
          </div>
          {studies.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {studies.map((s) => (
                <StudyCard key={s.id} study={s} />
              ))}
            </div>
          ) : (
            <div className={panel}>No investigations match these filters.</div>
          )}
          {ids.length > 0 && (
            <div className="sticky bottom-5 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              <span className="text-xs font-bold">
                {ids.length} / 3 selected
              </span>
              <button
                className={button}
                disabled={ids.length < 2}
                onClick={() => open(true)}
              >
                Compare studies
              </button>
              <button className={button} onClick={clear}>
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </DatasetGate>
  );
}

export function ResearchCompare() {
  const { data } = useDataset();
  const ids = useWorkspaceStore((s) => s.compareList);
  const isOpen = useWorkspaceStore((s) => s.isComparisonModalOpen);
  const setOpen = useWorkspaceStore((s) => s.setComparisonModalOpen);
  const [result, setResult] = useState<{
    investigations: Study[];
    notice: string;
  } | null>(null);
  const [error, setError] = useState("");
  const selection = ids.join(",");
  useEffect(() => {
    if (!isOpen || !data || ids.length < 2) return;
    const controller = new AbortController();
    setError("");
    setResult(null);
    void api<{ investigations: Study[]; notice: string }>("/compare", {
      method: "POST",
      signal: controller.signal,
      body: JSON.stringify({ investigationIds: ids, revision: data.revision }),
    })
      .then((response) => {
        if (
          !controller.signal.aborted &&
          useDatasetStore.getState().data?.revision === data.revision
        )
          setResult(response);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [isOpen, data, selection]); // selection identity changes only when the chosen IDs do
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, setOpen]);
  if (!isOpen || !data) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      onClick={() => setOpen(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Compare source-backed studies"
        className={`${panel} max-h-[90vh] w-full max-w-5xl overflow-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Compare investigations</h2>
          <button
            aria-label="Close comparison"
            className={button}
            onClick={() => setOpen(false)}
            autoFocus
          >
            <X size={16} />
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        {!result && !error && <p role="status">Loading comparison…</p>}
        {result && (
          <>
            <p className="mb-5 text-sm leading-6 text-slate-500">
              {result.notice}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {result.investigations.map((s) => (
                <article
                  className="rounded-2xl border border-slate-200 p-4"
                  key={s.id}
                >
                  <h3 className="font-bold">{s.code}</h3>
                  <p className="mt-2 text-xs text-slate-500">
                    {s.psiId} · v{s.version}
                  </p>
                  <p className="my-3 text-sm">{s.title}</p>
                  <p className="text-xs leading-6 text-slate-500">
                    {s.runCount} imported rows
                    <br />
                    {s.fuelType ?? "Fuel category not normalized"}
                    <br />
                    {s.license}
                  </p>
                  <SourceLink
                    id={s.metadataSourceId}
                    label="Metadata provenance"
                  />
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <StudyContext study={s} />
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-5">
              <ExportLinks ids={ids} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
