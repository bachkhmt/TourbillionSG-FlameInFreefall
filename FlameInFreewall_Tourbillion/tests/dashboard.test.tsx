import React, { act } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import {
  KpiStatCards,
  CuratedStudiesGrid,
  DomainBreakdown,
  QuickScenarioTrigger,
  QUICK_SCENARIOS,
} from "@/features/dashboard";
import DashboardPage from "../src/app/(dashboard)/dashboard/page";
import { useWorkspaceStore } from "../src/store/useWorkspaceStore";
import { toastStore } from "../src/components/toast/toast-store";
import { mapDashboardSummaryDto } from "../src/api/mappers";
import * as apiServices from "../src/api/services";
import { renderWithQuery } from "./test-utils";
import {
  makeContextDto,
  makeDashboardDto,
  makeInvestigationDto,
} from "./fixtures/backendFixtures";

expect.extend({
  toBeInTheDocument(received) {
    const pass = Boolean(received);
    return {
      pass,
      message: () => `expected element ${pass ? "not " : ""}to be in document`,
    };
  },
});

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/api/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/api/services")>();
  return {
    ...actual,
    getDashboardSummary: vi.fn(),
  };
});

describe("Research Dashboard (/dashboard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.getState().resetWorkspace();
    toastStore.clear();
    vi.mocked(apiServices.getDashboardSummary).mockResolvedValue(
      makeDashboardDto(),
    );
  });

  describe("Dashboard Page Query States", () => {
    it("renders loading shimmer while dashboard summary query is pending", () => {
      vi.mocked(apiServices.getDashboardSummary).mockReturnValue(
        new Promise(() => {}),
      );
      renderWithQuery(<DashboardPage />);
      expect(screen.getByTestId("dashboard-shimmer")).toBeInTheDocument();
      expect(
        screen.getByText(/Microgravity Combustion Science/i),
      ).toBeInTheDocument();
    });

    it("renders ApiErrorBanner on failure and retries on button click", async () => {
      vi.mocked(apiServices.getDashboardSummary)
        .mockRejectedValueOnce(new Error("Backend telemetry timeout"))
        .mockResolvedValueOnce(makeDashboardDto());

      renderWithQuery(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("api-error-banner")).toBeInTheDocument();
      });
      expect(
        screen.getByText(/Backend telemetry timeout/i),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

      await waitFor(() => {
        expect(screen.getByTestId("kpi-stat-cards")).toBeInTheDocument();
      });
      expect(apiServices.getDashboardSummary).toHaveBeenCalledTimes(2);
    });

    it("renders live KPI counts, caveats banner, and dynamic explore count on success", async () => {
      renderWithQuery(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("kpi-stat-cards")).toBeInTheDocument();
      });

      expect(
        screen.getByTestId("dashboard-explore-link").textContent,
      ).toContain("Explore 4 Studies");
      expect(
        screen.getByTestId("dashboard-caveats-banner"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("dashboard-caveats-banner").getAttribute("title"),
      ).toContain("SYNTHETIC TEST ONLY");
    });
  });

  describe("KpiStatCards Component", () => {
    it("renders the 5 core telemetry KPI cards with live values and honest null verification", () => {
      const summary = mapDashboardSummaryDto(makeDashboardDto());
      renderWithQuery(<KpiStatCards summary={summary} />);

      expect(screen.getByTestId("kpi-stat-cards")).toBeDefined();
      expect(screen.getByTestId("kpi-studies").textContent).toContain("4");
      expect(screen.getByTestId("kpi-runs").textContent).toContain("4");
      expect(screen.getByTestId("kpi-runs").textContent).toContain(
        "Verification not established",
      );
      expect(screen.getByTestId("kpi-datapoints").textContent).toContain(
        "2 / 4",
      );
      expect(screen.getByTestId("kpi-datapoints").textContent).toContain("50%");
      expect(screen.getByTestId("kpi-claims").textContent).toContain("2");
      expect(screen.getByTestId("kpi-claims").textContent).toContain(
        "3 Sources",
      );
      expect(screen.getByTestId("kpi-gap-alert")).toBeDefined();
    });

    it("displays No denominator when sourceCoverage denominator is 0", () => {
      const summary = mapDashboardSummaryDto(
        makeDashboardDto({
          sourceCoverage: { numerator: 0, denominator: 0, ratio: null },
        }),
      );
      renderWithQuery(<KpiStatCards summary={summary} />);

      expect(screen.getByTestId("kpi-datapoints").textContent).toContain(
        "0 / 0",
      );
      expect(screen.getByTestId("kpi-datapoints").textContent).toContain(
        "No denominator",
      );
    });

    it("displays the Partial Gravity Gap Alert (0 < g < 1) with NASA disclaimer", () => {
      const summary = mapDashboardSummaryDto(makeDashboardDto());
      renderWithQuery(<KpiStatCards summary={summary} />);

      expect(screen.getByText("0 < g < 1")).toBeDefined();
      expect(screen.getByText("Partial-g Knowledge Void")).toBeDefined();
      expect(screen.getByText(/Coverage limitation:/i)).toBeDefined();
    });
  });

  describe("CuratedStudiesGrid Component", () => {
    it("renders featured investigations from backend DTOs with honest metadata and routeKey links", () => {
      const dto = makeDashboardDto({
        featuredInvestigations: [
          makeInvestigationDto({
            id: "e1a75331-3f1f-57b8-9042-405ff61dff51",
            psiId: "SYNTHETIC-PHASE4-1",
            slug: null,
            platform: "TEST_PLATFORM",
          }),
          makeInvestigationDto({
            id: "afa58280-0d0c-58a3-926a-1499a1e20a96",
            psiId: "SYNTHETIC-PHASE4-2",
            slug: "bass-ii",
            platform: null,
          }),
        ],
      });
      const summary = mapDashboardSummaryDto(dto);

      renderWithQuery(
        <CuratedStudiesGrid
          studies={summary.featuredInvestigations}
          totalCount={summary.investigationCount}
          context={summary.context}
        />,
      );

      expect(screen.getByTestId("curated-studies-grid")).toBeDefined();
      expect(screen.getByText("SYNTHETIC-PHASE4-1")).toBeDefined();
      expect(screen.getByText("SYNTHETIC-PHASE4-2")).toBeDefined();
      expect(screen.getByText("TEST_PLATFORM")).toBeDefined();
      expect(screen.getByText("Platform unmapped")).toBeDefined();
      expect(screen.getByText("View all 4 PSI studies")).toBeDefined();

      expect(
        screen
          .getByTestId(
            "view-investigation-e1a75331-3f1f-57b8-9042-405ff61dff51",
          )
          .getAttribute("href"),
      ).toBe("/explorer/e1a75331-3f1f-57b8-9042-405ff61dff51");

      expect(
        screen
          .getByTestId(
            "view-investigation-afa58280-0d0c-58a3-926a-1499a1e20a96",
          )
          .getAttribute("href"),
      ).toBe("/explorer/bass-ii");
    });

    it("applies StructPaper card styling without emerald classes", () => {
      const summary = mapDashboardSummaryDto(makeDashboardDto());
      renderWithQuery(
        <CuratedStudiesGrid
          studies={summary.featuredInvestigations}
          totalCount={summary.investigationCount}
        />,
      );

      const card = screen.getByTestId(
        "study-card-e1a75331-3f1f-57b8-9042-405ff61dff51",
      );
      expect(card.className).toMatch(/rounded-(3xl|\[36px\])/);
      expect(card.className).toContain("cursor-pointer");
      expect(card.innerHTML).not.toContain("emerald");
      expect(card.innerHTML).not.toContain("font-mono");
    });

    it("toggles investigation in compare list and shows dynamic feedback", () => {
      const summary = mapDashboardSummaryDto(makeDashboardDto());
      renderWithQuery(
        <CuratedStudiesGrid
          studies={summary.featuredInvestigations}
          totalCount={summary.investigationCount}
        />,
      );

      const toggleBtn = screen.getByTestId(
        "toggle-compare-e1a75331-3f1f-57b8-9042-405ff61dff51",
      );
      expect(screen.queryByText("In Compare")).toBeNull();

      fireEvent.click(toggleBtn);
      expect(useWorkspaceStore.getState().compareList).toContain(
        "e1a75331-3f1f-57b8-9042-405ff61dff51",
      );
      expect(
        toastStore.getToasts().some((t) => t.title === "Added to Comparison"),
      ).toBe(true);
      expect(screen.getByText("In Compare")).toBeDefined();

      fireEvent.click(toggleBtn);
      expect(useWorkspaceStore.getState().compareList).not.toContain(
        "e1a75331-3f1f-57b8-9042-405ff61dff51",
      );
    });
  });

  describe("DomainBreakdown Component", () => {
    it("shows descriptive charts with missing counts and separate oxygen contexts", () => {
      renderWithQuery(<DomainBreakdown />);
      expect(
        screen.getByRole("img", { name: "Records by material" }),
      ).toBeDefined();
      expect(
        screen.getByRole("img", { name: "Records by gravity regime" }),
      ).toBeDefined();
      expect(
        screen.getByRole("img", { name: "Records by investigation" }),
      ).toBeDefined();
      expect(
        screen.getByText(/2 of 3 records have an oxygen value/),
      ).toBeDefined();
      expect(screen.queryByText("UNSUPPORTED_MAPPING")).toBeNull();
    });
  });

  describe("QuickScenarioTrigger Component", () => {
    it("renders 3 planetary scenario cards (ISS, Moon, Mars)", () => {
      renderWithQuery(<QuickScenarioTrigger />);
      expect(screen.getByTestId("quick-scenario-trigger")).toBeDefined();
      expect(QUICK_SCENARIOS).toHaveLength(3);
      expect(screen.getByTestId("scenario-card-iss-baseline")).toBeDefined();
      expect(
        screen.getByTestId("scenario-card-artemis-lunar-base"),
      ).toBeDefined();
      expect(
        screen.getByTestId("scenario-card-mars-surface-habitat"),
      ).toBeDefined();
    });

    it("clicking Moon Base sets scenario to 0.16g and navigates to /mission", () => {
      renderWithQuery(<QuickScenarioTrigger />);
      fireEvent.click(screen.getByTestId("launch-btn-artemis-lunar-base"));
      const activeScenario = useWorkspaceStore.getState().activeScenario;
      expect(activeScenario.gravity).toBe(0.16);
      expect(activeScenario.oxygenPct).toBe(30.0);
      expect(mockPush).toHaveBeenCalledWith("/mission");
    });

    it("clicking Mars Colony sets scenario to 0.38g and navigates to /mission", () => {
      renderWithQuery(<QuickScenarioTrigger />);
      fireEvent.click(screen.getByTestId("launch-btn-mars-surface-habitat"));
      const activeScenario = useWorkspaceStore.getState().activeScenario;
      expect(activeScenario.gravity).toBe(0.38);
      expect(activeScenario.oxygenPct).toBe(28.0);
      expect(mockPush).toHaveBeenCalledWith("/mission");
    });
  });

  describe("DashboardPage Complete Assembly", () => {
    it("renders full dashboard assembly and manages the comparison banner when items are queued", async () => {
      renderWithQuery(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("kpi-stat-cards")).toBeDefined();
      });

      expect(screen.getByTestId("quick-scenario-trigger")).toBeDefined();
      expect(screen.getByTestId("curated-studies-grid")).toBeDefined();
      expect(screen.getByTestId("domain-breakdown")).toBeDefined();
      expect(screen.queryByTestId("dashboard-compare-banner")).toBeNull();

      act(() => {
        useWorkspaceStore
          .getState()
          .toggleCompare("e1a75331-3f1f-57b8-9042-405ff61dff51");
      });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-compare-banner")).toBeDefined();
      });
      expect(screen.getByText("1 of 3 selected")).toBeDefined();

      fireEvent.click(screen.getByText("Clear"));
      expect(useWorkspaceStore.getState().compareList).toHaveLength(0);
    });
  });
});

vi.mock("@/api/services/evidenceNavigation", async () => {
  const { descriptiveFixture, overviewFixture } = await import(
    "./fixtures/descriptiveFixture"
  );
  return {
    useDescriptiveQuery: () => ({
      data: descriptiveFixture,
      isLoading: false,
      isError: false,
    }),
    useStudyOverviewQuery: () => ({
      data: overviewFixture,
      isLoading: false,
      isError: false,
    }),
  };
});
