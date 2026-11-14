import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  ResearchDashboard,
  ResearchExplorer,
} from "@/components/research/Catalog";
import { ResearchDetail } from "@/components/research/Detail";
import { ResearchMission } from "@/components/research/Mission";
import { AiDrawer } from "@/components/ai/AiDrawer";
import { AiMessageItem } from "@/components/ai/AiMessageItem";
import { useDatasetStore } from "@/store/useDatasetStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useAiAssistantStore } from "@/store/useAiAssistantStore";
import { fixtureFetch, liveAnswer, liveWorkspace } from "./live-fixtures";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "flex" }),
  usePathname: () => "/explorer/flex",
}));
beforeEach(() => {
  useWorkspaceStore.getState().resetWorkspace();
  useAiAssistantStore.setState({
    isOpen: true,
    messages: [],
    isStreaming: false,
    activeContextStudyId: null,
  });
});
afterEach(cleanup);

describe("Live integration acceptance", () => {
  it("discards an analysis response from a revision replaced by refresh", async () => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation((url, init) => {
      if (String(url).includes("/scenarios/analyze"))
        return new Promise<Response>((resolve) => {
          finish = resolve;
        });
      if (String(url).includes("/workspace"))
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...liveWorkspace, revision: "newer-release" }),
        } as Response);
      return fixtureFetch(url, init);
    });
    render(<ResearchMission />);
    fireEvent.submit(
      screen.getByRole("button", { name: "Analyze evidence" }).closest("form")!,
    );
    await waitFor(() => expect(finish).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Refresh release" }));
    await waitFor(() =>
      expect(useDatasetStore.getState().data?.revision).toBe("newer-release"),
    );
    await act(async () => {
      finish({
        ok: true,
        json: async () => ({
          revision: liveWorkspace.revision,
          exactMatchCount: 0,
          engineVersion: "old",
          notice: "old analysis",
          candidates: [],
          investigations: [],
          prediction: { available: false, reason: "offline" },
        }),
      } as Response);
    });
    expect(screen.queryByText("0 combined exact matches")).toBeNull();
    expect(screen.queryByText("old analysis")).toBeNull();
  });
  it("does not fall back to seed catalog on connection failure", () => {
    useDatasetStore.setState({
      data: null,
      status: "error",
      error: "Backend unavailable",
    });
    render(<ResearchDashboard />);
    expect(screen.getByRole("alert").textContent).toContain(
      "Backend unavailable",
    );
    expect(screen.queryByTestId("live-study-flex")).toBeNull();
    expect(screen.queryByText("160")).toBeNull();
  });

  it("loads the dataset through the versioned API and supports retry", async () => {
    useDatasetStore.setState({ data: null, status: "error", error: "Offline" });
    render(<ResearchDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Retry connection" }));
    await waitFor(() =>
      expect(screen.getByTestId("live-study-flex")).toBeDefined(),
    );
    expect(fetch).toHaveBeenCalledWith("/api/v1/workspace", expect.anything());
  });

  it("keeps unknown airflow and both conflicting diameter values visible", () => {
    render(<ResearchDetail studyId="flex" />);
    expect(screen.getAllByText("1.87").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1.82").length).toBeGreaterThan(0);
    expect(screen.getByText(/Source conflict: D0 differs/)).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "Source records (1)" }));
    expect(screen.getByText("Unknown")).toBeDefined();
  });

  it("does not generate telemetry for a run lacking the original channel", () => {
    render(<ResearchDetail studyId="bass-ii" />);
    fireEvent.click(screen.getByRole("tab", { name: "Original telemetry" }));
    expect(
      screen.getByText("No original telemetry imported for this run"),
    ).toBeDefined();
    expect(screen.queryByRole("img", { name: /Measured droplet/ })).toBeNull();
  });

  it("pins revision in every selected-data export link", () => {
    render(<ResearchDetail studyId="flex" />);
    fireEvent.click(screen.getByRole("tab", { name: "Export & Data Card" }));
    for (const label of ["JSON", "CSV", "Data Card", "NOTEBOOK"]) {
      expect(
        screen.getByRole("link", { name: label }).getAttribute("href"),
      ).toContain("revision=fixture-release-1");
    }
  });

  it("enforces a comparison limit of three investigations", () => {
    render(<ResearchExplorer />);
    for (const control of screen.getAllByRole("button", { name: "Compare" }))
      fireEvent.click(control);
    expect(useWorkspaceStore.getState().compareList).toHaveLength(3);
  });

  it("sends oxygen basis, units and release to scenario analysis", async () => {
    render(<ResearchMission />);
    fireEvent.change(screen.getByLabelText("Oxygen basis"), {
      target: { value: "mole_percent" },
    });
    // happy-dom computes decimal stepMismatch with floating-point modulo.
    // Submit the form directly; backend range validation is tested separately.
    fireEvent.submit(
      screen.getByRole("button", { name: "Analyze evidence" }).closest("form")!,
    );
    await waitFor(() =>
      expect(screen.getByText("0 combined exact matches")).toBeDefined(),
    );
    const call = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes("/scenarios/analyze"));
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
      revision: liveWorkspace.revision,
      oxygenBasis: "mole_percent",
      pressurePsi: 14.7,
    });
  });

  it("restores a shared scenario and preserves it when prediction remains offline", () => {
    const config = {
      ...liveWorkspace.presets[0],
      gravityG: 0.16,
      oxygenPct: 30,
    };
    window.history.replaceState(
      null,
      "",
      "/mission?scenario=" + encodeURIComponent(JSON.stringify(config)),
    );
    render(<ResearchMission />);
    expect(useWorkspaceStore.getState().activeScenario.gravity).toBe(0.16);
    fireEvent.click(
      screen.getByRole("button", { name: "Predictive Lab · readiness only" }),
    );
    expect(screen.getByText("Prediction offline")).toBeDefined();
    expect(useWorkspaceStore.getState().activeScenario.oxygenPct).toBe(30);
  });

  it("pins historical citation revision and displays the original file version", async () => {
    const oldAnswer = {
      ...liveAnswer,
      meta: { ...liveAnswer.meta, corpusRevision: "historical-release" },
    };
    render(
      <AiMessageItem
        message={{
          id: "history",
          role: "assistant",
          content: "",
          timestamp: 1,
          groundedAnswer: oldAnswer,
        }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fixture-TestSheet.txt/ }),
    );
    await waitFor(() =>
      expect(screen.getByText(/Study v5 · File v2/)).toBeDefined(),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/sources/source-sheet?revision=historical-release",
      expect.anything(),
    );
  });

  it("shows network errors without inserting a fabricated assistant answer", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network unavailable"));
    render(<AiDrawer />);
    fireEvent.click(screen.getByText("FLEX-007 source conflict"));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Network unavailable",
      ),
    );
    expect(useAiAssistantStore.getState().messages).toHaveLength(1);
  });

  it("does not insert a stale answer after clearing the conversation", async () => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    render(<AiDrawer />);
    fireEvent.click(screen.getByText("FLEX-007 source conflict"));
    fireEvent.click(
      screen.getByRole("button", { name: "Clear chat messages" }),
    );
    await act(async () => {
      finish({ ok: true, json: async () => liveAnswer } as Response);
    });
    expect(useAiAssistantStore.getState().messages).toHaveLength(0);
  });
});
