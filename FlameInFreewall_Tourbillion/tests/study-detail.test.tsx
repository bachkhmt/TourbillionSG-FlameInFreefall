import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { StudyDetailClient } from "../src/app/(dashboard)/explorer/[id]/StudyDetailClient";
import { ApiClientError } from "../src/api/client";
import { mapInvestigationDetailDto } from "../src/api/mappers";
import * as apiServices from "../src/api/services";
import { renderWithQuery } from "./test-utils";
import {
  makeClaimDto,
  makeConditionDto,
  makeInvestigationDetailDto,
  makeMeasurementDto,
  makeObservationDto,
  makePageDto,
  makeRunDto,
  makeSourceDto,
} from "./fixtures/backendFixtures";

let mockParams: { id?: string } = {
  id: "e1a75331-3f1f-57b8-9042-405ff61dff51",
};

expect.extend({
  toBeInTheDocument(received) {
    const pass = Boolean(received);
    return {
      pass,
      message: () => `expected element ${pass ? "not " : ""}to be in document`,
    };
  },
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/explorer/e1a75331-3f1f-57b8-9042-405ff61dff51",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => mockParams,
}));

vi.mock("@/api/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/api/services")>();
  return {
    ...actual,
    getInvestigationById: vi.fn(),
    getInvestigationBySlug: vi.fn(),
    listInvestigationRuns: vi.fn(),
    listInvestigationMeasurements: vi.fn(),
    listInvestigationSources: vi.fn(),
    listInvestigationClaims: vi.fn(),
    listRunConditions: vi.fn(),
    listRunMeasurements: vi.fn(),
  };
});

const STUDY_UUID = "e1a75331-3f1f-57b8-9042-405ff61dff51";

describe("Study Detail Page & Query States", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { id: STUDY_UUID };

    vi.mocked(apiServices.getInvestigationById).mockResolvedValue(
      makeInvestigationDetailDto({
        id: STUDY_UUID,
        psiId: "SYNTHETIC-PHASE4-1",
      }),
    );
    vi.mocked(apiServices.getInvestigationBySlug).mockResolvedValue(
      makeInvestigationDetailDto({
        id: "afa58280-0d0c-58a3-926a-1499a1e20a96",
        psiId: "SYNTHETIC-PHASE4-2",
        slug: "saffire-synthetic",
        title: "Synthetic Slug Investigation",
      }),
    );
    vi.mocked(apiServices.listInvestigationRuns).mockResolvedValue(
      makePageDto([makeRunDto()]),
    );
    vi.mocked(apiServices.listInvestigationMeasurements).mockResolvedValue(
      makePageDto([makeObservationDto()]),
    );
    vi.mocked(apiServices.listInvestigationSources).mockResolvedValue(
      makePageDto([makeSourceDto()]),
    );
    vi.mocked(apiServices.listInvestigationClaims).mockResolvedValue(
      makePageDto([makeClaimDto()]),
    );
    vi.mocked(apiServices.listRunConditions).mockResolvedValue(
      makePageDto([makeConditionDto()]),
    );
    vi.mocked(apiServices.listRunMeasurements).mockResolvedValue(
      makePageDto([makeMeasurementDto()]),
    );
  });

  it("renders StudyDetailShimmer while investigation detail query is pending", () => {
    vi.mocked(apiServices.getInvestigationById).mockReturnValue(
      new Promise(() => {}),
    );
    renderWithQuery(<StudyDetailClient />);
    expect(screen.getByTestId("study-detail-shimmer")).toBeInTheDocument();
  });

  it("fetches by UUID or slug and renders mapped header, caveats, and tabs", async () => {
    mockParams = { id: "saffire-synthetic" };
    renderWithQuery(<StudyDetailClient />);

    await waitFor(() => {
      expect(screen.getByTestId("study-detail-page")).toBeInTheDocument();
    });

    expect(apiServices.getInvestigationBySlug).toHaveBeenCalledWith(
      "saffire-synthetic",
      expect.anything(),
    );
    expect(
      screen.getByText("Synthetic Slug Investigation"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("study-caveats-notice")).toBeInTheDocument();
    expect(screen.getByTestId("tab-runs").textContent).toContain("Test Runs");
    expect(screen.getByTestId("tab-overview").textContent).toContain(
      "Chamber Overview",
    );
  });

  it("renders study-not-found on 404 ENTITY_NOT_FOUND error", async () => {
    vi.mocked(apiServices.getInvestigationBySlug).mockRejectedValue(
      new ApiClientError({
        status: 404,
        code: "ENTITY_NOT_FOUND",
        message: "Investigation not found",
      }),
    );
    mockParams = { id: "missing-study" };
    renderWithQuery(<StudyDetailClient />);

    await waitFor(() => {
      expect(screen.getByTestId("study-not-found")).toBeInTheDocument();
    });
    expect(screen.getByText("Investigation Not Found")).toBeInTheDocument();
  });

  it("renders ApiErrorBanner on non-404 errors and retries when clicked", async () => {
    vi.mocked(apiServices.getInvestigationById)
      .mockRejectedValueOnce(new Error("Backend connection refused"))
      .mockResolvedValueOnce(makeInvestigationDetailDto());

    renderWithQuery(<StudyDetailClient />);

    await waitFor(() => {
      expect(screen.getByTestId("api-error-banner")).toBeInTheDocument();
    });
    expect(screen.getByText(/Backend connection refused/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByTestId("study-detail-page")).toBeInTheDocument();
    });
    expect(apiServices.getInvestigationById).toHaveBeenCalledTimes(2);
  });

  it("renders directly when passed a MappedInvestigationDetail study prop", async () => {
    const study = mapInvestigationDetailDto(makeInvestigationDetailDto());
    renderWithQuery(<StudyDetailClient study={study} />);

    expect(screen.getByTestId("study-header")).toBeInTheDocument();
    expect(screen.getByText(study.title)).toBeInTheDocument();
    expect(screen.getByTestId("unavailable-fields-card")).toBeInTheDocument();
    expect(screen.queryByText(/UNSUPPORTED_MAPPING/)).toBeNull();
    expect(screen.getByText(/Not available in this release/)).toBeDefined();
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
