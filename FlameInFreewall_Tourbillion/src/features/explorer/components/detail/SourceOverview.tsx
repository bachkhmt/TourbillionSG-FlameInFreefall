"use client";
import React from "react";
import {
  useStudyOverviewQuery,
  useDescriptiveQuery,
} from "@/api/services/evidenceNavigation";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
export function SourceOverview({ id }: { id: string }) {
  const query = useStudyOverviewQuery(id);
  const conditions = useDescriptiveQuery({ investigationId: id });
  return (
    <div className="space-y-4">
      {query.isLoading && <p role="status">Loading source overview…</p>}
      {query.isError && (
        <ApiErrorBanner
          title="Unable to load admitted source overview"
          error={query.error}
          onRetry={() => query.refetch()}
        />
      )}
      {(["objective", "approach", "researchImpacts"] as const).map(
        (section) => {
          const passages =
            query.data?.passages.filter((p) => p.section === section) ?? [];
          return (
            passages.length > 0 && (
              <section
                key={section}
                className="rounded-3xl border border-gray-200 bg-white p-5 space-y-3"
              >
                <h3 className="font-bold">
                  {section === "objective"
                    ? "Objective"
                    : section === "approach"
                      ? "Approach"
                      : "Research impacts"}
                </h3>
                {passages.map((p) => (
                  <blockquote
                    key={`${p.sourceDocumentId}-${p.locator}`}
                    className="space-y-2 text-sm"
                  >
                    <p className="whitespace-pre-wrap">{p.text}</p>
                    <a
                      href={p.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-800 underline"
                    >
                      Open source · {p.locator}
                    </a>
                  </blockquote>
                ))}
                <p className="text-xs text-slate-500">
                  Original source text · Unreviewed
                </p>
              </section>
            )
          );
        },
      )}
      {query.data &&
        !query.data.passages.some(
          (p) => p.section === "objective" || p.section === "approach",
        ) && <p>No admitted objective or approach text in this release.</p>}
      {conditions.isError && (
        <ApiErrorBanner
          title="Unable to load condition summary"
          error={conditions.error}
          onRetry={() => conditions.refetch()}
        />
      )}
      {conditions.data && (
        <section className="rounded-3xl border border-gray-200 bg-white p-5 space-y-2">
          <h3 className="font-bold">Conditions at a glance</h3>
          <p className="text-sm">
            {conditions.data.recordCount} source records. Materials:{" "}
            {conditions.data.materialDistribution
              .map((bin) => `${bin.label} (${bin.count})`)
              .join(", ")}
            .
          </p>
          <p className="text-xs">
            Oxygen missing: {conditions.data.missingOxygen}; pressure missing:{" "}
            {conditions.data.missingPressure}. Paired oxygen/pressure values
            available in {conditions.data.conditionPoints.length} records.
          </p>
          {[
            ...new Set(
              conditions.data.conditionPoints.map(
                (p) => `${p.oxygenBasis}|${p.oxygenMeaning}`,
              ),
            ),
          ].map((key) => {
            const points = conditions.data!.conditionPoints.filter(
              (p) => `${p.oxygenBasis}|${p.oxygenMeaning}` === key,
            );
            const sorted = [...points].sort(
              (a, b) => Number(a.oxygenPct) - Number(b.oxygenPct),
            );
            return (
              <p key={key} className="text-xs">
                Paired records · {key.replace("|", " · ")}:{" "}
                {sorted[0].oxygenPct}–{sorted.at(-1)!.oxygenPct}% oxygen.
              </p>
            );
          })}
          <p className="text-xs text-slate-500">
            Descriptive source records, unreviewed. Ranges do not establish
            compatible conditions across different runs.
          </p>
        </section>
      )}
    </div>
  );
}
