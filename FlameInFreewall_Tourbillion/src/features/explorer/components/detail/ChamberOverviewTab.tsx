"use client";

import React from "react";
import { SourceOverview } from "./SourceOverview";
import {
  Sparkles,
  BookOpen,
  ExternalLink,
  Tag,
  AlertTriangle,
  Building2,
  Database,
} from "lucide-react";
import type { MappedInvestigationDetail, MappedSource } from "@/types/api";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
import { browserSourceUrl } from '@/lib/psiLinks';

export interface ChamberOverviewTabProps {
  study: MappedInvestigationDetail;
  sources?: MappedSource[];
  isSourcesLoading?: boolean;
  sourcesError?: unknown;
  onRetrySources?: () => void;
}

export const ChamberOverviewTab: React.FC<ChamberOverviewTabProps> = ({
  study,
  sources = [],
  isSourcesLoading = false,
  sourcesError,
  onRetrySources,
}) => {
  const unavailableEntries = Object.entries(study.unavailableFields);

  return (
    <div data-testid="chamber-overview-tab" className="space-y-6">
      <SourceOverview id={study.id} />
      {/* Research Purpose & Catalog Metadata */}
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Research Purpose &amp; Catalog Profile</span>
        </h3>
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          {study.researchPurpose ??
            "Research purpose is not mapped in the current backend catalog."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
          <div>
            <div className="text-[10px] uppercase text-zinc-500 font-semibold flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#0B2374]" />
              <span>Platform</span>
            </div>
            <div className="font-bold text-zinc-900 mt-1">
              {study.platform ?? "Platform unmapped"}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-zinc-500 font-semibold flex items-center gap-1">
              <Database className="w-3 h-3 text-[#0B2374]" />
              <span>Collection Context</span>
            </div>
            <div
              className="font-bold text-zinc-900 mt-1"
              title={study.context.collectionId}
            >
              {study.context.origin} · {study.context.reviewState}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-zinc-500 font-semibold">
              Mapped Counts
            </div>
            <div className="font-bold text-zinc-900 mt-1">
              {study.runsMeta.total} runs · {study.sourcesMeta.total} sources ·{" "}
              {study.claimsMeta.total} claims
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2 pt-1">
          <span className="text-xs uppercase text-zinc-500 font-bold">
            Catalog Tags
          </span>
          {study.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {study.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-zinc-800"
                >
                  <Tag className="w-3 h-3 text-[#0B2374]" />
                  <a
                    href={`/explorer?tag=${encodeURIComponent(tag.slug)}`}
                    className="underline"
                  >
                    {tag.label}
                  </a>
                  {tag.category && (
                    <span className="text-[10px] text-zinc-500">
                      (
                      {tag.category === "pillar"
                        ? "team annotation, unreviewed"
                        : tag.category}
                      )
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              No catalog tags mapped for this investigation.
            </p>
          )}
        </div>
      </div>

      <details
        data-testid="unavailable-fields-card"
        className="rounded-3xl border border-gray-100 bg-white p-4 text-xs text-slate-500"
      >
        <summary>
          Not available in this release:{" "}
          {unavailableEntries
            .filter(
              ([field]) =>
                !study.tags.some(
                  (tag) =>
                    (
                      ({
                        code: "code",
                        hardware: "hardware",
                        fuelCategory: "fuel-type",
                      }) as Record<string, string>
                    )[field] === tag.category,
                ),
            )
            .map(([field]) => field.replace(/([A-Z])/g, " $1").toLowerCase())
            .join(", ") || "no additional catalog fields"}
        </summary>
        <p className="pt-2">
          Fields are omitted when source data or review is unavailable. See
          source excerpts and records for supported detail.
        </p>
      </details>

      {/* Linked NASA PSI / DOI Sources */}
      <div
        data-testid="study-sources-card"
        className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3"
      >
        <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0B2374]" />
          <span>Linked Sources &amp; PSI Records ({sources.length})</span>
        </h3>

        {isSourcesLoading ? (
          <div data-testid="sources-loading-shimmer" className="space-y-2">
            <div className="h-14 rounded-2xl bg-gray-200/60" />
            <div className="h-14 rounded-2xl bg-gray-200/60" />
          </div>
        ) : sourcesError ? (
          <ApiErrorBanner
            title="Unable to load linked sources"
            error={sourcesError}
            onRetry={onRetrySources}
          />
        ) : sources.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No linked source records returned for this study.
          </p>
        ) : (
          <div className="space-y-2">
            {sources.map((src) => (
              <div
                key={src.id}
                data-testid={`source-card-${src.id}`}
                className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0B2374] font-bold text-[10px]">
                      {src.documentType}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-zinc-700 font-semibold text-[10px]">
                      {src.ingestionStatus}
                    </span>
                    {src.version && (
                      <span className="text-[11px] text-zinc-500">
                        v{src.version}
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-600 truncate text-[11px]">
                    {src.sourceUrl}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {src.doi && (
                    <a
                      href={`https://doi.org/${src.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#0B2374] hover:underline text-[11px] font-bold"
                    >
                      <span>DOI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <a
                    href={browserSourceUrl(src.sourceUrl) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-zinc-800 hover:bg-gray-100 text-[11px] font-semibold"
                  >
                    <span>Open Source</span>
                    <ExternalLink className="w-3 h-3 text-[#0B2374]" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
