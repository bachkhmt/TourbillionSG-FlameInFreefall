"use client";
import React from "react";
import Link from "next/link";
import { useActiveScenarioEvaluation } from "../hooks/useScenarioQueries";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";

export function ScenarioEvidenceStatus({
  section,
}: {
  section: "coverage" | "rankings";
}) {
  const query = useActiveScenarioEvaluation();
  const scenario = useWorkspaceStore((state) => state.activeScenario);
  const title =
    section === "rankings" ? "Research relevance ranking" : "Evidence coverage";
  const params = new URLSearchParams({
    material: scenario.material,
    gravityRaw:
      scenario.gravity === 0 ? "microgravity" : String(scenario.gravity) + "g",
  });
  if (query.isLoading)
    return <p role="status">Loading {title.toLowerCase()}…</p>;
  if (query.isError)
    return (
      <ApiErrorBanner
        title={`Unable to load ${title.toLowerCase()}`}
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  const result = query.data?.[section];
  if (!result) return null;
  return (
    <section
      className="rounded-3xl border border-gray-200 bg-white p-5 space-y-3"
      data-testid={
        section === "rankings" ? "ranked-evidence-list" : "condition-gap-matrix"
      }
    >
      <h2 className="text-lg font-bold">{title}</h2>
      <p>
        Backend state: <strong>{result.state}</strong>
      </p>
      <ul>
        {result.reasonCodes.map((reason) => (
          <li key={reason} title={reason}>
            {reason.toLowerCase().replaceAll("_", " ")}
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-600">
        Research navigation only. Scientific review and safety certification are
        not established.
      </p>
      {section === "rankings" &&
        query.data?.rankings.items?.map((item) => (
          <p key={item.investigation.investigationId}>
            <Link
              href={`/explorer/${item.investigation.slug ?? item.investigation.investigationId}`}
            >
              {item.investigation.psiId}
            </Link>{" "}
            — {item.rationale}
          </p>
        ))}
      {section === "coverage" && (
        <p>
          Records examined: {query.data?.coverage.examinedRuns}. Collection
          traversal:{" "}
          {query.data?.coverage.collectionTraversalComplete
            ? "complete"
            : "incomplete"}
          .
        </p>
      )}
      <Link className="text-blue-800 underline" href={`/explorer?${params}`}>
        Inspect source records in Explorer
      </Link>
    </section>
  );
}
