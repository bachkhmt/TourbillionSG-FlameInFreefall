import React from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import * as client from "@/api/client";
import { DomainBreakdown } from "@/features/dashboard/components/DomainBreakdown";
import { SourceOverview } from "@/features/explorer/components/detail/SourceOverview";
import { renderWithQuery } from "./test-utils";
import {
  descriptiveFixture,
  overviewFixture,
} from "./fixtures/descriptiveFixture";

beforeEach(() => vi.restoreAllMocks());
it("loads descriptive charts through the API and discloses missing values", async () => {
  vi.spyOn(client, "apiGet").mockResolvedValue(descriptiveFixture);
  renderWithQuery(<DomainBreakdown />);
  await screen.findByRole("img", { name: "Records by material" });
  expect(client.apiGet).toHaveBeenCalledWith(
    "/catalog/descriptive",
    undefined,
    expect.any(AbortSignal),
  );
  expect(
    screen.getByText(/Missing oxygen: 1; missing pressure: 1/),
  ).toBeDefined();
  expect(
    screen.getByText(/Burner-stream and unknown oxygen meanings/),
  ).toBeDefined();
});
it("surfaces descriptive endpoint failure with retry", async () => {
  vi.spyOn(client, "apiGet").mockRejectedValue(new Error("Charts unavailable"));
  renderWithQuery(<DomainBreakdown />);
  await screen.findByRole("alert");
  expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
});
it("renders original overview text and its source link, keeping pillar annotation separate", async () => {
  vi.spyOn(client, "apiGet").mockImplementation(async (path) =>
    path.endsWith("/overview")
      ? {
          ...overviewFixture,
          passages: [
            {
              sourceDocumentId: "TEST_ONLY",
              sourceUrl: "https://example.org/test-only",
              locator: "JSON /objective",
              section: "objective",
              text: "TEST_ONLY original objective excerpt.",
            },
          ],
        }
      : descriptiveFixture,
  );
  renderWithQuery(<SourceOverview id="TEST_ONLY" />);
  await screen.findByText("TEST_ONLY original objective excerpt.");
  expect(
    screen.getByRole("link", { name: /Open source/ }).getAttribute("href"),
  ).toBe("https://example.org/test-only");
});
