"use client";
import React from "react";
import {
  useDescriptiveQuery,
  type CountBin,
  type ConditionPoint,
} from "@/api/services/evidenceNavigation";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
import type { MappedDashboardSummary } from "@/types/api";
export interface DomainBreakdownProps {
  summary?: MappedDashboardSummary;
}

export function RecordBars({
  title,
  bins,
  denominator,
  missing,
  source,
}: {
  title: string;
  bins: CountBin[];
  denominator: number;
  missing: number;
  source: string;
}) {
  const ranked = [...bins].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
  const shown =
    ranked.length > 12
      ? [
          ...ranked.slice(0, 11),
          {
            label: "Other recorded values",
            count: ranked.slice(11).reduce((sum, bin) => sum + bin.count, 0),
          },
        ]
      : ranked;
  const max = Math.max(1, ...shown.map((bin) => bin.count));
  return (
    <figure className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
      <figcaption className="font-bold">{title}</figcaption>
      <svg
        role="img"
        aria-label={title}
        viewBox={`0 0 560 ${shown.length * 26 + 12}`}
        className="w-full"
      >
        {shown.map((bin, index) => (
          <g key={bin.label} transform={`translate(0,${index * 26})`}>
            <title>
              {bin.label}: {bin.count} source records
            </title>
            <text x="0" y="16" fontSize="11">
              {bin.label.length > 27 ? bin.label.slice(0, 24) + "…" : bin.label}
            </text>
            <rect
              x="190"
              y="3"
              width={(bin.count / max) * 310}
              height="17"
              rx="4"
              fill="#0B2374"
            />
            <text x="510" y="16" fontSize="11">
              {bin.count}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-slate-600">
        {denominator.toLocaleString("en-US")} source records · {missing} missing
        or unknown. {source}
      </p>
    </figure>
  );
}

function ConditionMap({
  points,
  title,
  ambient,
}: {
  points: ConditionPoint[];
  title: string;
  ambient: boolean;
}) {
  const maxX = Math.max(40, ...points.map((p) => Number(p.oxygenPct)));
  const maxY = Math.max(16, ...points.map((p) => Number(p.pressurePsi)));
  const x = (n: number) => 50 + (n / maxX) * 480;
  const y = (n: number) => 270 - (n / maxY) * 220;
  return (
    <figure className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
      <figcaption className="font-bold">{title}</figcaption>
      <svg
        role="img"
        aria-label={title}
        viewBox="0 0 580 320"
        className="w-full"
      >
        {ambient && (
          <>
            <rect
              x={x(30)}
              y={y(10.2)}
              width={x(maxX) - x(30)}
              height={270 - y(10.2)}
              fill="#fef3c7"
            />
            <text x={x(30) + 3} y={y(10.2) - 5} fontSize="9">
              Moon Base reference envelope
            </text>
            <circle
              cx={x(21)}
              cy={y(14.7)}
              r="5"
              fill="none"
              stroke="#b45309"
            />
            <text x={x(21) + 6} y={y(14.7)} fontSize="9">
              ISS reference
            </text>
          </>
        )}
        <path d="M50 40V270H540" fill="none" stroke="#64748b" />
        {[0, 10, 20, 30, 40]
          .filter((t) => t <= maxX)
          .map((t) => (
            <text key={t} x={x(t)} y="286" fontSize="10">
              {t}
            </text>
          ))}
        {[0, 4, 8, 12, 16]
          .filter((t) => t <= maxY)
          .map((t) => (
            <text key={t} x="23" y={y(t)} fontSize="10">
              {t}
            </text>
          ))}
        {points.map((point) => {
          const color = `hsl(${[...(point.slug ?? "")].reduce((n, c) => n + c.charCodeAt(0), 0) % 360} 60% 36%)`;
          const label = `${point.slug}: ${point.oxygenPct} ${point.oxygenBasis}; ${point.pressurePsi} psia; ${point.oxygenMeaning}; ${point.runId}`;
          return point.oxygenBasis === "mole_percent" ? (
            <circle
              key={point.runId}
              cx={x(Number(point.oxygenPct))}
              cy={y(Number(point.pressurePsi))}
              r="3"
              fill={color}
              opacity=".65"
            >
              <title>{label}</title>
            </circle>
          ) : (
            <rect
              key={point.runId}
              x={x(Number(point.oxygenPct)) - 3}
              y={y(Number(point.pressurePsi)) - 3}
              width="6"
              height="6"
              fill={color}
              opacity=".65"
            >
              <title>{label}</title>
            </rect>
          );
        })}
        <text x="200" y="310" fontSize="11">
          Oxygen percent (basis preserved)
        </text>
        <text x="4" y="24" fontSize="11">
          Pressure (psia)
        </text>
      </svg>
      <p className="text-xs text-slate-600">
        {points.length} records · Circle: mole percent · Square: volume percent.
        Color identifies investigation; hover a point for its record and units.
      </p>
      <p className="text-xs text-slate-600">
        {ambient
          ? "Reference conditions describe atmosphere inputs only; points do not establish habitat coverage or risk. Moon and Mars gravity are not measured here."
          : "Burner-stream and unknown oxygen meanings are kept separate from ambient habitat reference conditions."}
      </p>
    </figure>
  );
}

export const DomainBreakdown: React.FC<DomainBreakdownProps> = ({
  summary,
}) => {
  const query = useDescriptiveQuery(summary?.selection);
  if (query.isLoading)
    return <p role="status">Loading descriptive source-record charts…</p>;
  if (query.isError)
    return (
      <ApiErrorBanner
        title="Unable to load descriptive charts"
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  const data = query.data;
  if (!data) return null;
  const source = `Source: ${data.context.collectionId} · ${data.context.origin} · ${data.context.reviewState}.`;
  return (
    <section data-testid="domain-breakdown" className="space-y-4">
      <h2 className="text-xl font-bold">Source-record coverage</h2>
      <p className="text-sm text-slate-600">{data.selectionSemantics}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        <RecordBars
          title="Records by investigation"
          bins={data.investigationDistribution.map((s) => ({
            label: s.slug ?? s.psiId,
            count: s.count,
          }))}
          denominator={data.recordCount}
          missing={0}
          source={source}
        />
        <RecordBars
          title="Records by material"
          bins={data.materialDistribution}
          denominator={data.recordCount}
          missing={data.missingMaterial}
          source={source}
        />
        <RecordBars
          title="Records by gravity regime"
          bins={data.gravityDistribution}
          denominator={data.recordCount}
          missing={data.missingGravity}
          source={source}
        />
      </div>
      <h3 className="text-lg font-bold">Evidence coverage map</h3>
      <p className="text-sm">
        {data.oxygenRecordCount.toLocaleString("en-US")} of{" "}
        {data.recordCount.toLocaleString("en-US")} records have an oxygen value.
        Missing oxygen: {data.missingOxygen}; missing pressure:{" "}
        {data.missingPressure}. {data.recordCount - data.conditionPoints.length}{" "}
        records excluded from the maps; incompatible conditions:{" "}
        {data.incompatibleConditions}.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <ConditionMap
          title="Chamber oxygen and pressure"
          points={data.conditionPoints.filter(
            (p) => p.oxygenMeaning === "chamber",
          )}
          ambient
        />
        <ConditionMap
          title="Burner-stream or unspecified oxygen context"
          points={data.conditionPoints.filter(
            (p) => p.oxygenMeaning !== "chamber",
          )}
          ambient={false}
        />
      </div>
      <p className="text-xs text-slate-600">
        {source} Oxygen bases remain distinct. CFI-G burner oxygen is not
        ambient oxygen; the challenge's upper burner value is not inferred from
        missing data.
      </p>
    </section>
  );
};
