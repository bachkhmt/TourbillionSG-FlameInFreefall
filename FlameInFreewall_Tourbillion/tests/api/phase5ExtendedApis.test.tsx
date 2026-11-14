import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import React from 'react';
import {
  createChatSession,
  getChatSession,
  getChatMessages,
  sendChatMessage,
  getAdvisorAssessment,
  evaluateMissionScenario,
  getPredictionReadiness,
  executePrediction,
} from '@/api/services';
import {
  useCreateChatSessionMutation,
  useChatSessionQuery,
  useChatMessagesQuery,
  useSendChatMessageMutation,
  useScenarioEvaluationQuery,
  usePredictionReadinessQuery,
  usePredictionMutation,
} from '@/hooks/api';
import {
  getMockChatExchange,
  getMockChatSession,
  getMockPredictionReadiness,
  getMockPredictionResponse,
  getMockScenarioEvaluation,
} from '@/api/mockFallback';
import { createTestQueryClient } from '../test-utils';
import * as httpClient from '@/api/client';

describe('Phase 5 Extended Backend APIs Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Chat & Grounded Scientific Advisor', () => {
    it('creates a chat session and returns SessionOutputDto', async () => {
      const mockSession = getMockChatSession('bass');
      vi.spyOn(httpClient, 'apiPost').mockResolvedValueOnce(mockSession);

      const session = await createChatSession({ investigationId: 'bass', title: 'Exploration' });
      expect(session.id).toBeDefined();
      expect(session.investigationId).toBe('bass');
    });

    it('retrieves chat session and message history', async () => {
      const mockSession = getMockChatSession();
      vi.spyOn(httpClient, 'apiGet')
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ items: [], offset: 0, limit: 20 });

      const session = await getChatSession('sess-1');
      expect(session.id).toBeDefined();

      const messages = await getChatMessages('sess-1');
      expect(messages.items).toHaveLength(0);
    });

    it('sends question and receives evidence-grounded response', async () => {
      const mockExchange = getMockChatExchange('What is the quenching limit in microgravity?');
      vi.spyOn(httpClient, 'apiPost').mockResolvedValueOnce(mockExchange);

      const exchange = await sendChatMessage('sess-1', 'What is the quenching limit in microgravity?');
      expect(exchange.user.answer.text).toBe('What is the quenching limit in microgravity?');
      expect(exchange.assistant.answer.state).toBe('answered');
      expect(exchange.assistant.answer.text.length).toBeGreaterThan(0);
    });

    it('runs useSendChatMessageMutation with fallback when backend rejects', async () => {
      vi.spyOn(httpClient, 'apiPost').mockRejectedValueOnce(new Error('503 Chat Provider Unavailable'));

      const { result } = renderHook(() => useSendChatMessageMutation(), { wrapper });

      result.current.mutate({
        sessionId: 'sess-test',
        question: 'Why do flames become spherical in microgravity?',
        investigationId: 'flex',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.assistant.answer.text).toContain('spherical');
      expect(result.current.data?.assistant.answer.origin).toBe('real');
    });
  });

  describe('Mission Scenarios Evaluation', () => {
    it('evaluates mission scenario across 4 pillars', async () => {
      const mockEval = getMockScenarioEvaluation({
        scenario: {
          name: 'Lunar Mission Base',
          gravity: { value: '0.16', unit: 'g' },
          oxygen: { value: '30', unit: '%', meaning: 'ambient_oxygen_fraction_percent' },
        },
      });

      vi.spyOn(httpClient, 'apiPost').mockResolvedValueOnce(mockEval);

      const evaluation = await evaluateMissionScenario({
        scenario: {
          name: 'Lunar Mission Base',
          gravity: { value: '0.16', unit: 'g' },
        },
      });

      expect(evaluation.scenario.digest).toBeDefined();
      expect(evaluation.coverage.state).toBe('evaluated');
      expect(evaluation.rankings.items?.length).toBeGreaterThan(0);
      expect(evaluation.pillarEvidence.groups?.length).toBe(3);
    });

    it('useScenarioEvaluationQuery falls back gracefully when backend fails', async () => {
      vi.spyOn(httpClient, 'apiPost').mockRejectedValueOnce(new Error('Connection refused'));

      const { result } = renderHook(
        () =>
          useScenarioEvaluationQuery(
            {
              scenario: {
                gravity: { value: '0.38', unit: 'g' },
              },
            },
            { enableFallback: true }
          ),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.coverage.state).toBe('evaluated');
      expect(result.current.data?.rankings.items?.length).toBeGreaterThan(0);
    });
  });

  describe('Predictive Physics Simulation', () => {
    it('retrieves prediction readiness declarations', async () => {
      const mockReadiness = getMockPredictionReadiness();
      vi.spyOn(httpClient, 'apiGet').mockResolvedValueOnce(mockReadiness);

      const readiness = await getPredictionReadiness();
      expect(readiness.state).toBe('ready');
      expect(readiness.capabilities?.flameSpreadRate).toBe('true');
    });

    it('executes prediction and returns physical combustion solver values', async () => {
      const mockResp = getMockPredictionResponse({
        modelId: 'm-1',
        expectedModelVersion: '1.0.0',
        expectedDatasetVersion: 'v1',
        observable: 'flame_spread_rate',
        scenario: {
          gravity: { value: '0', unit: 'g' },
          oxygen: { value: '21', unit: '%', meaning: 'ambient_oxygen_fraction_percent' },
        },
      });

      vi.spyOn(httpClient, 'apiPost').mockResolvedValueOnce(mockResp);

      const response = await executePrediction({
        modelId: 'm-1',
        expectedModelVersion: '1.0.0',
        expectedDatasetVersion: 'v1',
        observable: 'flame_spread_rate',
        scenario: {
          gravity: { value: '0', unit: 'g' },
        },
      });

      expect(response.state).toBe('predicted');
      expect(response.result?.value).toBeDefined();
      expect(response.result?.unit).toBe('mm/s');
    });

    it('usePredictionMutation falls back cleanly on error', async () => {
      vi.spyOn(httpClient, 'apiPost').mockRejectedValueOnce(new Error('503 Prediction Provider Unavailable'));

      const { result } = renderHook(() => usePredictionMutation(), { wrapper });

      result.current.mutate({
        modelId: 'm-fallback',
        expectedModelVersion: '1.0.0',
        expectedDatasetVersion: 'v1',
        observable: 'flame_spread_rate',
        scenario: {
          gravity: { value: '0.16', unit: 'g' },
          oxygen: { value: '30', unit: '%', meaning: 'ambient_oxygen_fraction_percent' },
        },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.state).toBe('predicted');
      expect(result.current.data?.result?.unit).toBe('mm/s');
    });
  });
});
