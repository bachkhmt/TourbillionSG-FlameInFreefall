import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  ResearchDashboard,
  ResearchExplorer,
  ResearchCompare,
} from "@/components/research/Catalog";
import { ResearchDetail } from "@/components/research/Detail";
import { ResearchMission } from "@/components/research/Mission";
import { ResearchResources } from "@/components/research/Resources";
import { useDatasetStore } from "@/store/useDatasetStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { fixtureFetch, liveWorkspace } from "./live-fixtures";
import type { Analysis, Workspace } from "@/lib/workspace-api";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "flex" }),
  usePathname: () => "/dashboard",
}));
const extended = (): Workspace => {
  const data = structuredClone(liveWorkspace);
  data.investigations[0] = {
    ...data.investigations[0],
    pillars: ["suppression"],
    summary: [
      {
        text: "Fixture liquid droplet suppression context.",
        sourceId: "source-table",
        locator: "description",
      },
    ],
    objectives: [
      {
        text: "Fixture extinction objective.",
        sourceId: "source-table",
        locator: "objective",
      },
    ],
    sampleGeometry: "Fixture spherical droplet",
    sensors: ["Fixture camera"],
    limitations: ["Fixture context is not scientific validation."],
    evidenceCoverage: { metadata: true, records: 1, documents: 2, reviewed: 0 },
    classification: {
      basis: "research_navigation",
      policyVersion: "fixture-policy",
      evidence: [
        {
          text: "Fixture classification basis.",
          sourceId: "source-table",
          locator: "researchArea",
        },
      ],
    },
  };
  data.investigations[1].pillars = ["prevention"];
  data.investigations[2].pillars = ["detection"];
  data.resources = [
    {
      id: "psi",
      title: "Fixture PSI resource",
      url: "https://psi.nasa.gov/",
      kind: "data_repository",
      role: "Fixture data source",
      status: "linked",
      license: "unknown",
    },
  ];
  data.telemetryChannels = {
    "run-flex": [
      data.telemetry["run-flex"],
      {
        sourceId: "source-sheet",
        channel: "smoke_count",
        label: "Fixture smoke count",
        unit: "particles/cm³",
        timeUnit: "s",
        timeReference: "Original sensor offset",
        points: [
          { timeSec: -2, value: 200 },
          { timeSec: 1, value: 300 },
        ],
      },
    ],
  };
  return data;
};
beforeEach(() => {
  useWorkspaceStore.getState().resetWorkspace();
  useDatasetStore.setState({ data: extended(), status: "ready", error: null });
});
afterEach(cleanup);

describe("Official resource frontend acceptance", () => {
  it("filters studies by purpose without inventing purpose for historical metadata", () => {
    render(<ResearchExplorer />);
    fireEvent.change(screen.getByLabelText("Research purpose"), {
      target: { value: "detection" },
    });
    expect(screen.getByTestId("live-study-cfi-g")).toBeDefined();
    expect(screen.queryByTestId("live-study-flex")).toBeNull();
    expect(screen.queryByTestId("live-study-flex-2")).toBeNull();
  });

  it("shows source-backed summaries and classification provenance on study detail", () => {
    render(<ResearchDetail studyId="flex" />);
    expect(
      screen.getByText("Fixture liquid droplet suppression context."),
    ).toBeDefined();
    expect(screen.getByText("Fixture extinction objective.")).toBeDefined();
    expect(screen.getByText("Fixture spherical droplet")).toBeDefined();
    fireEvent.click(screen.getByText("Research classification provenance"));
    expect(screen.getByText("Fixture classification basis.")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "researchArea ↗" }),
    ).toBeDefined();
  });

  it("uses imported channel labels and units instead of FLEX labels for another measurement", () => {
    render(<ResearchDetail studyId="flex" />);
    fireEvent.click(screen.getByRole("tab", { name: "Original telemetry" }));
    fireEvent.change(screen.getByLabelText("Measurement channel"), {
      target: { value: "run-flex:smoke_count:source-sheet:1" },
    });
    expect(
      screen.getByRole("img", {
        name: "Original Fixture smoke count (particles/cm³) over time (s)",
      }),
    ).toBeDefined();
    expect(
      screen.getByText("Original Fixture smoke count · FLEX-007"),
    ).toBeDefined();
    expect(screen.getByText("300 particles/cm³")).toBeDefined();
    expect(screen.getByText("-2 s")).toBeDefined();
  });

  it("keeps legacy telemetry available when optional channel fields are absent", () => {
    useDatasetStore.setState({ data: structuredClone(liveWorkspace) });
    render(<ResearchDetail studyId="flex" />);
    fireEvent.click(screen.getByRole("tab", { name: "Original telemetry" }));
    expect(
      screen.getByRole("img", {
        name: "Original droplet diameter (mm) over time (s)",
      }),
    ).toBeDefined();
  });

  it("shows resource import state and unknown rights without treating a link as a dataset", () => {
    render(<ResearchResources />);
    expect(screen.getByText("linked")).toBeDefined();
    expect(screen.getByText("Rights: unknown")).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "Open original resource ↗" })
        .getAttribute("href"),
    ).toBe("https://psi.nasa.gov/");
    fireEvent.change(screen.getByLabelText("Find a resource"), {
      target: { value: "no match" },
    });
    expect(screen.getByText("No resources match this search.")).toBeDefined();
  });

  it("handles an older release with no resource registry", () => {
    useDatasetStore.setState({ data: structuredClone(liveWorkspace) });
    render(<ResearchResources />);
    expect(
      screen.getByText(
        /This historical release does not contain a resource registry/,
      ),
    ).toBeDefined();
  });

  it.each([null, {}])(
    "renders historical study context safely with missing nullable annotations",
    (annotation) => {
      const historical = structuredClone(liveWorkspace);
      historical.investigations[0].classification =
        annotation as (typeof historical.investigations)[0]["classification"];
      historical.investigations[0].evidenceCoverage =
        annotation as (typeof historical.investigations)[0]["evidenceCoverage"];
      useDatasetStore.setState({ data: historical });
      render(<ResearchDetail studyId="flex" />);
      expect(
        screen.getByText(
          "Review status unavailable in this historical release",
        ),
      ).toBeDefined();
      expect(
        screen.queryByText("Research classification provenance"),
      ).toBeNull();
      expect(screen.queryByText(/Evidence available:/)).toBeNull();
    },
  );

  it("distinguishes document-backed zero-record studies from metadata-only historical studies", () => {
    const documents = extended();
    documents.investigations[3].evidenceCoverage = {
      metadata: true,
      documents: 1,
      records: 0,
      reviewed: 0,
    };
    useDatasetStore.setState({ data: documents });
    render(<ResearchDetail studyId="flex-2" />);
    expect(
      screen.getByText(
        /Document or configuration evidence is available; no source records have been imported/,
      ),
    ).toBeDefined();
    expect(screen.queryByText(/Metadata only:/)).toBeNull();
    cleanup();
    useDatasetStore.setState({ data: structuredClone(liveWorkspace) });
    render(<ResearchDetail studyId="flex-2" />);
    expect(
      screen.getByText(/Metadata only: source records have not been imported/),
    ).toBeDefined();
  });

  it("separates research ranking citations from same-record condition coverage", async () => {
    vi.mocked(fetch).mockImplementation((url, init) => {
      if (String(url).includes("/scenarios/analyze"))
        return Promise.resolve({
          ok: true,
          json: async (): Promise<Analysis> => ({
            revision: liveWorkspace.revision,
            exactMatchCount: 0,
            engineVersion: "fixture-match",
            notice: "Conditions remain unknown.",
            candidates: [],
            investigations: [],
            prediction: { available: false, reason: "No model" },
            researchEngineVersion: "fixture-research",
            scoring: "Fixture navigation heuristic.",
            studyRankings: [
              {
                investigationId: "cfi-g",
                pillars: ["detection"],
                relevanceScore: 80,
                reasons: [
                  {
                    text: "Fixture sensor research relevance.",
                    sourceId: "source-sheet",
                    locator: "sensor metadata",
                  },
                ],
                evidenceLevel: "source_checked",
                coverage: {
                  matched: 1,
                  unknown: 3,
                  mismatched: 1,
                  runId: "run-cfi-g",
                  sourceId: "source-table",
                  locator: "CSV row 8",
                },
              },
            ],
          }),
        } as Response);
      return fixtureFetch(url, init);
    });
    render(<ResearchMission />);
    fireEvent.change(screen.getByLabelText("Research purpose"), {
      target: { value: "detection" },
    });
    fireEvent.change(screen.getByLabelText("Mission context"), {
      target: { value: "lunar" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Analyze evidence" }).closest("form")!,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: "Research relevance" }),
      ).toBeDefined(),
    );
    expect(
      screen.getByText("80/100 research relevance · source checked"),
    ).toBeDefined();
    expect(screen.getByText("0 combined exact matches")).toBeDefined();
    expect(screen.getByText("Record: cfi-g-1")).toBeDefined();
    const call = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes("/scenarios/analyze"));
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
      pillar: "detection",
      missionContext: "lunar",
      revision: liveWorkspace.revision,
    });
  });

  it("builds the observed map legend from investigations returned by the API", async () => {
    vi.mocked(fetch).mockImplementation((url, init) =>
      String(url).includes("/evidence-map")
        ? Promise.resolve({
            ok: true,
            json: async () => ({
              points: [
                {
                  runId: "run-bass",
                  investigationId: "bass-ii",
                  label: "Fixture BASS",
                  oxygenPct: 21,
                  pressurePsi: 14.7,
                  sourceId: "source-table",
                  rowNumber: 8,
                },
              ],
            }),
          } as Response)
        : fixtureFetch(url, init),
    );
    render(<ResearchMission />);
    await waitFor(() =>
      expect(screen.getByLabelText("Evidence map legend")).toBeDefined(),
    );
    expect(
      within(screen.getByLabelText("Evidence map legend")).getByText("BASS-II"),
    ).toBeDefined();
    expect(screen.queryByText(/Navy: FLEX/)).toBeNull();
  });

  it("compares geometry, sensors and objectives with source locators", async () => {
    useWorkspaceStore.setState({
      compareList: ["flex", "bass-ii"],
      isComparisonModalOpen: true,
    });
    vi.mocked(fetch).mockImplementation((url, init) =>
      String(url).includes("/compare")
        ? Promise.resolve({
            ok: true,
            json: async () => ({
              investigations: extended().investigations.slice(0, 2),
              notice: "Fixture comparison",
            }),
          } as Response)
        : fixtureFetch(url, init),
    );
    render(<ResearchCompare />);
    await waitFor(() =>
      expect(screen.getByText("Fixture spherical droplet")).toBeDefined(),
    );
    expect(screen.getByText("Fixture camera")).toBeDefined();
    expect(screen.getByText("Fixture extinction objective.")).toBeDefined();
  });

  it("links purpose coverage to filtered research browsing", () => {
    render(<ResearchDashboard />);
    expect(
      screen
        .getByRole("link", { name: /detection 1 related investigations/i })
        .getAttribute("href"),
    ).toBe("/explorer?pillar=detection");
  });
});
