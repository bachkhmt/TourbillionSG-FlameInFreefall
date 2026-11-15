import { describe, expect, it } from "vitest";
import {
  getMockCatalogCapabilities,
  getMockClaimsPage,
  getMockClaimSourcesPage,
  getMockComparisonResult,
  getMockConditions,
  getMockDashboardSummary,
  getMockInvestigationDetail,
  getMockInvestigationsPage,
  getMockObservationsPage,
  getMockRunMeasurements,
  getMockRunsPage,
  getMockSourcesPage,
} from "@/api/mockFallback";
import { shouldFallback } from "@/hooks/api/queryHelpers";

describe("Offline Mock Fallback System", () => {
  describe("shouldFallback helper", () => {
    it("returns explicit boolean when provided", () => {
      expect(shouldFallback(true)).toBe(true);
      expect(shouldFallback(false)).toBe(false);
    });

    it("defaults to false in test environment to preserve error assertions", () => {
      expect(shouldFallback()).toBe(false);
    });
  });

  describe("getMockDashboardSummary", () => {
    it("returns 20 total investigations and non-empty featured studies", () => {
      const summary = getMockDashboardSummary();
      expect(summary.investigationCount).toBe(20);
      expect(summary.runCount).toBeGreaterThan(0);
      expect(summary.sourceCount).toBeGreaterThan(0);
      expect(summary.claimCount).toBeGreaterThan(0);
      expect(summary.featuredInvestigations.length).toBeGreaterThan(0);
      expect(summary.featuredInvestigations.length).toBeLessThanOrEqual(4);
      expect(summary.context.isSynthetic).toBe(true);
      expect(summary.context.origin).toBe("synthetic");
      expect(summary.context.reviewState).toBe("unreviewed");
      expect(summary.context.isFallback).toBe(true);
      expect(summary.context.caveats[0]).toContain("Illustrative demo data");
    });
  });

  describe("getMockCatalogCapabilities", () => {
    it("returns valid supported filter keys and sort fields", () => {
      const caps = getMockCatalogCapabilities();
      expect(caps.supportedSorts).toContain("title-asc");
      expect(caps.supportedFilters).toContain("platform");
      expect(caps.supportedFilters).toContain("gravity_raw");
      expect(caps.maxPageSize).toBeGreaterThan(0);
    });
  });

  describe("getMockInvestigationsPage", () => {
    it("returns all 20 studies with default pagination", () => {
      const page = getMockInvestigationsPage();
      expect(page.total).toBe(20);
      expect(page.items.length).toBe(20);
      expect(page.items[0]).toHaveProperty("id");
      expect(page.items[0]).toHaveProperty("psiId");
      expect(page.items[0]).toHaveProperty("title");
    });

    it("filters investigations by search query", () => {
      const page = getMockInvestigationsPage({ q: "BASS" });
      expect(page.total).toBeGreaterThan(0);
      expect(
        page.items.some(
          (item) => item.psiId.includes("BASS") || item.title.includes("BASS"),
        ),
      ).toBe(true);
    });

    it("supports offset and limit slicing", () => {
      const page = getMockInvestigationsPage({ offset: 0, limit: 5 });
      expect(page.items.length).toBe(5);
      expect(page.total).toBe(20);
      expect(page.hasMore).toBe(true);
    });
  });

  describe("getMockInvestigationDetail", () => {
    it("finds investigation by slug or id", () => {
      const bassDetail = getMockInvestigationDetail("bass");
      expect(bassDetail.title).toBeDefined();
      expect(bassDetail.psiId).toContain("BASS");
      expect(bassDetail.runsMeta.total).toBeGreaterThan(0);
    });

    it("falls back to the first study when id is unknown", () => {
      const fallbackDetail = getMockInvestigationDetail("non-existent-id");
      expect(fallbackDetail).toBeDefined();
      expect(fallbackDetail.id).toBeDefined();
    });
  });

  describe("getMockComparisonResult", () => {
    it("returns side-by-side comparative matrix across selected studies", () => {
      const result = getMockComparisonResult(["bass", "acme"]);
      expect(result.studies.length).toBe(2);
      expect(result.comparability).toBe(
        "NASA PSI Archive Comparative Assessment",
      );
      expect(result.context.caveats[0]).toContain("Illustrative demo data");
    });
  });

  describe("Sub-resource paginated queries", () => {
    it("returns runs page for investigation", () => {
      const runs = getMockRunsPage("bass");
      expect(runs.items.length).toBeGreaterThan(0);
      expect(runs.total).toBeGreaterThan(0);
    });

    it("returns conditions, measurements, and observations", () => {
      const conditions = getMockConditions("run-1");
      expect(conditions.items.length).toBeGreaterThan(0);

      const measurements = getMockRunMeasurements("run-1");
      expect(measurements.items.length).toBeGreaterThan(0);

      const observations = getMockObservationsPage("bass");
      expect(observations.items.length).toBeGreaterThan(0);

      const sources = getMockSourcesPage("bass");
      expect(sources.items.length).toBeGreaterThan(0);

      const claims = getMockClaimsPage("bass");
      expect(claims.items.length).toBeGreaterThan(0);

      const claimSources = getMockClaimSourcesPage(claims.items[0].id);
      expect(claimSources.items.length).toBe(3);
      expect(claimSources.total).toBe(3);
      expect(claimSources.items[0].sourceLocator).toBeDefined();
    });
  });
});
