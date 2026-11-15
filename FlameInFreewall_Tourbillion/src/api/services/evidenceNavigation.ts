import { apiGet, type QueryParams } from "@/api/client";
import type { ContextDto } from "@/api/dto";
import { useQuery } from "@tanstack/react-query";

export interface CountBin {
  label: string;
  count: number;
}
export interface ConditionPoint {
  runId: string;
  investigationId: string;
  slug: string | null;
  oxygenPct: string;
  oxygenBasis: "mole_percent" | "volume_percent";
  pressurePsi: string;
  pressureUnit: "psia";
  oxygenMeaning: "chamber" | "burner_oxidizer_stream" | "unknown";
}
export interface DescriptiveDto {
  selection: Record<string, string>;
  selectionSemantics: string;
  investigationCount: number;
  recordCount: number;
  investigationDistribution: {
    investigationId: string;
    psiId: string;
    slug: string | null;
    title: string;
    count: number;
  }[];
  materialDistribution: CountBin[];
  gravityDistribution: CountBin[];
  missingMaterial: number;
  missingGravity: number;
  missingOxygen: number;
  missingPressure: number;
  oxygenRecordCount: number;
  incompatibleConditions: number;
  conditionPoints: ConditionPoint[];
  platforms: string[];
  gravities: string[];
  context: ContextDto;
}
export interface StudyOverviewDto {
  investigationId: string;
  sourceRevision: string;
  context: ContextDto;
  passages: {
    sourceDocumentId: string;
    sourceUrl: string;
    locator: string;
    text: string;
    section: "objective" | "approach" | "researchImpacts" | "catalog";
  }[];
}
export function useDescriptiveQuery(selection?: QueryParams) {
  return useQuery({
    queryKey: ["api", "catalog", "descriptive", selection ?? {}],
    queryFn: ({ signal }) =>
      apiGet<DescriptiveDto>("/catalog/descriptive", selection, signal),
  });
}
export function useStudyOverviewQuery(id: string) {
  return useQuery({
    queryKey: ["api", "investigation", id, "overview"],
    enabled: Boolean(id),
    queryFn: ({ signal }) =>
      apiGet<StudyOverviewDto>(
        `/investigations/${encodeURIComponent(id)}/overview`,
        undefined,
        signal,
      ),
  });
}
