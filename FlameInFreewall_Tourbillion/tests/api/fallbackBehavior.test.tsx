import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ApiClientError } from "@/api/client";
import { getDashboardSummary } from "@/api/services";
import { useDashboardSummaryQuery } from "@/features/dashboard/hooks/useDashboardQueries";
import {
  ActiveFallbackBanner,
  DataContextNotice,
} from "@/components/ui/DataContextNotice";
import { createTestQueryClient } from "../test-utils";
import { makeDashboardDto } from "../fixtures/backendFixtures";
import { mapContext } from "@/api/mappers";

vi.mock("@/api/services", async (original) => ({
  ...(await original<object>()),
  getDashboardSummary: vi.fn(),
}));
function Harness({ enabled }: { enabled?: boolean }) {
  const query = useDashboardSummaryQuery(undefined, {
    enableFallback: enabled,
  });
  return (
    <>
      <ActiveFallbackBanner />
      <p>
        {query.isError
          ? "Request failed"
          : query.isSuccess
            ? query.data.context.origin
            : "Loading"}
      </p>
    </>
  );
}
function show(enabled?: boolean) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <Harness enabled={enabled} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_ENABLE_MOCK_FALLBACK", "false");
});

describe("Explicit demo fallback", () => {
  it("defaults off on network failure", async () => {
    vi.mocked(getDashboardSummary).mockRejectedValue(
      new ApiClientError({
        message: "Network error",
        status: 0,
        code: "ERR_NETWORK",
      }),
    );
    show();
    await screen.findByText("Request failed");
    expect(screen.queryByTestId("demo-fallback-banner")).toBeNull();
  });
  it("shows a persistent banner and synthetic origin when explicitly enabled", async () => {
    vi.mocked(getDashboardSummary).mockRejectedValue(
      new ApiClientError({
        message: "Network error",
        status: 0,
        code: "ERR_NETWORK",
      }),
    );
    show(true);
    await screen.findByText("synthetic");
    await waitFor(() =>
      expect(screen.getByTestId("demo-fallback-banner").textContent).toContain(
        "not NASA records",
      ),
    );
  });
  it.each([404, 400, 422])(
    "does not mask HTTP %s even with demo fallback enabled",
    async (status) => {
      vi.mocked(getDashboardSummary).mockRejectedValue(
        new ApiClientError({
          message: "Request rejected",
          status,
          code: "HTTP_ERROR",
        }),
      );
      show(true);
      await screen.findByText("Request failed");
      expect(screen.queryByTestId("demo-fallback-banner")).toBeNull();
    },
  );
  it("does not mask mapper errors", async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue({} as never);
    show(true);
    await screen.findByText("Request failed");
  });
  it("does not label a backend synthetic collection as a transport fallback", async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(makeDashboardDto());
    show();
    await screen.findByText("synthetic");
    expect(screen.queryByTestId("demo-fallback-banner")).toBeNull();
  });
  it("labels real caveats as real and unreviewed", () => {
    const context = mapContext({
      collectionId: "TEST_ONLY",
      origin: "real",
      reviewState: "unreviewed",
      caveats: ["Scientific review is pending."],
    });
    render(<DataContextNotice context={context} />);
    expect(
      screen.getByText("Real · Unreviewed").getAttribute("title"),
    ).toContain("Scientific review");
    expect(screen.queryByText(/Fallback/)).toBeNull();
  });
});

it('propagates cancellation without activating illustrative fallback', async () => {
  vi.mocked(getDashboardSummary).mockRejectedValue(new ApiClientError({ message: 'Canceled', status: 0, code: 'ERR_CANCELED' }));
  show(true);
  await screen.findByText('Request failed');
  expect(screen.queryByTestId('demo-fallback-banner')).toBeNull();
});
