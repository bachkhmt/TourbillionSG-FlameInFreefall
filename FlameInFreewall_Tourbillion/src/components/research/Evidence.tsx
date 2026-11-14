"use client";

import type { CitedText, Pillar, Study } from "@/lib/workspace-api";
import { SourceLink } from "./Shared";

export const PILLARS: Pillar[] = ["prevention", "detection", "suppression"];

export function PillarBadges({ pillars = [] }: { pillars?: Pillar[] }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Research purposes">
      {pillars.map((pillar) => (
        <span
          key={pillar}
          className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-blue-800"
        >
          {pillar}
        </span>
      ))}
    </div>
  );
}

export function CitedPassages({
  passages = [],
  compact = false,
}: {
  passages?: CitedText[];
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {passages.map((passage, i) => (
        <div key={`${passage.sourceId}-${passage.locator}-${i}`}>
          <p
            className={`whitespace-pre-wrap text-sm leading-7 text-slate-600 ${compact ? "line-clamp-3" : ""}`}
          >
            {passage.text}
          </p>
          <SourceLink id={passage.sourceId} label={passage.locator} />
        </div>
      ))}
    </div>
  );
}

export function StudyContext({ study }: { study: Study }) {
  const coverage = study.evidenceCoverage;
  const hasCoverage =
    coverage &&
    [coverage.records, coverage.documents, coverage.reviewed].every(
      (count) =>
        typeof count === "number" && Number.isFinite(count) && count >= 0,
    );
  const classification = study.classification;
  const hasClassification =
    classification &&
    typeof classification.basis === "string" &&
    typeof classification.policyVersion === "string" &&
    Array.isArray(classification.evidence);
  return (
    <div className="space-y-4">
      <PillarBadges pillars={study.pillars} />
      <CitedPassages passages={study.summary} />
      {!!study.objectives?.length && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold">Experimental objectives</h3>
          <CitedPassages passages={study.objectives} />
        </section>
      )}
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-400">Sample or burner geometry</dt>
          <dd className="mt-1">
            {study.sampleGeometry || "Not normalized in this release"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">
            Sensors / measurement types
          </dt>
          <dd className="mt-1">
            {study.sensors?.join(" · ") || "Not normalized in this release"}
          </dd>
        </div>
      </dl>
      {!!(study.geometryEvidence?.length || study.sensorEvidence?.length) && (
        <details className="text-xs leading-6 text-slate-500">
          <summary className="cursor-pointer font-semibold">
            Geometry and measurement provenance
          </summary>
          <CitedPassages
            passages={[
              ...(study.geometryEvidence ?? []),
              ...(study.sensorEvidence ?? []),
            ]}
          />
        </details>
      )}
      {hasCoverage && (
        <p className="text-xs leading-6 text-slate-500">
          Evidence available: {coverage.records} records · {coverage.documents}{" "}
          documents · {coverage.reviewed} independently reviewed records.
        </p>
      )}
      {!!study.limitations?.length && (
        <div className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">
          {study.limitations.map((limitation) => (
            <p key={limitation}>{limitation}</p>
          ))}
        </div>
      )}
      {hasClassification && (
        <details className="text-xs leading-6 text-slate-500">
          <summary className="cursor-pointer font-semibold">
            Research classification provenance
          </summary>
          <p>
            {classification.basis.replaceAll("_", " ")} ·{" "}
            {classification.policyVersion}. Navigation annotations do not
            establish scientific review.
          </p>
          <CitedPassages passages={classification.evidence} />
        </details>
      )}
    </div>
  );
}
