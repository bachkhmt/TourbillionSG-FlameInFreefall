import { apiRequest } from '../client';
import type {
  ChatAdvisorOutputDto,
  ChatExchangeDto,
  ChatMessagePageDto,
  ChatReadinessDto,
  ChatSessionCreateDto,
  ChatSessionDto,
  ChatSourceDto,
  EvaluationRequestDto,
  PaginationParamsDto,
} from '../dto';

/**
 * Per-request timeout for sending a question. The backend bounds the provider at 10 s
 * plus up to 5 s waiting for the per-session lock, so the client must wait longer than
 * the default 10 s or it would abort before the server can answer `timeout`.
 */
export const CHAT_SEND_TIMEOUT_MS = 30_000;

const id = encodeURIComponent;

/** Corpus/writer readiness (`GET /chat/readiness`). */
export function getChatReadiness(signal?: AbortSignal): Promise<ChatReadinessDto> {
  return apiRequest<ChatReadinessDto>('/chat/readiness', { signal });
}

/** Creates an opaque 24-hour demo session (`POST /chat/sessions`). */
export function createChatSession(
  body: ChatSessionCreateDto,
  signal?: AbortSignal
): Promise<ChatSessionDto> {
  return apiRequest<ChatSessionDto>('/chat/sessions', { method: 'POST', body, signal });
}

/** Reads a session; 404 means expired or unknown (`GET /chat/sessions/{id}`). */
export function getChatSession(sessionId: string, signal?: AbortSignal): Promise<ChatSessionDto> {
  return apiRequest<ChatSessionDto>(`/chat/sessions/${id(sessionId)}`, { signal });
}

/** Lists stored messages oldest first (`GET /chat/sessions/{id}/messages`). */
export function listChatMessages(
  sessionId: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<ChatMessagePageDto> {
  return apiRequest<ChatMessagePageDto>(`/chat/sessions/${id(sessionId)}/messages`, {
    query: pagination ? { offset: pagination.offset, limit: pagination.limit } : undefined,
    signal,
  });
}

/** Sends one question; the server stores the user + assistant pair atomically. */
export function sendChatMessage(
  sessionId: string,
  question: string,
  signal?: AbortSignal
): Promise<ChatExchangeDto> {
  return apiRequest<ChatExchangeDto>(`/chat/sessions/${id(sessionId)}/messages`, {
    method: 'POST',
    body: { question },
    signal,
    timeoutMs: CHAT_SEND_TIMEOUT_MS,
  });
}

/** Revision-pinned citation source metadata (`GET /chat/sources/{id}`); 409 = older corpus. */
export function getChatSource(
  sourceId: string,
  locator: string,
  corpusVersion: string,
  signal?: AbortSignal
): Promise<ChatSourceDto> {
  return apiRequest<ChatSourceDto>(`/chat/sources/${id(sourceId)}`, {
    query: { locator, corpus_version: corpusVersion },
    signal,
  });
}

/** Per-pillar grounded advisor assessment (`POST /advisor/assessments`). No local fallback. */
export function getAdvisorAssessment(
  payload: EvaluationRequestDto,
  signal?: AbortSignal
): Promise<ChatAdvisorOutputDto> {
  return apiRequest<ChatAdvisorOutputDto>('/advisor/assessments', {
    method: 'POST',
    body: payload,
    signal,
  });
}
