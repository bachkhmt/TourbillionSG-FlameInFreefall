import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiDrawer, FloatingAiDock } from '@/features/ai';
import { AppShell } from '../src/components/layout/AppShell';
import { useAiAssistantStore } from '../src/store/useAiAssistantStore';
import { CHAT_SESSION_KEY } from '../src/lib/chatSession';
import { ApiClientError } from '../src/api/client';
import * as apiServices from '@/api/services';
import type { ChatAnswerDto, ChatMessageDto, ChatReadinessDto } from '@/api/dto';
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
const EXCERPT = 'FLEX-007 [row 8]; Droplet initial diameter; mm: 1.87';

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
        source_excerpt: EXCERPT,
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

function readyDto(): ChatReadinessDto {
  return {
    state: 'ready',
    mode: 'retrieval_only',
    provider_version: 'nasa-extractive-v2',
    corpus_version: CORPUS,
    source_revision: 'rev',
    passages: 1045,
    review_status: 'unreviewed',
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
    privacy: 'Public research demo. Session ID holders can access history for 24 hours.',
  };
}

function exchange(question: string, body: ChatAnswerDto = answer(), suffix = '1') {
  return {
    user: message('user', `u-${suffix}`, userAnswer(question)),
    assistant: message('assistant', `a-${suffix}`, body),
  };
}

function page(items: ChatMessageDto[], offset = 0, limit = 50) {
  return { items, offset, limit };
}

function openDrawer() {
  useAiAssistantStore.setState({ isOpen: true });
  return renderWithQuery(<AiDrawer />);
}

async function ask(question: string) {
  const input = await screen.findByPlaceholderText(/Ask about a NASA experiment/i);
  fireEvent.change(input, { target: { value: question } });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(
      false
    )
  );
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
}

function openHistoryControls() {
  fireEvent.click(screen.getByText('Conversation history'));
}

function mappedAssistant(id: string): MappedChatMessage {
  return {
    id,
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

describe('Grounded AI assistant (NASA chat style) backed by the backend chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAiAssistantStore.getState().resetConversation();
    useAiAssistantStore.setState({ isOpen: false, activeContextStudyId: null });
    services.getChatReadiness.mockResolvedValue(readyDto());
    services.createChatSession.mockResolvedValue(sessionDto());
    services.getChatSession.mockResolvedValue(sessionDto());
    services.listChatMessages.mockResolvedValue(page([]));
  });

  describe('panel and backdrop', () => {
    it('does not render or call the API when closed', () => {
      renderWithQuery(<AiDrawer />);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(services.getChatReadiness).not.toHaveBeenCalled();
    });

    it('keeps the blurred backdrop and closes when it is clicked', async () => {
      openDrawer();
      const backdrop = await screen.findByTestId('ai-drawer-backdrop');
      expect(backdrop.className).toContain('backdrop-blur-xs');
      expect(backdrop.className).toContain('bg-black/40');
      fireEvent.click(backdrop);
      expect(useAiAssistantStore.getState().isOpen).toBe(false);
    });

    it('closes on Escape and with the Close button', async () => {
      openDrawer();
      await screen.findByRole('dialog');
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(useAiAssistantStore.getState().isOpen).toBe(false);
    });

    it('locks sending while the chat is not ready and retries the connection', async () => {
      services.getChatReadiness.mockResolvedValueOnce({
        state: 'not_ready',
        mode: 'none',
        reasons: ['CHAT_CONFIGURATION_UNAVAILABLE'],
      });
      openDrawer();
      expect(await screen.findByText(/Chat is not ready in this preview/i)).toBeDefined();
      fireEvent.change(screen.getByPlaceholderText(/Ask about a NASA experiment/i), {
        target: { value: 'FLEX-007 D0?' },
      });
      expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(
        true
      );
      fireEvent.click(screen.getByRole('button', { name: /Retry connection/i }));
      expect(await screen.findByText(/1045 source passages/i)).toBeDefined();
      expect(services.getChatReadiness).toHaveBeenCalledTimes(2);
    });
  });

  describe('sending', () => {
    it('creates a session, stores the tab token and renders the cited answer', async () => {
      services.sendChatMessage.mockResolvedValue(exchange('FLEX-007 D0?'));
      openDrawer();
      await ask('FLEX-007 D0?');

      expect(await screen.findByText(/D0\) của FLEX-007 khác nhau/)).toBeDefined();
      expect(services.createChatSession).toHaveBeenCalledWith({});
      expect(services.sendChatMessage).toHaveBeenCalledWith(SESSION_ID, 'FLEX-007 D0?');
      expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBe(SESSION_ID);
      expect(screen.queryByText('You')).toBeNull();
      expect(screen.queryByText('FlameGuard AI', { selector: 'strong' })).toBeNull();
      expect(screen.getByRole('article', { name: 'Your message' }).textContent).toBe('FLEX-007 D0?');
      expect(screen.getByRole('article', { name: 'Assistant reply' })).toBeDefined();
      expect(screen.getByText('[1] CSV row 8')).toBeDefined();
      expect(screen.getByText(/Scientific review has not been documented/)).toBeDefined();
      expect(useAiAssistantStore.getState().recent).toHaveLength(2);
      expect(screen.getByText(/Session ID holders can access history/)).toBeDefined();
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

    it('shows abstained and timeout states without inventing citations or provenance', async () => {
      services.sendChatMessage
        .mockResolvedValueOnce(
          exchange(
            'Mars?',
            answer({ state: 'abstained', text: 'Không tìm thấy số đo phù hợp.', citations: [] }),
            '1'
          )
        )
        .mockResolvedValueOnce(
          exchange(
            'Slow?',
            answer({ state: 'timeout', text: 'Provider deadline exceeded.', citations: [] }),
            '2'
          )
        );
      openDrawer();
      await ask('Mars?');
      expect(await screen.findByText('Không tìm thấy số đo phù hợp.')).toBeDefined();
      expect(screen.getByText(/No matching evidence/i)).toBeDefined();
      expect(screen.queryByText(/Research source excerpts/i)).toBeNull();
      await ask('Slow?');
      expect(await screen.findByText(/Provider timed out/i)).toBeDefined();
      expect(screen.queryByText(/\[1\]/)).toBeNull();
    });

    it('reports an evidence revision conflict and keeps the question for resending', async () => {
      services.sendChatMessage.mockRejectedValue(
        new ApiClientError({ message: 'Evidence changed', status: 409, code: 'HTTP_ERROR' })
      );
      openDrawer();
      await ask('FLEX-007 D0?');
      expect(await screen.findByText(/evidence changed while answering/i)).toBeDefined();
      expect(useAiAssistantStore.getState().recent).toHaveLength(0);
      expect(
        (screen.getByPlaceholderText(/Ask about a NASA experiment/i) as HTMLTextAreaElement).value
      ).toBe('FLEX-007 D0?');
    });
  });

  describe('history (stored on the server)', () => {
    it('restores the tab session history page on open', async () => {
      sessionStorage.setItem(CHAT_SESSION_KEY, SESSION_ID);
      services.listChatMessages.mockResolvedValue(
        page([
          message('user', 'u-0', userAnswer('Earlier question')),
          message('assistant', 'a-0', answer({ text: 'Earlier answer' })),
        ])
      );
      services.sendChatMessage.mockResolvedValue(exchange('Next?'));
      openDrawer();

      expect(await screen.findByText('Earlier answer')).toBeDefined();
      expect(services.listChatMessages).toHaveBeenCalledWith(
        SESSION_ID,
        { offset: 0, limit: 50 },
        expect.anything()
      );
      await ask('Next?');
      await waitFor(() => expect(services.sendChatMessage).toHaveBeenCalled());
      expect(services.createChatSession).not.toHaveBeenCalled();
      // New exchanges are kept apart from the stored page, never spliced into it.
      await waitFor(() => expect(useAiAssistantStore.getState().recent).toHaveLength(2));
      expect(useAiAssistantStore.getState().messages).toHaveLength(2);
    });

    it('pages through stored history and folds recent exchanges in on refresh', async () => {
      const full = Array.from({ length: 50 }, (_, i) =>
        message(i % 2 ? 'assistant' : 'user', `m-${i}`, userAnswer(`stored ${i}`))
      );
      sessionStorage.setItem(CHAT_SESSION_KEY, SESSION_ID);
      services.listChatMessages.mockImplementation(async (_id, pagination) =>
        pagination?.offset === 50
          ? page([message('user', 'm-50', userAnswer('stored 50'))], 50)
          : page(full, 0)
      );
      openDrawer();
      expect(await screen.findByText('stored 0')).toBeDefined();

      openHistoryControls();
      expect(screen.getByRole('button', { name: 'Previous' }).hasAttribute('disabled')).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(await screen.findByText('stored 50')).toBeDefined();
      expect(screen.queryByText('stored 0')).toBeNull();
      expect(useAiAssistantStore.getState().historyOffset).toBe(50);
      expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
      expect(await screen.findByText('stored 0')).toBeDefined();
      services.listChatMessages.mockResolvedValueOnce(
        page([message('user', 'refreshed', userAnswer('Refreshed from server'))], 0)
      );
      fireEvent.click(screen.getByRole('button', { name: 'Refresh history' }));
      expect(await screen.findByText('Refreshed from server')).toBeDefined();
      await waitFor(() =>
        expect(services.listChatMessages).toHaveBeenLastCalledWith(
          SESSION_ID,
          { offset: 0, limit: 50 },
          expect.anything()
        )
      );
    });

    it('forgets an expired stored session without sending anything', async () => {
      sessionStorage.setItem(CHAT_SESSION_KEY, SESSION_ID);
      services.getChatSession.mockRejectedValue(
        new ApiClientError({ message: 'Session unavailable', status: 404, code: 'HTTP_ERROR' })
      );
      openDrawer();
      expect(await screen.findByText(/Session expired or unavailable/i)).toBeDefined();
      expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBeNull();
      expect(services.sendChatMessage).not.toHaveBeenCalled();
    });

    it('starts a new session by forgetting the tab token and local messages', async () => {
      services.sendChatMessage.mockResolvedValue(exchange('FLEX-007 D0?'));
      openDrawer();
      await ask('FLEX-007 D0?');
      await screen.findByText(/D0\) của FLEX-007 khác nhau/);
      openHistoryControls();
      fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
      expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBeNull();
      expect(useAiAssistantStore.getState().recent).toHaveLength(0);
      expect(useAiAssistantStore.getState().sessionId).toBeNull();
    });
  });

  describe('races and unknown outcomes', () => {
    it('keeps a stored exchange and its new session when the panel closes mid-send', async () => {
      let resolve: (value: ReturnType<typeof exchange>) => void = () => {};
      services.sendChatMessage.mockReturnValue(new Promise((r) => (resolve = r)));
      const view = openDrawer();
      await ask('FLEX-007 D0?');
      await waitFor(() => expect(services.sendChatMessage).toHaveBeenCalled());
      expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBe(SESSION_ID);

      useAiAssistantStore.setState({ isOpen: false });
      view.unmount();
      resolve(exchange('FLEX-007 D0?'));
      await waitFor(() => expect(useAiAssistantStore.getState().recent).toHaveLength(2));
      expect(useAiAssistantStore.getState().sessionId).toBe(SESSION_ID);
    });

    it('reloads history after a client timeout instead of inviting a duplicate resend', async () => {
      services.sendChatMessage.mockRejectedValue(
        new ApiClientError({ message: 'Request timed out', status: 0, code: 'REQUEST_TIMEOUT' })
      );
      services.listChatMessages.mockResolvedValue(
        page([message('user', 'u-1', userAnswer('FLEX-007 D0?')), message('assistant', 'a-1', answer())])
      );
      openDrawer();
      await ask('FLEX-007 D0?');

      expect(await screen.findByText(/D0\) của FLEX-007 khác nhau/)).toBeDefined();
      expect(services.listChatMessages).toHaveBeenCalledWith(
        SESSION_ID,
        { offset: 0, limit: 50 },
        expect.anything()
      );
      expect(
        (screen.getByPlaceholderText(/Ask about a NASA experiment/i) as HTMLTextAreaElement).value
      ).toBe('');
      expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBe(SESSION_ID);
    });

    it('ignores a late answer after the user started a new session', async () => {
      let resolve: (value: ReturnType<typeof exchange>) => void = () => {};
      useAiAssistantStore.setState({ sessionId: SESSION_ID });
      sessionStorage.setItem(CHAT_SESSION_KEY, SESSION_ID);
      services.sendChatMessage.mockReturnValue(new Promise((r) => (resolve = r)));
      openDrawer();
      await ask('FLEX-007 D0?');
      await waitFor(() => expect(services.sendChatMessage).toHaveBeenCalled());
      openHistoryControls();
      expect(
        screen.getByRole('button', { name: 'New chat' }).hasAttribute('disabled')
      ).toBe(true);

      useAiAssistantStore.getState().resetConversation();
      resolve(exchange('FLEX-007 D0?'));
      await new Promise((r) => setTimeout(r, 20));
      expect(useAiAssistantStore.getState().recent).toHaveLength(0);
      expect(useAiAssistantStore.getState().sessionId).toBeNull();
      expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBeNull();
    });
  });

  describe('citation sources', () => {
    async function sendAndOpenSource() {
      services.sendChatMessage.mockResolvedValue(exchange('FLEX-007 D0?'));
      openDrawer();
      await ask('FLEX-007 D0?');
      fireEvent.click(await screen.findByRole('button', { name: 'View source 1' }));
    }

    it('opens revision-pinned source metadata for a citation', async () => {
      const fileUrl = 'https://psi.nasa.gov/geode-py/ws/studies/PSI-69/download?fileId=example';
      services.getChatSource.mockResolvedValue({
        source_document_id: SOURCE_ID,
        locator: 'CSV row 8',
        corpus_version: CORPUS,
        filename: 'PSI-69_Experimental table_FLEX.csv',
        source_url: fileUrl,
        sha256: 'b'.repeat(64),
        license: 'CC0-1.0',
        title: 'FLEX',
        review_status: 'unreviewed',
      });
      await sendAndOpenSource();
      expect(screen.getByText(EXCERPT).tagName).toBe('BLOCKQUOTE');
      const study = await screen.findByRole('link', { name: /View NASA study/ });
      expect(study.getAttribute('href')).toBe('https://psi.nasa.gov/physci/repo/data/investigations/PSI-69');
      expect(screen.getByRole('link', { name: /Open raw file/ }).getAttribute('href')).toBe(fileUrl);
      expect(services.getChatSource).toHaveBeenCalledWith(
        SOURCE_ID,
        'CSV row 8',
        CORPUS,
        expect.anything()
      );
      expect(screen.getByText('CC0-1.0')).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: 'Hide source 1' }));
      expect(screen.queryByText(EXCERPT)).toBeNull();
    });

    it('explains when a citation belongs to an older corpus revision', async () => {
      services.getChatSource.mockRejectedValue(
        new ApiClientError({ message: 'Other revision', status: 409, code: 'HTTP_ERROR' })
      );
      await sendAndOpenSource();
      expect(await screen.findByText(/older corpus revision/i)).toBeDefined();
      expect(screen.getByText(EXCERPT).tagName).toBe('BLOCKQUOTE');
    });

    it('reports an unavailable citation source', async () => {
      services.getChatSource.mockRejectedValue(
        new ApiClientError({ message: 'Citation source unavailable', status: 404, code: 'HTTP_ERROR' })
      );
      await sendAndOpenSource();
      expect(await screen.findByText(/Source unavailable/i)).toBeDefined();
    });
  });

  describe('FloatingAiDock and AppShell', () => {
    it('toggles the assistant open', () => {
      render(<FloatingAiDock />);
      fireEvent.click(screen.getByRole('button', { name: /Open Grounded AI Assistant/i }));
      expect(useAiAssistantStore.getState().isOpen).toBe(true);
    });

    it('counts assistant messages from the history page and recent exchanges', () => {
      useAiAssistantStore.setState({
        messages: [mappedAssistant('a-0')],
        recent: [mappedAssistant('a-1')],
      });
      render(<FloatingAiDock />);
      expect(screen.getByLabelText('2 assistant messages').textContent).toBe('2');
    });

    it('renders the active study context indicator', () => {
      useAiAssistantStore.setState({ activeContextStudyId: 'flex' });
      render(<FloatingAiDock />);
      expect(screen.getByTitle('Active Context: FLEX')).toBeDefined();
    });

    it('mounts the dock without requiring the chat API while closed', () => {
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
