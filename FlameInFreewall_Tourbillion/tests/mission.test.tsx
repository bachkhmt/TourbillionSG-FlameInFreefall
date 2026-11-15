import React, { act } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent, waitFor, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  ScenarioConfigForm,
  ConditionGapMatrix,
  RankedEvidenceList,
  PredictiveLabPanel,
} from "@/features/mission";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { renderWithQuery, createTestQueryClient } from "./test-utils";
import {
  evaluateMissionScenario,
  getPredictionReadiness,
} from "@/api/services";
import { useScenarioEvaluationQuery } from "@/features/mission/hooks/useScenarioQueries";
import type { EvaluationDto, EvaluationRequestDto } from "@/api/dto";

vi.mock("@/api/services", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  evaluateMissionScenario: vi.fn(),
  getPredictionReadiness: vi.fn(),
}));
const evaluation: EvaluationDto = {
  scenario: {
    original: {},
    digest: "test-only",
    fieldStates: {},
    unavailableFields: [],
  },
  context: {
    collectionId: "TEST_ONLY",
    origin: "real",
    reviewState: "unreviewed",
    caveats: [],
  },
  scope: {},
  coverage: {
    state: "unavailable",
    reasonCodes: ["SCIENTIFIC_REVIEW_NOT_ACCEPTED"],
    examinedRuns: 0,
    requiredConditionsComplete: null,
    collectionTraversalComplete: false,
  },
  rankings: {
    state: "unavailable",
    reasonCodes: ["RANKING_PROVIDER_UNAVAILABLE"],
  },
  pillarEvidence: {
    state: "unavailable",
    reasonCodes: ["CLASSIFICATION_UNAVAILABLE"],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.getState().resetWorkspace();
  vi.mocked(evaluateMissionScenario).mockResolvedValue(evaluation);
  vi.mocked(getPredictionReadiness).mockResolvedValue({
    state: "not_ready",
    reasons: ["model_selection_required"],
    modelId: null,
    modelVersion: null,
  });
});

describe("Mission displays backend evidence states", () => {
  it("keeps scenario controls and calculates input partial pressure without a safety classification", () => {
    renderWithQuery(<ScenarioConfigForm />);
    expect(screen.getByTestId("badge-ppo2").textContent).toContain("3.09 psia");
    expect(screen.getByTestId("badge-ppo2").textContent).toContain(
      "not a safety assessment",
    );
    fireEvent.change(screen.getByTestId("slider-oxygen"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByTestId("slider-pressure"), {
      target: { value: "10.2" },
    });
    expect(screen.getByTestId("badge-ppo2").textContent).toContain("3.06 psia");
  });
  it("loads an illustrative lunar preset as user input", () => {
    renderWithQuery(<ScenarioConfigForm />);
    fireEvent.click(screen.getByTestId("preset-artemis-lunar-base"));
    expect(useWorkspaceStore.getState().activeScenario.gravity).toBe(0.16);
  });
  it("shows real unavailable coverage, reasons and scenario filters", async () => {
    renderWithQuery(<ConditionGapMatrix />);
    await screen.findByText("scientific review not accepted");
    expect(screen.getByTestId("condition-gap-matrix").textContent).toContain(
      "unavailable",
    );
    const link = screen.getByRole("link", { name: /Inspect source records/ });
    expect(link.getAttribute("href")).toContain("material=PMMA");
    expect(link.getAttribute("href")).toContain("gravityRaw=microgravity");
    expect(
      screen.queryByText(/Matched PSI Runs|VERIFIED|100% Match/),
    ).toBeNull();
  });
  it("shows backend ranking reason without an invented replacement list", async () => {
    renderWithQuery(<RankedEvidenceList />);
    await screen.findByText("ranking provider unavailable");
    expect(
      screen.queryByText(/tested PMMA directly|SoFIE|100% Match/),
    ).toBeNull();
  });
  it("sends updated airflow and every scenario input to the backend", async () => {
    renderWithQuery(<ConditionGapMatrix />);
    await waitFor(() =>
      expect(evaluateMissionScenario).toHaveBeenCalledTimes(1),
    );
    act(() =>
      useWorkspaceStore.getState().updateActiveScenario({ airflowVelocity: 9 }),
    );
    await waitFor(() =>
      expect(evaluateMissionScenario).toHaveBeenCalledTimes(2),
    );
    expect(
      vi.mocked(evaluateMissionScenario).mock.calls[1][0].scenario.airflow
        ?.value,
    ).toBe("9");
  });
  it("surfaces evaluation failure and supports retry", async () => {
    vi.mocked(evaluateMissionScenario).mockRejectedValueOnce(
      new Error("Network unavailable"),
    );
    renderWithQuery(<RankedEvidenceList />);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByText("ranking provider unavailable");
  });
  it("renders readiness without generated predictions", async () => {
    renderWithQuery(<PredictiveLabPanel />);
    await screen.findByText(/No validated model/);
    expect(screen.getByTestId("model-status-badge").textContent).toContain(
      "not_ready",
    );
    expect(screen.getByText("model selection required")).toBeDefined();
    expect(
      screen.queryByText(/MODEL ONLINE|NASA-PSI-SPM|95% CI|0.23/),
    ).toBeNull();
  });
  it("surfaces readiness error instead of a mock model", async () => {
    vi.mocked(getPredictionReadiness).mockRejectedValue(
      new Error("Readiness unavailable"),
    );
    renderWithQuery(<PredictiveLabPanel />);
    await screen.findByRole("alert");
    expect(screen.queryByText(/No validated model/)).toBeNull();
  });
  it("keeps differing request meaning, pillar, pages, bindings and null state in separate cache entries", async () => {
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(
      ({ request }: { request: EvaluationRequestDto }) =>
        useScenarioEvaluationQuery(request),
      { initialProps: { request: { scenario: {} } }, wrapper },
    );
    await waitFor(() =>
      expect(evaluateMissionScenario).toHaveBeenCalledTimes(1),
    );
    const variants: EvaluationRequestDto[] = [
      { scenario: { material: null } },
      { scenario: {}, pillar: "detection" },
      { scenario: {}, pages: { limit: 5 } },
      { scenario: {}, expectedBindings: { collectionId: "another" } },
      {
        scenario: {
          oxygen: {
            value: "21",
            unit: "%",
            meaning: "oxidizer_oxygen_fraction_percent",
          },
        },
      },
    ];
    for (const [index, request] of variants.entries()) {
      rerender({ request });
      await waitFor(() =>
        expect(evaluateMissionScenario).toHaveBeenCalledTimes(index + 2),
      );
    }
  });
});

it('renders an evaluated ranking only from the backend items and rationale', async () => {
  vi.mocked(evaluateMissionScenario).mockResolvedValue({ ...evaluation, rankings: { state: 'evaluated', reasonCodes: [], items: [{ position: 1, rank: 1, investigation: { investigationId: 'TEST_ONLY', psiId: 'PSI-TEST', slug: 'test-source' }, externalExperimentId: 'TEST_ONLY', scenarioRelevanceScore: '0.5', catalogUsefulnessScore: null, rationale: 'TEST_ONLY backend rationale.' }] } });
  renderWithQuery(<RankedEvidenceList />);
  await screen.findByText('TEST_ONLY backend rationale.', { exact: false });
  expect(screen.getByRole('link', { name: 'PSI-TEST' }).getAttribute('href')).toBe('/explorer/test-source');
  expect(screen.queryByText(/100% Match|verified/i)).toBeNull();
});

it('shows declared model identity when readiness is ready without computing a prediction', async () => {
  vi.mocked(getPredictionReadiness).mockResolvedValue({ state: 'ready', reasons: [], modelId: 'TEST_ONLY_DECLARED_MODEL', modelVersion: 'test-revision' });
  renderWithQuery(<PredictiveLabPanel />);
  await screen.findByText(/TEST_ONLY_DECLARED_MODEL/);
  expect(screen.getByTestId('model-status-badge').textContent).toContain('ready');
  expect(screen.queryByText(/Predicted Spread Rate|95% CI/)).toBeNull();
});

it('does not fabricate coverage for a partial-gravity scenario', async () => {
  useWorkspaceStore.getState().updateActiveScenario({ gravity: .38, material: 'Nomex' });
  renderWithQuery(<ConditionGapMatrix />);
  await screen.findByText('scientific review not accepted');
  expect(vi.mocked(evaluateMissionScenario).mock.calls[0][0].scenario.gravity?.value).toBe('0.38');
  expect(screen.getByRole('link', { name: /Inspect source records/ }).getAttribute('href')).toContain('gravityRaw=0.38g');
  expect(screen.queryByText(/Matched PSI Runs|SUPPORTED/)).toBeNull();
});
