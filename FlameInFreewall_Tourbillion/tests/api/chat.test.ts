import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/api/client';
import {
  CHAT_SEND_TIMEOUT_MS,
  createChatSession,
  getChatReadiness,
  getChatSource,
  listChatMessages,
  sendChatMessage,
} from '@/api/services/chatService';
import { mapChatMessageDto, mapChatReadinessDto } from '@/api/mappers';
import {
  clearChatSessionId,
  CHAT_SESSION_KEY,
  readChatSessionId,
  writeChatSessionId,
} from '@/lib/chatSession';

vi.mock('@/api/client', async (original) => ({
  ...(await original<typeof import('@/api/client')>()),
  apiRequest: vi.fn().mockResolvedValue({}),
}));

const request = vi.mocked(apiRequest);
const ID = '11111111-1111-4111-8111-111111111111';

describe('chat service', () => {
  beforeEach(() => request.mockClear());

  it('targets the backend chat routes', async () => {
    await getChatReadiness();
    expect(request).toHaveBeenCalledWith('/chat/readiness', { signal: undefined });
    await createChatSession({});
    expect(request).toHaveBeenLastCalledWith('/chat/sessions', {
      method: 'POST',
      body: {},
      signal: undefined,
    });
    await listChatMessages(ID, { offset: 0, limit: 100 });
    expect(request).toHaveBeenLastCalledWith(`/chat/sessions/${ID}/messages`, {
      query: { offset: 0, limit: 100 },
      signal: undefined,
    });
  });

  it('gives a sent question more time than the backend provider and lock bounds', async () => {
    expect(CHAT_SEND_TIMEOUT_MS).toBeGreaterThanOrEqual(30_000);
    await sendChatMessage(ID, 'FLEX-007 D0?');
    expect(request).toHaveBeenLastCalledWith(`/chat/sessions/${ID}/messages`, {
      method: 'POST',
      body: { question: 'FLEX-007 D0?' },
      signal: undefined,
      timeoutMs: CHAT_SEND_TIMEOUT_MS,
    });
  });

  it('pins source metadata to locator and corpus version', async () => {
    await getChatSource('a/b', 'CSV row 8', 'c'.repeat(64));
    expect(request).toHaveBeenLastCalledWith('/chat/sources/a%2Fb', {
      query: { locator: 'CSV row 8', corpus_version: 'c'.repeat(64) },
      signal: undefined,
    });
  });
});

describe('chat mappers', () => {
  it('maps snake_case messages and keeps citation excerpts verbatim', () => {
    const mapped = mapChatMessageDto({
      id: 'm',
      role: 'assistant',
      created_at: 't',
      answer: {
        state: 'answered',
        text: 'x',
        origin: 'real',
        review_status: 'unreviewed',
        provider_version: 'nasa-extractive-v2',
        model_version: null,
        corpus_version: 'v',
        citations: [
          {
            source_document_id: 's',
            source_locator: 'CSV row 8',
            source_excerpt: ' D0; mm: 1.87 ',
            test_run_id: null,
          },
        ],
      },
    });
    expect(mapped.answer.reviewStatus).toBe('unreviewed');
    expect(mapped.answer.citations[0]).toEqual({
      sourceDocumentId: 's',
      sourceLocator: 'CSV row 8',
      sourceExcerpt: ' D0; mm: 1.87 ',
      testRunId: null,
    });
  });

  it('maps camelCase readiness with safe defaults', () => {
    expect(mapChatReadinessDto({ state: 'not_ready', mode: 'retrieval_only', reasons: ['X'] })).toEqual({
      state: 'not_ready',
      mode: 'retrieval_only',
      providerVersion: null,
      corpusVersion: null,
      passages: null,
      reasons: ['X'],
    });
  });
});

describe('chat session token', () => {
  beforeEach(() => sessionStorage.clear());

  it('stores only well-formed session UUIDs for this tab', () => {
    writeChatSessionId(ID);
    expect(readChatSessionId()).toBe(ID);
    sessionStorage.setItem(CHAT_SESSION_KEY, 'not-a-uuid');
    expect(readChatSessionId()).toBeNull();
    expect(sessionStorage.getItem(CHAT_SESSION_KEY)).toBeNull();
    writeChatSessionId(ID);
    clearChatSessionId();
    expect(readChatSessionId()).toBeNull();
  });
});
