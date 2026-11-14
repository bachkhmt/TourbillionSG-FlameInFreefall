"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Database, Download, RefreshCw, X } from "lucide-react";
import { api, exportUrl, sourceUrl, type Source } from "@/lib/workspace-api";
import { useDataset } from "@/store/useDatasetStore";

export const panel =
  "rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs";
export const button =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:border-slate-400 disabled:opacity-40";
export const field =
  "w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900";

export function DatasetGate({ children }: { children: React.ReactNode }) {
  const { data, status, error, load } = useDataset();
  if (status === "error")
    return (
      <div role="alert" className={panel}>
        <h1 className="text-xl font-bold">Research dataset unavailable</h1>
        <p className="my-3 text-sm text-slate-600">{error}</p>
        <button className={button} onClick={() => void load(true)}>
          <RefreshCw size={14} />
          Retry connection
        </button>
      </div>
    );
  if (!data)
    return (
      <div role="status" className={`${panel} animate-pulse`}>
        Loading published NASA pilot…
      </div>
    );
  return <>{children}</>;
}

export function ResearchHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { data, load } = useDataset();
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#D4FC02]/30 px-3 py-1 text-[#0B2374]">
          <Database size={13} />
          NASA PSI · source-checked pilot
        </span>
        {data && (
          <span title={data.revision}>
            Release {data.revision.slice(0, 10)}
          </span>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[#0B2374] hover:underline"
          onClick={() => void load(true)}
        >
          <RefreshCw size={12} />
          Refresh release
        </button>
        <a
          href="/studio"
          className="ml-auto inline-flex items-center gap-1 text-[#0B2374]"
        >
          Flame studio · illustration <ArrowUpRight size={14} />
        </a>
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="max-w-3xl text-sm leading-6 text-slate-500">
        {description}
      </p>
      <nav className="flex flex-wrap gap-2" aria-label="Research views">
        {[
          ["/dashboard", "Overview"],
          ["/explorer", "Experiments"],
          ["/mission", "Mission & evidence map"],
          ["/resources", "Official resources"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className={button}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SourceLink({
  id,
  label = "Inspect source",
  revision,
}: {
  id: string;
  label?: string;
  revision?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="text-xs font-semibold text-[#0B2374] hover:underline break-all"
        onClick={() => setOpen(true)}
      >
        {label} ↗
      </button>
      {open && (
        <SourceViewer
          id={id}
          revision={revision}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SourceViewer({
  id,
  revision,
  onClose,
}: {
  id: string;
  revision?: string;
  onClose: () => void;
}) {
  const { data } = useDataset();
  const pinnedRevision = revision ?? data?.revision;
  const [value, setValue] = useState<{ source: Source; text: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    if (pinnedRevision)
      void api<{ source: Source; text: string }>(
        `/sources/${encodeURIComponent(id)}?revision=${encodeURIComponent(pinnedRevision)}`,
        { signal: controller.signal },
      )
        .then((response) => {
          if (!controller.signal.aborted) setValue(response);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(String(e.message));
        });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", keydown);
    return () => {
      controller.abort();
      document.removeEventListener("keydown", keydown);
    };
  }, [id, pinnedRevision, onClose]);
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-3"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Original source"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="break-all text-sm font-bold">
            {value?.source.filename ?? "Loading source…"}
          </h2>
          <button
            aria-label="Close source"
            className={button}
            onClick={onClose}
            autoFocus
          >
            <X size={16} />
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        {value && pinnedRevision && (
          <>
            <p className="mt-3 break-all text-xs text-slate-500">
              Study v{value.source.studyVersion} · File v
              {value.source.fileVersion} · {value.source.license}
              <br />
              SHA-256 {value.source.sha256}
            </p>
            <div className="my-3 flex flex-wrap gap-3">
              <a className={button} href={sourceUrl(id, pinnedRevision, true)}>
                <Download size={14} />
                Original bytes
              </a>
              <a
                className={button}
                href={value.source.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                NASA source <ArrowUpRight size={14} />
              </a>
            </div>
            <pre className="min-h-0 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-xs leading-6">
              {value.text}
            </pre>
          </>
        )}
      </section>
    </div>
  );
}

export function ExportLinks({ ids }: { ids: string[] }) {
  const { data } = useDataset();
  if (!data || !ids.length) return null;
  return (
    <div className="flex flex-wrap gap-2" aria-label="Export selected data">
      {["json", "csv", "card", "notebook"].map((format) => (
        <a
          key={format}
          className={button}
          href={exportUrl(ids, data.revision, format)}
        >
          <Download size={13} />
          {format === "card" ? "Data Card" : format.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
