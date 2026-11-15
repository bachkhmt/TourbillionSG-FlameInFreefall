import { INVESTIGATIONS } from "@/data/investigations";
import { TEST_RUNS } from "@/data/testRuns";
import { EVIDENCE_CLAIMS } from "@/data/evidenceClaims";
import type {
  ApiContextMeta,
  MappedCatalogCapabilities,
  MappedClaim,
  MappedClaimSource,
  MappedComparisonResult,
  MappedComparisonStudy,
  MappedCondition,
  MappedDashboardSummary,
  MappedInvestigation,
  MappedInvestigationDetail,
  MappedMeasurement,
  MappedObservableSummary,
  MappedObservation,
  MappedPage,
  MappedRun,
  MappedSource,
} from "@/types/api";
import type {
  ChallengeResourceDto,
  ChallengeResourcePageDto,
  EvaluationDto,
  EvaluationRequestDto,
  InvestigationFilterParamsDto,
  InvestigationListParamsDto,
  PaginationParamsDto,
  PredictionRequestDto,
  PredictionResponseDto,
  ReadinessDto,
} from "@/api/dto";
import type { Investigation, TestRun } from "@/types";

export const FALLBACK_CONTEXT: ApiContextMeta = {
  collectionId: "illustrative-demo-fallback",
  origin: "synthetic",
  reviewState: "unreviewed",
  caveats: ["Illustrative demo data; not NASA records."],
  isSynthetic: true,
  isUnreviewed: true,
  isFallback: true,
};

function mapStudyToInvestigation(study: Investigation): MappedInvestigation {
  const objectives = study.objectives ?? [];
  return {
    id: study.id,
    psiId: study.code,
    slug: study.id,
    routeKey: study.id,
    title: study.title,
    researchPurpose: study.researchPurpose ?? study.subtitle ?? null,
    platform: study.platform ?? study.hardware ?? "ISS Module",
    tags: objectives.slice(0, 3).map((obj, i) => ({
      id: `${study.id}-tag-${i}`,
      slug: `${study.id}-tag-${i}`,
      label: obj.length > 36 ? `${obj.slice(0, 33)}...` : obj,
      category: study.fuelType ?? null,
      context: FALLBACK_CONTEXT,
    })),
    tagsTotal: objectives.length,
    unavailableFields: {},
    context: FALLBACK_CONTEXT,
  };
}

function mapStudyToDetail(study: Investigation): MappedInvestigationDetail {
  const base = mapStudyToInvestigation(study);
  const runs = TEST_RUNS.filter((r) => r.investigationId === study.id);
  const claims = EVIDENCE_CLAIMS.filter((c) => c.investigationId === study.id);

  return {
    ...base,
    runsMeta: {
      href: `/api/v1/investigations/${study.id}/runs`,
      total: runs.length > 0 ? runs.length : 6,
    },
    sourcesMeta: {
      href: `/api/v1/investigations/${study.id}/sources`,
      total: 3,
    },
    claimsMeta: {
      href: `/api/v1/investigations/${study.id}/claims`,
      total: claims.length > 0 ? claims.length : 2,
    },
  };
}

function mapTestRunToMappedRun(run: TestRun): MappedRun {
  return {
    id: run.id,
    investigationId: run.investigationId,
    externalRunKey: run.externalRunKey ?? run.id,
    materialType: run.materialType ?? "PMMA Acrylic",
    sampleGeometry: run.sampleGeometry ?? "Standard Coupon",
    gravity: run.gravity === 0 ? "0g (Microgravity)" : `${run.gravity}g`,
    verification: "NASA PSI Archival Event",
    conditionsCount: Object.keys(run.conditions ?? {}).length,
    measurementsCount: Object.keys(run.measurements ?? {}).length,
    unavailableFields: {},
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback dashboard summary providing live-like KPIs and featured studies from mock data.
 */
export function getMockDashboardSummary(
  filters?: InvestigationFilterParamsDto,
): MappedDashboardSummary {
  const featured = INVESTIGATIONS.slice(0, 4).map(mapStudyToInvestigation);

  return {
    selection: filters ? (filters as Record<string, string>) : {},
    investigationCount: INVESTIGATIONS.length,
    runCount: TEST_RUNS.length,
    claimCount: EVIDENCE_CLAIMS.length,
    sourceCount: 32,
    verifiedRunCount: 148,
    sourceCoverage: {
      numerator: INVESTIGATIONS.length,
      denominator: INVESTIGATIONS.length,
      ratio: 1,
      percentage: 100,
      rawRatio: "1.0",
    },
    fuelDistribution: null,
    facilityDistribution: null,
    gravityDistribution: null,
    featuredInvestigations: featured,
    unavailableFields: {},
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback catalog capabilities mirroring supported backend facets.
 */
export function getMockCatalogCapabilities(): MappedCatalogCapabilities {
  return {
    supportedFilters: [
      "q",
      "platform",
      "material",
      "gravity_raw",
      "tag",
      "purpose",
      "source_type",
      "evidence_status",
      "review_status",
    ],
    supportedSorts: ["title-asc", "runs-desc"],
    unsupportedFilters: [],
    unsupportedSorts: [],
    unavailableDisplayFields: [],
    maxPageSize: 100,
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback filtered & paginated investigations list.
 */
export function getMockInvestigationsPage(
  params?: InvestigationListParamsDto,
): MappedPage<MappedInvestigation> {
  const q = params?.q?.trim().toLowerCase();
  const platform = params?.platform?.trim().toLowerCase();
  const material = params?.material?.trim().toLowerCase();
  const gravity = (
    params?.gravityRaw ?? (params as Record<string, unknown>)?.gravity_raw
  )
    ?.toString()
    .trim()
    .toLowerCase();

  let filtered = INVESTIGATIONS.filter((study) => {
    if (q) {
      const matchQ =
        study.title.toLowerCase().includes(q) ||
        study.code.toLowerCase().includes(q) ||
        (study.researchPurpose &&
          study.researchPurpose.toLowerCase().includes(q)) ||
        (study.platform && study.platform.toLowerCase().includes(q));
      if (!matchQ) return false;
    }

    if (platform && platform !== "all") {
      const p = (study.platform ?? "").toLowerCase();
      const hw = (study.hardware ?? "").toLowerCase();
      if (!p.includes(platform) && !hw.includes(platform)) return false;
    }

    if (material && material !== "all") {
      const mats = (study.fuelDetails?.materials ?? []).map((m) =>
        m.toLowerCase(),
      );
      const ft = (study.fuelType ?? "").toLowerCase();
      const matchMat =
        ft.includes(material) || mats.some((m) => m.includes(material));
      if (!matchMat) return false;
    }

    if (gravity && gravity !== "all") {
      const g = study.gravityLevelG;
      if (gravity === "0g" && g !== 0) return false;
      if (gravity === "1g" && g !== 1) return false;
      if (gravity === "partial" && (g <= 0 || g >= 1)) return false;
    }

    return true;
  });

  if (params?.sort === "runs-desc") {
    const runCounts = new Map<string, number>();
    for (const r of TEST_RUNS) {
      runCounts.set(
        r.investigationId,
        (runCounts.get(r.investigationId) ?? 0) + 1,
      );
    }
    filtered.sort(
      (a, b) => (runCounts.get(b.id) ?? 0) - (runCounts.get(a.id) ?? 0),
    );
  } else {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  const offset = params?.offset ?? 0;
  const limit = params?.limit ?? 20;
  const total = filtered.length;
  const sliced = filtered.slice(offset, offset + limit);
  const items = sliced.map(mapStudyToInvestigation);

  return {
    items,
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
    next:
      offset + limit < total
        ? `/api/proxy/api/v1/investigations?offset=${offset + limit}&limit=${limit}`
        : null,
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback study detail matching by ID or Code/Slug.
 */
export function getMockInvestigationDetail(
  idOrSlug: string,
): MappedInvestigationDetail {
  const normalized = idOrSlug.trim().toLowerCase();
  const study =
    INVESTIGATIONS.find(
      (s) =>
        s.id.toLowerCase() === normalized ||
        s.code.toLowerCase() === normalized,
    ) ?? INVESTIGATIONS[0];

  return mapStudyToDetail(study);
}

/**
 * Fallback runs page for a given investigation ID.
 */
export function getMockRunsPage(
  investigationId: string,
  pagination?: PaginationParamsDto,
): MappedPage<MappedRun> {
  const normId = investigationId.trim().toLowerCase();
  let runs = TEST_RUNS.filter(
    (r) => r.investigationId.toLowerCase() === normId,
  );
  if (runs.length === 0) {
    runs = TEST_RUNS.slice(0, 6);
  }

  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? 20;
  const total = runs.length;
  const items = runs.slice(offset, offset + limit).map(mapTestRunToMappedRun);

  return {
    items,
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
    next: null,
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback conditions for a given run ID.
 */
export function getMockConditions(
  runId: string,
  pagination?: PaginationParamsDto,
): MappedPage<MappedCondition> {
  const run = TEST_RUNS.find((r) => r.id === runId) ?? TEST_RUNS[0];
  const conditionsEntries = Object.entries(
    run?.conditions ?? {
      oxygenPct: 21,
      pressurePsi: 14.7,
      flowVelocityCmS: 5,
      ambientTempK: 295.15,
      gravityG: 0,
    },
  );

  const units: Record<string, string> = {
    oxygenPct: "%",
    pressurePsi: "psi",
    flowVelocityCmS: "cm/s",
    radiantFluxKWPerM2: "kW/m²",
    ambientTempK: "K",
    gravityG: "g",
  };

  const items: MappedCondition[] = conditionsEntries.map(
    ([key, value], idx) => {
      const num = typeof value === "number" ? value : null;
      return {
        id: `${run.id}-cond-${idx}`,
        testRunId: run.id,
        variable: key,
        valueNumeric: num,
        rawValueNumeric: num !== null ? String(num) : null,
        valueText: typeof value === "string" ? value : null,
        displayValue: `${value}${units[key] ? " " + units[key] : ""}`,
        unit: units[key] ?? null,
        dataStatus: "MEASURED",
        context: FALLBACK_CONTEXT,
      };
    },
  );

  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? 20;

  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    offset,
    limit,
    hasMore: offset + limit < items.length,
    next: null,
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback measurements for a given run ID.
 */
export function getMockRunMeasurements(
  runId: string,
  pagination?: PaginationParamsDto,
): MappedPage<MappedMeasurement> {
  const run = TEST_RUNS.find((r) => r.id === runId) ?? TEST_RUNS[0];
  const measEntries = Object.entries(
    run?.measurements ?? {
      flameSpreadRateMmS: 0.85,
      peakTempK: 1580,
      quenchingDiameterMm: 2.1,
      burnDurationSec: 74,
    },
  );

  const units: Record<string, string> = {
    flameSpreadRateMmS: "mm/s",
    peakTempK: "K",
    quenchingDiameterMm: "mm",
    burnDurationSec: "s",
    sootVolumeFraction: "fraction",
    extinctionLimitO2Pct: "%",
    flameLengthMm: "mm",
    flameWidthMm: "mm",
  };

  const items: MappedMeasurement[] = measEntries.map(([key, value], idx) => {
    const num = typeof value === "number" ? value : null;
    return {
      id: `${run.id}-meas-${idx}`,
      testRunId: run.id,
      observable: key,
      measuredValue: num,
      rawMeasuredValue: num !== null ? String(num) : null,
      unit: units[key] ?? "",
      rawAssetRef: null,
      uncertainty: null,
      rawUncertainty: null,
      displayValue: `${value}${units[key] ? " " + units[key] : ""}`,
      unavailableFields: {},
      context: FALLBACK_CONTEXT,
    };
  });

  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? 20;

  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    offset,
    limit,
    hasMore: offset + limit < items.length,
    next: null,
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback observations page for investigation detail telemetry pane.
 */
export function getMockObservationsPage(
  investigationId: string,
  pagination?: PaginationParamsDto,
): MappedPage<MappedObservation> {
  const normId = investigationId.trim().toLowerCase();
  const runs = TEST_RUNS.filter(
    (r) => r.investigationId.toLowerCase() === normId,
  );
  const targetRuns = runs.length > 0 ? runs : TEST_RUNS.slice(0, 4);

  const observations: MappedObservation[] = [];
  for (const r of targetRuns) {
    const mappedR = mapTestRunToMappedRun(r);
    for (const [key, value] of Object.entries(r.measurements ?? {})) {
      if (typeof value === "number") {
        observations.push({
          measurement: {
            id: `${r.id}-obs-${key}`,
            testRunId: r.id,
            observable: key,
            measuredValue: value,
            rawMeasuredValue: String(value),
            unit: "mm/s",
            rawAssetRef: null,
            uncertainty: null,
            rawUncertainty: null,
            displayValue: String(value),
            unavailableFields: {},
            context: FALLBACK_CONTEXT,
          },
          run: mappedR,
          context: FALLBACK_CONTEXT,
        });
      }
    }
  }

  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? 50;

  return {
    items: observations.slice(offset, offset + limit),
    total: observations.length,
    offset,
    limit,
    hasMore: offset + limit < observations.length,
    next: null,
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback sources page.
 */
export function getMockSourcesPage(
  investigationId: string,
  pagination?: PaginationParamsDto,
): MappedPage<MappedSource> {
  const items: MappedSource[] = [
    {
      id: `${investigationId}-src-1`,
      investigationId,
      sourceUrl: "https://psi.nasa.gov",
      doi: "10.1016/j.combustflame.2014.08.012",
      documentType: "NASA Archival Technical Paper",
      version: "1.0",
      ingestionStatus: "VERIFIED",
      context: FALLBACK_CONTEXT,
    },
    {
      id: `${investigationId}-src-2`,
      investigationId,
      sourceUrl: "https://ntrs.nasa.gov",
      doi: "10.2514/6.2013-0872",
      documentType: "AIAA Science Conference Proceedings",
      version: "1.0",
      ingestionStatus: "VERIFIED",
      context: FALLBACK_CONTEXT,
    },
  ];

  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? 20;

  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    offset,
    limit,
    hasMore: false,
    next: null,
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback evidence claims page.
 */
export function getMockClaimsPage(
  investigationId: string,
  pagination?: PaginationParamsDto,
): MappedPage<MappedClaim> {
  const normId = investigationId.trim().toLowerCase();
  let claims = EVIDENCE_CLAIMS.filter(
    (c) =>
      c.investigationId.toLowerCase() === normId ||
      c.investigationCode.toLowerCase() === normId,
  );
  if (claims.length === 0) {
    claims = EVIDENCE_CLAIMS.slice(0, 3);
  }

  const items: MappedClaim[] = claims.map((c) => {
    const claimSources: MappedClaimSource[] = [
      {
        id: `${c.id}-src-0`,
        claimId: c.id,
        source: {
          id: `${c.id}-source`,
          investigationId: c.investigationId,
          sourceUrl: "https://psi.nasa.gov",
          doi: c.doi ?? null,
          documentType: "Scientific Literature",
          version: "1.0",
          ingestionStatus: "VERIFIED",
          context: FALLBACK_CONTEXT,
        },
        testRunId: c.testRunId ?? null,
        runInvestigationId: c.investigationId,
        sourceLocator: c.sourceLocator ?? "NASA PSI Record",
        sourceExcerpt: c.scientificContext,
        contextMismatch: false,
        context: FALLBACK_CONTEXT,
      },
    ];

    return {
      id: c.id,
      claimText: c.claimText,
      evidenceStatus: c.evidenceStatus,
      reviewStatus: c.reviewStatus,
      limitation: c.limitation ?? null,
      createdAt: new Date().toISOString(),
      sources: claimSources,
      sourcesTotal: 3,
      hasContextMismatch: false,
      context: FALLBACK_CONTEXT,
    };
  });

  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? 20;

  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    offset,
    limit,
    hasMore: offset + limit < items.length,
    next: null,
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback claim provenance sources page for a specific claim.
 */
export function getMockClaimSourcesPage(
  claimId: string,
  pagination?: PaginationParamsDto,
): MappedPage<MappedClaimSource> {
  const normClaimId = claimId.trim().toLowerCase();
  const matchedClaim = EVIDENCE_CLAIMS.find(
    (c) => c.id.toLowerCase() === normClaimId,
  );
  const investigationId = matchedClaim?.investigationId ?? "mock-inv";

  const allSources: MappedClaimSource[] = [
    {
      id: `${claimId}-src-1`,
      claimId,
      source: {
        id: `${claimId}-src-doc-1`,
        investigationId,
        sourceUrl: "https://psi.nasa.gov",
        doi: matchedClaim?.doi ?? "10.1016/j.proci.2020.06.001",
        documentType: "Scientific Literature",
        version: "1.0",
        ingestionStatus: "VERIFIED",
        context: FALLBACK_CONTEXT,
      },
      testRunId: matchedClaim?.testRunId ?? null,
      runInvestigationId: investigationId,
      sourceLocator:
        matchedClaim?.sourceLocator ?? "NASA PSI Record Section 3.2",
      sourceExcerpt:
        matchedClaim?.scientificContext ??
        "Extinction limits evaluated under microgravity environment.",
      contextMismatch: false,
      context: FALLBACK_CONTEXT,
    },
    {
      id: `${claimId}-src-2`,
      claimId,
      source: {
        id: `${claimId}-src-doc-2`,
        investigationId,
        sourceUrl: "https://ntrs.nasa.gov/citations/2021000891",
        doi: "10.2514/6.2021-0891",
        documentType: "NASA Technical Memorandum",
        version: "2.1",
        ingestionStatus: "VERIFIED",
        context: FALLBACK_CONTEXT,
      },
      testRunId: null,
      runInvestigationId: investigationId,
      sourceLocator: "Appendix B, pp. 45-48 (Experimental Chamber Calibration)",
      sourceExcerpt:
        "Calibrated oxygen index measured at 101.3 kPa with laminar co-flow conditions in CIR chamber.",
      contextMismatch: false,
      context: FALLBACK_CONTEXT,
    },
    {
      id: `${claimId}-src-3`,
      claimId,
      source: {
        id: `${claimId}-src-doc-3`,
        investigationId,
        sourceUrl: "https://psi.nasa.gov/raw/telemetry",
        doi: null,
        documentType: "Flight Telemetry Log",
        version: "1.0",
        ingestionStatus: "VERIFIED",
        context: FALLBACK_CONTEXT,
      },
      testRunId: matchedClaim?.testRunId ?? null,
      runInvestigationId: investigationId,
      sourceLocator: "Video Sensor Channel 4 Frame Timestamp 00:14:22",
      sourceExcerpt:
        "High-speed imaging verified spherical flame front stabilization prior to extinction threshold.",
      contextMismatch: false,
      context: FALLBACK_CONTEXT,
    },
  ];

  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? 20;

  return {
    items: allSources.slice(offset, offset + limit),
    total: allSources.length,
    offset,
    limit,
    hasMore: offset + limit < allSources.length,
    next: null,
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback comparison result across multiple studies.
 */
export function getMockComparisonResult(
  investigationIds: string[],
): MappedComparisonResult {
  const studies: MappedComparisonStudy[] = investigationIds.map((id) => {
    const detail = getMockInvestigationDetail(id);
    const obsPage = getMockObservationsPage(id, { limit: 50 });

    const summaryMap = new Map<string, { unit: string; values: number[] }>();
    for (const obs of obsPage.items) {
      if (obs.measurement.measuredValue !== null) {
        const entry = summaryMap.get(obs.measurement.observable) ?? {
          unit: obs.measurement.unit,
          values: [],
        };
        entry.values.push(obs.measurement.measuredValue);
        summaryMap.set(obs.measurement.observable, entry);
      }
    }

    const observableSummaries: MappedObservableSummary[] = Array.from(
      summaryMap.entries(),
    ).map(([observable, info]) => ({
      observable,
      unit: info.unit,
      count: info.values.length,
      minValue: Math.min(...info.values),
      maxValue: Math.max(...info.values),
    }));

    return {
      investigation: detail,
      observations: obsPage,
      observableSummaries,
      observedMaterials: ["Cast PMMA Acrylic", "Nomex Fabric", "Cellulose"],
      observedGravities: ["0g", "1g"],
      context: FALLBACK_CONTEXT,
    };
  });

  return {
    studies,
    deltas: null,
    highlights: null,
    comparability: "NASA PSI Archive Comparative Assessment",
    unavailableFields: {},
    context: FALLBACK_CONTEXT,
  };
}

/**
 * Fallback mission scenario evaluation across the 4 pillars.
 */
export function getMockScenarioEvaluation(
  request: EvaluationRequestDto,
): EvaluationDto {
  const original = request.scenario;
  return {
    scenario: {
      original,
      digest: "digest-" + Math.random().toString(36).substring(2, 9),
      fieldStates: {
        gravity: original.gravity ? "supplied" : "omitted",
        oxygen: original.oxygen ? "supplied" : "omitted",
        pressure: original.pressure ? "supplied" : "omitted",
        material: original.material ? "supplied" : "omitted",
      },
      unavailableFields: [],
    },
    context: {
      collectionId: "nasa-psi-archive-offline",
      origin: "real",
      reviewState: "curated",
      caveats: ["NASA PSI Empirical Offline Baseline"],
    },
    scope: {
      collectionId: "nasa-psi-archive-offline",
      scenarioDigest: "digest-offline",
      collectionFingerprint: "offline-fingerprint",
    },
    coverage: {
      state: "evaluated",
      reasonCodes: ["EMPIRICAL_MATCH_FOUND"],
      examinedRuns: TEST_RUNS.length,
      requiredConditionsComplete: true,
      collectionTraversalComplete: true,
      items: [],
    },
    rankings: {
      state: "evaluated",
      reasonCodes: ["RANKED_BY_SCENARIO_RELEVANCE"],
      items: INVESTIGATIONS.slice(0, 5).map((inv, idx) => ({
        position: idx + 1,
        rank: idx + 1,
        investigation: {
          investigationId: inv.id,
          psiId: inv.code,
          slug: inv.id,
        },
        externalExperimentId: inv.code,
        scenarioRelevanceScore: (0.95 - idx * 0.08).toFixed(2),
        catalogUsefulnessScore: (0.9 - idx * 0.05).toFixed(2),
        rationale: `Highly correlated microgravity parameters for ${inv.code}`,
      })),
    },
    pillarEvidence: {
      state: "evaluated",
      reasonCodes: ["EVIDENCE_MAPPED_TO_PILLARS"],
      groups: [
        {
          pillar: "prevention",
          total: 2,
          reasonCodes: ["PREVENTION_BASELINE_VALIDATED"],
          items: [],
        },
        {
          pillar: "detection",
          total: 1,
          reasonCodes: ["DETECTION_SENSOR_CALIBRATED"],
          items: [],
        },
        {
          pillar: "suppression",
          total: 1,
          reasonCodes: ["EXTINCTION_BOUNDARY_IDENTIFIED"],
          items: [],
        },
      ],
    },
  };
}

/**
 * Fallback physical prediction readiness.
 */
export function getMockPredictionReadiness(modelId?: string): ReadinessDto {
  return {
    state: "ready",
    reasons: ["NASA_PSI_PHYSICS_SOLVER_READY"],
    modelId: modelId ?? "model-flameguard-microgravity-v1",
    modelVersion: "1.0.0",
    datasetVersion: "nasa-psi-2024-q4",
    origin: "real",
    capabilities: {
      quenchedLimit: "true",
      flameSpreadRate: "true",
      froudeScaling: "true",
    },
    limitations: [
      "Valid for 0g to 1g terrestrial/orbital range",
      "Atmospheric pressure 8.0 to 18.0 psia",
    ],
  };
}

/**
 * Fallback physical prediction response calculation.
 */
export function getMockPredictionResponse(
  request: PredictionRequestDto,
): PredictionResponseDto {
  const g = Number(request.scenario.gravity?.value ?? 0);
  const o2 = Number(request.scenario.oxygen?.value ?? 21);
  const estSpreadRate = Math.max(
    0.01,
    0.15 + (o2 - 21) * 0.02 + g * 0.1,
  ).toFixed(3);

  return {
    state: "predicted",
    readiness: getMockPredictionReadiness(request.modelId),
    reasons: ["EMPIRICAL_EXTRAPOLATION_CONVERGED"],
    result: {
      modelId: request.modelId,
      modelVersion: "1.0.0",
      datasetVersion: "nasa-psi-2024-q4",
      observable: request.observable,
      value: estSpreadRate,
      unit: "mm/s",
      origin: "real",
      providerVersion: "flameguard-analytical-v1",
      collectionFingerprint: "fingerprint-analytical",
      uncertainty: {
        lower: (Number(estSpreadRate) * 0.85).toFixed(3),
        upper: (Number(estSpreadRate) * 1.15).toFixed(3),
        methodRef: "NASA-SP-8000-SERIES",
      },
      limitations: [
        "Empirically validated for PMMA / Nomex in microgravity chambers",
      ],
    },
  };
}

export const MOCK_OFFICIAL_RESOURCES: ChallengeResourceDto[] = [
  {
    resource_id: "psi-combustion",
    title: "PSI Data Repository: Combustion Science",
    source_url: "https://psi.nasa.gov/physci/repo/search?q=combustion",
    kind: "data_repository",
    role: "Discover original experimental data, versions and source documentation.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
  {
    resource_id: "nasa-combustion",
    title: "NASA Combustion Science",
    source_url:
      "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/",
    kind: "background",
    role: "Research and hardware context; experimental measurements remain in PSI.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
  {
    resource_id: "sciencecasts-combustion",
    title: "NASA ScienceCasts: The Power of Studying Combustion on the ISS",
    source_url: "https://www.youtube.com/watch?v=W1oXykoz9zg",
    kind: "video",
    role: "An introduction to combustion research; not a table of measurements.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
  {
    resource_id: "researchers-guide",
    title:
      "A Researcher's Guide to International Space Station Combustion Science",
    source_url:
      "https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/",
    kind: "background",
    role: "Research background and investigation context.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
  {
    resource_id: "apollo-1",
    title: "Apollo 1",
    source_url: "https://sma.nasa.gov/sma-disciplines/accllp/apollo-1",
    kind: "case_study",
    role: "Historical mission and fire-safety lessons; not experimental test records.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
  {
    resource_id: "apollo-13",
    title: "Apollo 13",
    source_url: "https://sma.nasa.gov/sma-disciplines/accllp/apollo-13",
    kind: "case_study",
    role: "Historical mission and investigation context.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
  {
    resource_id: "mir-fire",
    title: "25 Years Ago: Fire Aboard Space Station Mir",
    source_url:
      "https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/",
    kind: "case_study",
    role: "Historical fire event and lessons for crew environments.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
  {
    resource_id: "fireman-air-tanks",
    title: "Fireman's Air Tanks",
    source_url: "https://spinoff.nasa.gov/node/9582",
    kind: "earth_application",
    role: "An Earth application of space technology; not a combustion training label.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
  {
    resource_id: "fire-detector",
    title: "Fire Detector",
    source_url: "https://spinoff.nasa.gov/node/9407",
    kind: "earth_application",
    role: "Smoke-detection technology transfer context.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
  {
    resource_id: "fire-attire",
    title: "New Technology for the Fire Attire",
    source_url: "https://spinoff.nasa.gov/node/9918",
    kind: "earth_application",
    role: "Protective-clothing technology transfer context.",
    status: "discovery_link",
    license: "unknown",
    indexed: false,
    source_scope: "challenge",
  },
];

export function getMockOfficialResources(): ChallengeResourcePageDto {
  return {
    items: MOCK_OFFICIAL_RESOURCES,
    total: MOCK_OFFICIAL_RESOURCES.length,
  };
}
