import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import React from "react";
import {
  createChatSession,
  getChatSession,
  listChatMessages,
  sendChatMessage,
  getAdvisorAssessment,
  CHAT_SEND_TIMEOUT_MS,
  evaluateMissionScenario,
  getPredictionReadiness,
  executePrediction,
} from "@/api/services";
import { useSendChatMessageMutation } from "@/features/ai";
import {
  useScenarioEvaluationQuery,
  usePredictionReadinessQuery,
  usePredictionMutation,
} from "@/features/mission";
import {
  getMockPredictionReadiness,
  getMockPredictionResponse,
  getMockScenarioEvaluation,
} from "@/api/mockFallback";
import { createTestQueryClient } from "../test-utils";
import * as httpClient from "@/api/client";

describe("Phase 5 Extended Backend APIs Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("Chat & Grounded Scientific Advisor (backend contract, no local fallback)", () => {
    const SESSION = "11111111-1111-4111-8111-111111111111";

    it("creates, reads and lists a session through the snake_case chat endpoints", async () => {
      const request = vi.spyOn(httpClient, "apiRequest").mockResolvedValue({});

      await createChatSession({ investigation_id: SESSION });
      await getChatSession(SESSION);
      await listChatMessages(SESSION, { offset: 0, limit: 50 });

      expect(
        request.mock.calls.map(([path, init]) => [path, init?.method ?? "GET"]),
      ).toEqual([
        ["/chat/sessions", "POST"],
        [`/chat/sessions/${SESSION}`, "GET"],
        [`/chat/sessions/${SESSION}/messages`, "GET"],
      ]);
      expect(request.mock.calls[0][1]?.body).toEqual({
        investigation_id: SESSION,
      });
    });

    it("sends a question with the long chat timeout", async () => {
      const request = vi.spyOn(httpClient, "apiRequest").mockResolvedValue({});

      await sendChatMessage(SESSION, "FLEX-007 D0?");

      expect(request).toHaveBeenCalledWith(
        `/chat/sessions/${SESSION}/messages`,
        {
          method: "POST",
          body: { question: "FLEX-007 D0?" },
          signal: undefined,
          timeoutMs: CHAT_SEND_TIMEOUT_MS,
        },
      );
    });

    it("surfaces a backend rejection instead of inventing a local answer", async () => {
      vi.spyOn(httpClient, "apiRequest").mockRejectedValue(
        new Error("503 Chat unavailable"),
      );

      const { result } = renderHook(() => useSendChatMessageMutation(), {
        wrapper,
      });
      result.current.mutate({
        sessionId: SESSION,
        question: "Why are flames spherical?",
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
    });

    it("posts advisor assessments to the backend", async () => {
      const request = vi.spyOn(httpClient, "apiRequest").mockResolvedValue({});

      await getAdvisorAssessment({ scenario: {} });

      expect(request.mock.calls[0][0]).toBe("/advisor/assessments");
      expect(request.mock.calls[0][1]?.method).toBe("POST");
    });
  });

  describe("Mission Scenarios Evaluation", () => {
    it("evaluates mission scenario across 4 pillars", async () => {
      const mockEval = getMockScenarioEvaluation({
        scenario: {
          name: "Lunar Mission Base",
          gravity: { value: "0.16", unit: "g" },
          oxygen: {
            value: "30",
            unit: "%",
            meaning: "ambient_oxygen_fraction_percent",
          },
        },
      });

      vi.spyOn(httpClient, "apiPost").mockResolvedValueOnce(mockEval);

      const evaluation = await evaluateMissionScenario({
        scenario: {
          name: "Lunar Mission Base",
          gravity: { value: "0.16", unit: "g" },
        },
      });

      expect(evaluation.scenario.digest).toBeDefined();
      expect(evaluation.coverage.state).toBe("evaluated");
      expect(evaluation.rankings.items?.length).toBeGreaterThan(0);
      expect(evaluation.pillarEvidence.groups?.length).toBe(3);
    });

    it('useScenarioEvaluationQuery exposes backend errors without sample evaluation', async () => {
      vi.spyOn(httpClient, 'apiPost').mockRejectedValueOnce(new Error('Connection refused'));

      const { result } = renderHook(
        () =>
          useScenarioEvaluationQuery(
            {
              scenario: {
                gravity: { value: "0.38", unit: "g" },
              },
            },
            { enableFallback: true },
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
    });
  });

  describe("Predictive Physics Simulation", () => {
    it("retrieves prediction readiness declarations", async () => {
      const mockReadiness = getMockPredictionReadiness();
      vi.spyOn(httpClient, "apiGet").mockResolvedValueOnce(mockReadiness);

      const readiness = await getPredictionReadiness();
      expect(readiness.state).toBe("ready");
      expect(readiness.capabilities?.flameSpreadRate).toBe("true");
    });

    it("executes prediction and returns physical combustion solver values", async () => {
      const mockResp = getMockPredictionResponse({
        modelId: "m-1",
        expectedModelVersion: "1.0.0",
        expectedDatasetVersion: "v1",
        observable: "flame_spread_rate",
        scenario: {
          gravity: { value: "0", unit: "g" },
          oxygen: {
            value: "21",
            unit: "%",
            meaning: "ambient_oxygen_fraction_percent",
          },
        },
      });

      vi.spyOn(httpClient, "apiPost").mockResolvedValueOnce(mockResp);

      const response = await executePrediction({
        modelId: "m-1",
        expectedModelVersion: "1.0.0",
        expectedDatasetVersion: "v1",
        observable: "flame_spread_rate",
        scenario: {
          gravity: { value: "0", unit: "g" },
        },
      });

      expect(response.state).toBe("predicted");
      expect(response.result?.value).toBeDefined();
      expect(response.result?.unit).toBe("mm/s");
    });

    it("usePredictionMutation surfaces errors on error", async () => {
      vi.spyOn(httpClient, "apiPost").mockRejectedValueOnce(
        new Error("503 Prediction Provider Unavailable"),
      );

      const { result } = renderHook(() => usePredictionMutation(), { wrapper });

      result.current.mutate({
        modelId: "m-fallback",
        expectedModelVersion: "1.0.0",
        expectedDatasetVersion: "v1",
        observable: "flame_spread_rate",
        scenario: {
          gravity: { value: "0.16", unit: "g" },
          oxygen: {
            value: "30",
            unit: "%",
            meaning: "ambient_oxygen_fraction_percent",
          },
        },
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
    });
  });
});
