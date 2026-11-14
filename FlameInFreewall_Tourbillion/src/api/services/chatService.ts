import { apiGet, apiPost } from '../client';
import type {
  AdvisorOutputDto,
  ExchangeDto,
  MessagePageDto,
  PaginationParamsDto,
  QuestionDto,
  SessionInputDto,
  SessionOutputDto,
} from '../dto';
import type { EvaluationRequestDto } from '../dto/scenarios';

/**
 * Creates a new chat session with optional investigation context (`POST /chat/sessions`).
 */
export function createChatSession(
  payload?: SessionInputDto,
  signal?: AbortSignal
): Promise<SessionOutputDto> {
  return apiPost<SessionOutputDto>('/chat/sessions', payload ?? {}, signal);
}

/**
 * Retrieves an active chat session by ID (`GET /chat/sessions/{identity}`).
 */
export function getChatSession(
  identity: string,
  signal?: AbortSignal
): Promise<SessionOutputDto> {
  return apiGet<SessionOutputDto>(`/chat/sessions/${encodeURIComponent(identity)}`, undefined, signal);
}

/**
 * Retrieves paginated conversation history (`GET /chat/sessions/{identity}/messages`).
 */
export function getChatMessages(
  identity: string,
  pagination?: PaginationParamsDto,
  signal?: AbortSignal
): Promise<MessagePageDto> {
  return apiGet<MessagePageDto>(
    `/chat/sessions/${encodeURIComponent(identity)}/messages`,
    pagination ? { offset: pagination.offset, limit: pagination.limit } : undefined,
    signal
  );
}

/**
 * Sends a question into the chat session and awaits an evidence-grounded answer (`POST /chat/sessions/{identity}/messages`).
 */
export function sendChatMessage(
  identity: string,
  question: string,
  signal?: AbortSignal
): Promise<ExchangeDto> {
  const payload: QuestionDto = { question };
  return apiPost<ExchangeDto>(
    `/chat/sessions/${encodeURIComponent(identity)}/messages`,
    payload,
    signal
  );
}

/**
 * Runs a multi-pillar grounded advisor assessment (`POST /advisor/assessments`).
 */
export function getAdvisorAssessment(
  payload: EvaluationRequestDto,
  signal?: AbortSignal
): Promise<AdvisorOutputDto> {
  return apiPost<AdvisorOutputDto>('/advisor/assessments', payload, signal);
}
