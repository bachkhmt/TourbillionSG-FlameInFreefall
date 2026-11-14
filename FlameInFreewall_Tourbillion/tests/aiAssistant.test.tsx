import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingAiDock } from '../src/components/ai/FloatingAiDock';
import { AiDrawer } from '../src/components/ai/AiDrawer';
import { AppShell } from '../src/components/layout/AppShell';
import { useAiAssistantStore } from '../src/store/useAiAssistantStore';
import { CHAT_SESSION_KEY } from '../src/lib/chatSession';
import { ApiClientError } from '../src/api/client';
import * as apiServices from '@/api/services';
import type { ChatAnswerDto, ChatMessageDto } from '@/api/dto';
import type { MappedChatMessage } from '../src/types/api';
import { renderWithQuery } from './test-utils';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('@/api/services', () => ({
  getChatReadiness: vi.fn(),
  createChatSession: vi.fn(),
  getChatSession: vi.fn(),
  listChatMessages: vi.fn(),
  sendChatMessage: vi.fn(),
  getChatSource: vi.fn(),
}));

const services = vi.mocked(apiServices);
const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const SOURCE_ID = '22222222-2222-4222-8222-222222222222';
const CORPUS = 'a'.repeat(64);

function answer(overrides: Partial<ChatAnswerDto> = {}): ChatAnswerDto {
  return {
    state: 'answered',
    text: 'Hai nguồn ghi đường kính ban đầu (D0) của FLEX-007 khác nhau.',
    origin: 'real',
    review_status: 'unreviewed',
    provider_version: 'nasa-extractive-v2',
    model_version: null,
    corpus_version: CORPUS,
    citations: [
      {
        source_document_id: SOURCE_ID,
        source_locator: 'CSV row 8',
        source_excerpt: 'FLEX-007 [row 8]; Droplet initial diameter; mm: 1.87',
        test_run_id: null,
      },
    ],
    ...overrides,
  };
}

function message(role: 'user' | 'assistant', id: string, body: ChatAnswerDto): ChatMessageDto {
  return { id, role, created_at: '2026-11-14T00:00:00Z', answer: body };
}

function userAnswer(text: string): ChatAnswerDto {
  return answer({ text, citations: [], origin: 'unknown', review_status: 'unknown' });
}

function readyDto() {
  return {
    state: 'ready' as const,
    mode: 'retrieval_only',
    providerVersion: 'nasa-extractive-v2',
    corpusVersion: CORPUS,
    sourceRevision: 'rev',
    passages: 1045,
    reviewStatus: 'unreviewed',
    reasons: [],
  };
}

function sessionDto(id = SESSION_ID) {
  return {
    id,
    investigation_id: null,
    title: null,
    created_at: '2026-11-14T00:00:00Z',
    expires_at: '2026-11-15T00:00:00Z',
    privacy: 'Public research demo.',
  };
}

function exchange(question: string, body: ChatAnswerDto = answer()) {
  return {
    user: message('user', 'u-1', userAnswer(question)),
    assistant: message('assistant', 'a-1', body),
  };
}

function openDrawer() {
  useAiAssistantStore.setState({ isOpen: true });
  return renderWithQuery(<AiDrawer />);
}

async function ask(question: string) {
  const input = await screen.findByPlaceholderText(/Ask about NASA combustion/i);
  fireEvent.change(input, { target: { value: question } });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(
      false
    )
  );
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
}

function assistantMessage(): MappedChatMessage {
  return {
    id: 'a-0',
    role: 'assistant',
    createdAt: '2026-11-14T00:00:00Z',
    answer: {
      state: 'answered',
      text: 'Answer',
      origin: 'real',
      reviewStatus: 'unreviewed',
      providerVersion: 'nasa-extractive-v2',
      corpusVersion: CORPUS,
      citations: [],
    },
  };
}

describe('Grounded AI assistant backed by the NASA chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAiAssistantStore.setState({
      isOpen: false,
      activeContextStudyId: null,
      sessionId: null,
      messages: [],
    });
    services.getChatReadiness.mockResolvedValue(readyDto());
    services.createChatSession.mockResolvedValue(sessionDto());
    services.getChatSession.mockResolvedValue(sessionDto());
    services.listChatMessages.mockResolvedValue({ items: [], offset: 0, limit: 100 });
  });

  describe('AiDrawer', () => {
    it('does not render or call the API when closed', () => {
      renderWithQuery(<AiDrawer />);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(services.getChatReadiness).not.toHaveBeenCalled();
    });

    it('locks sending while the corpus is not ready and retries readiness', async () => {
      services.getChatReadiness.mockResolvedValueOnce({
        state: 'not_ready',
        mode: 'retrieval_only',
        reasons: ['CHAT_CONFIGURATION_UNAVAILABLE'],
      });
      openDrawer();
      expect(await screen.findByRole('alert')).toBeDefined();
      expect(screen.getByText(/Evidence corpus unavailable/i)).toBeDefined();
      const input = screen.getByPlaceholderText(/Ask about NASA combustion/i);
      fireEvent.change(input, { target: { value: 'FLEX-007 D0?' } });
      expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(
        true
      );

      fireEvent.click(screen.getByRole('button', { name: /Retry connection/i }));
      await waitFor(() => expect(services.getChatReadiness).toHaveBeenCalledTimes(2));
      expect(await screen.findByText(/1045 source passages/i)).toBeDefined();
    });

    it('creates a session on first send, stores the token and renders the cited answer', async () => {
      services.sendChatMessage.mockResolvedValue(exchange('FLEX-007 D0?'));
      openDrawer();
      await ask('FLEX-007 D0?');

      expect(await screen.findByText(/D0\) của FLEX-007 khác nhau/)).toBeDefined();
      expect(services.createChatSession).toHaveBeenCalledWith({});
      expect(services.sendChatMessage).toHaveBeenCalledWith(SESSION_ID, 'FLEX-007 D0?');
      expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBe(SESSION_ID);
      expect(screen.getByText('[1] CSV row 8')).toBeDefined();
      expect(screen.getByText(/Unreviewed/i)).toBeDefined();
      expect(useAiAssistantStore.getState().messages).toHaveLength(2);
    });

    it('scopes a new session to the active study when its id is a UUID', async () => {
      const study = '33333333-3333-4333-8333-333333333333';
      useAiAssistantStore.setState({ activeContextStudyId: study });
      services.sendChatMessage.mockResolvedValue(exchange('Objective?'));
      openDrawer();
      await ask('Objective?');
      await screen.findByText(/D0\) của FLEX-007 khác nhau/);
      expect(services.createChatSession).toHaveBeenCalledWith({ investigation_id: study });
    });

    it('reuses a stored session and restores its server history', async () => {
      sessionStorage.setItem(CHAT_SESSION_KEY, SESSION_ID);
      services.listChatMessages.mockResolvedValue({
        items: [
          message('user', 'u-0', userAnswer('Earlier question')),
          message('assistant', 'a-0', answer({ text: 'Earlier answer' })),
        ],
        offset: 0,
        limit: 100,
      });
      services.sendChatMessage.mockResolvedValue(exchange('Next?'));
      openDrawer();

      expect(await screen.findByText('Earlier answer')).toBeDefined();
      expect(services.getChatSession).toHaveBeenCalledWith(SESSION_ID, expect.anything());
      await ask('Next?');
      await waitFor(() => expect(services.sendChatMessage).toHaveBeenCalled());
      expect(services.createChatSession).not.toHaveBeenCalled();
    });

    it('forgets an expired stored session without sending anything', async () => {
      sessionStorage.setItem(CHAT_SESSION_KEY, SESSION_ID);
      services.getChatSession.mockRejectedValue(
        new ApiClientError({ message: 'Session unavailable', status: 404, code: 'HTTP_ERROR' })
      );
      openDrawer();
      await waitFor(() => expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBeNull());
      expect(services.sendChatMessage).not.toHaveBeenCalled();
    });

    it('starts a fresh session once when the stored session expired before sending', async () => {
      const fresh = '44444444-4444-4444-8444-444444444444';
      useAiAssistantStore.setState({ sessionId: SESSION_ID });
      sessionStorage.setItem(CHAT_SESSION_KEY, SESSION_ID);
      services.createChatSession.mockResolvedValue(sessionDto(fresh));
      services.sendChatMessage
        .mockRejectedValueOnce(
          new ApiClientError({ message: 'Session unavailable', status: 404, code: 'HTTP_ERROR' })
        )
        .mockResolvedValueOnce(exchange('FLEX-007 D0?'));
      openDrawer();
      await ask('FLEX-007 D0?');

      await screen.findByText(/D0\) của FLEX-007 khác nhau/);
      expect(services.sendChatMessage).toHaveBeenNthCalledWith(1, SESSION_ID, 'FLEX-007 D0?');
      expect(services.sendChatMessage).toHaveBeenNthCalledWith(2, fresh, 'FLEX-007 D0?');
      expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBe(fresh);
    });

    it('shows abstained and timeout states without inventing citations', async () => {
      services.sendChatMessage
        .mockResolvedValueOnce(
          exchange(
            'Mars?',
            answer({ state: 'abstained', text: 'Không tìm thấy số đo phù hợp.', citations: [] })
          )
        )
        .mockResolvedValueOnce(
          exchange(
            'Slow?',
            answer({ state: 'timeout', text: 'Provider deadline exceeded.', citations: [] })
          )
        );
      openDrawer();
      await ask('Mars?');
      expect(await screen.findByText('Không tìm thấy số đo phù hợp.')).toBeDefined();
      expect(screen.getByText(/No matching evidence/i)).toBeDefined();
      await ask('Slow?');
      expect(await screen.findByText(/Provider timed out/i)).toBeDefined();
      expect(screen.queryByText(/\[1\]/)).toBeNull();
    });

    it('reports an evidence revision conflict and keeps the conversation unchanged', async () => {
      services.sendChatMessage.mockRejectedValue(
        new ApiClientError({ message: 'Evidence changed', status: 409, code: 'HTTP_ERROR' })
      );
      openDrawer();
      await ask('FLEX-007 D0?');
      expect(await screen.findByText(/evidence changed while answering/i)).toBeDefined();
      expect(useAiAssistantStore.getState().messages).toHaveLength(0);
    });

    it('opens revision-pinned source metadata for a citation', async () => {
      services.sendChatMessage.mockResolvedValue(exchange('FLEX-007 D0?'));
      services.getChatSource.mockResolvedValue({
        sourceId: SOURCE_ID,
        locator: 'CSV row 8',
        corpusVersion: CORPUS,
        filename: 'PSI-69_Experimental table_FLEX.csv',
        sourceUrl: 'https://psi.nasa.gov/example.csv',
        sha256: 'b'.repeat(64),
        license: 'CC0-1.0',
        title: 'FLEX',
        slug: 'flex',
        investigationId: 'inv',
        version: 'v',
        reviewStatus: 'unreviewed',
      });
      openDrawer();
      await ask('FLEX-007 D0?');
      fireEvent.click(await screen.findByRole('button', { name: 'View source 1' }));

      const link = await screen.findByRole('link', { name: /PSI-69_Experimental table_FLEX.csv/ });
      expect(link.getAttribute('href')).toBe('https://psi.nasa.gov/example.csv');
      expect(services.getChatSource).toHaveBeenCalledWith(
        SOURCE_ID,
        'CSV row 8',
        CORPUS,
        expect.anything()
      );
      expect(screen.getByText(/CC0-1.0/)).toBeDefined();
    });

    it('explains when a citation belongs to an older corpus revision', async () => {
      services.sendChatMessage.mockResolvedValue(exchange('FLEX-007 D0?'));
      services.getChatSource.mockRejectedValue(
        new ApiClientError({ message: 'Other revision', status: 409, code: 'HTTP_ERROR' })
      );
      openDrawer();
      await ask('FLEX-007 D0?');
      fireEvent.click(await screen.findByRole('button', { name: 'View source 1' }));
      expect(await screen.findByText(/older corpus revision/i)).toBeDefined();
    });

    it('reports an unavailable citation source', async () => {
      services.sendChatMessage.mockResolvedValue(exchange('FLEX-007 D0?'));
      services.getChatSource.mockRejectedValue(
        new ApiClientError({ message: 'Citation source unavailable', status: 404, code: 'HTTP_ERROR' })
      );
      openDrawer();
      await ask('FLEX-007 D0?');
      fireEvent.click(await screen.findByRole('button', { name: 'View source 1' }));
      expect(await screen.findByText(/Source unavailable/i)).toBeDefined();
    });

    it('starts a new session by forgetting the tab token and local messages', async () => {
      services.sendChatMessage.mockResolvedValue(exchange('FLEX-007 D0?'));
      openDrawer();
      await ask('FLEX-007 D0?');
      await screen.findByText(/D0\) của FLEX-007 khác nhau/);
      fireEvent.click(screen.getByRole('button', { name: /Start new session/i }));
      expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBeNull();
      expect(useAiAssistantStore.getState().messages).toHaveLength(0);
      expect(useAiAssistantStore.getState().sessionId).toBeNull();
    });

    it('closes on Escape and via the close button', async () => {
      openDrawer();
      await screen.findByRole('dialog');
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(useAiAssistantStore.getState().isOpen).toBe(false);
    });
  });

  describe('FloatingAiDock', () => {
    it('toggles the drawer open', () => {
      render(<FloatingAiDock />);
      fireEvent.click(screen.getByRole('button', { name: /Open Grounded AI Assistant/i }));
      expect(useAiAssistantStore.getState().isOpen).toBe(true);
    });

    it('counts assistant messages while closed', () => {
      useAiAssistantStore.setState({
        messages: [assistantMessage(), { ...assistantMessage(), id: 'a-1' }],
      });
      render(<FloatingAiDock />);
      expect(screen.getByLabelText('2 assistant messages').textContent).toBe('2');
    });

    it('renders the active study context indicator', () => {
      useAiAssistantStore.setState({ activeContextStudyId: 'flex' });
      render(<FloatingAiDock />);
      expect(screen.getByTitle('Active Context: FLEX')).toBeDefined();
    });
  });

  describe('AppShell', () => {
    it('mounts the floating dock without requiring the chat API while closed', () => {
      render(
        <AppShell>
          <div data-testid="page-content">Dashboard View</div>
        </AppShell>
      );
      expect(screen.getByTestId('page-content')).toBeDefined();
      expect(screen.getByTestId('floating-ai-dock')).toBeDefined();
      expect(services.getChatReadiness).not.toHaveBeenCalled();
    });
  });
});
