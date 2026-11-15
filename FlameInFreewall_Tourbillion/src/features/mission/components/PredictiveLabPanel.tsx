"use client";
import React from "react";
import { usePredictionReadinessQuery } from "../hooks/usePredictionQueries";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
export interface PredictiveLabPanelProps {
  onSwitchToEvidence?: () => void;
}
export const PredictiveLabPanel: React.FC<PredictiveLabPanelProps> = ({
  onSwitchToEvidence,
}) => {
  const query = usePredictionReadinessQuery();
  if (query.isLoading)
    return <p role="status">Checking prediction readiness…</p>;
  if (query.isError)
    return (
      <ApiErrorBanner
        title="Unable to check prediction readiness"
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  const readiness = query.data;
  if (!readiness) return null;
  return (
    <section
      data-testid="predictive-lab-panel"
      className="rounded-3xl border border-gray-200 bg-white p-6 space-y-4"
    >
      <h2 className="text-lg font-bold">Predictive Lab</h2>
      <p data-testid="model-status-badge">
        Backend state: <strong>{readiness.state}</strong>
      </p>
      <p>
        Model: {readiness.modelId ?? "No validated model"}
        {readiness.modelVersion ? ` · ${readiness.modelVersion}` : ""}
      </p>
      <ul>
        {readiness.reasons.map((reason) => (
          <li key={reason} title={reason}>
            {reason.replaceAll("_", " ")}
          </li>
        ))}
      </ul>
      <h3 className="font-semibold">Requirements before prediction</h3>
      <ul className="list-disc pl-5 text-sm space-y-2">
        <li>Reviewed training and evaluation data.</li>
        <li>A declared model with a supported applicability domain.</li>
        <li>Traceable uncertainty evidence.</li>
      </ul>
      {readiness.limitations?.map((text) => (
        <p key={text}>{text}</p>
      ))}
      <p className="text-sm text-slate-600">
        Research demonstration. No safety verdict is provided.
      </p>
      {onSwitchToEvidence && (
        <button
          className="rounded-xl bg-lime-300 px-4 py-2"
          onClick={onSwitchToEvidence}
        >
          Inspect available evidence
        </button>
      )}
    </section>
  );
};
