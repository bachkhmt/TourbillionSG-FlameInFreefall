/**
 * Chat DTOs, snake_case exactly as the backend chat contract (Phase 6 + ADR-0005).
 */

export type ChatAnswerStateDto = 'answered' | 'abstained' | 'unavailable' | 'timeout';

/** `GET /chat/readiness`: whether sending can succeed, with reason codes. */
export interface ChatReadinessDto {
  state: 'ready' | 'not_ready';
  mode: 'retrieval_only' | 'provider' | 'none' | string;
  provider_version?: string | null;
  corpus_version?: string | null;
  source_revision?: string | null;
  passages?: number | null;
  review_status?: string;
  reasons: string[];
}

export interface ChatSessionCreateDto {
  investigation_id?: string;
  title?: string;
}

export interface ChatSessionDto {
  id: string;
  investigation_id: string | null;
  title: string | null;
  created_at: string;
  expires_at: string;
  privacy: string;
}

export interface ChatCitationDto {
  source_document_id: string;
  source_locator: string;
  source_excerpt: string | null;
  test_run_id?: string | null;
}

export interface ChatAnswerDto {
  state: ChatAnswerStateDto;
  text: string;
  origin: 'synthetic' | 'unknown' | 'real' | string;
  review_status: 'unreviewed' | 'unknown' | string;
  provider_version?: string | null;
  model_version?: string | null;
  corpus_version?: string | null;
  citations: ChatCitationDto[];
}

export interface ChatMessageDto {
  id: string;
  role: 'user' | 'assistant' | string;
  created_at: string;
  answer: ChatAnswerDto;
}

export interface ChatMessagePageDto {
  items: ChatMessageDto[];
  offset: number;
  limit: number;
}

export interface ChatExchangeDto {
  user: ChatMessageDto;
  assistant: ChatMessageDto;
}

/** `GET /chat/sources/{source_document_id}`: registry metadata pinned to a corpus version. */
export interface ChatSourceDto {
  source_document_id: string;
  locator: string;
  corpus_version: string;
  filename: string;
  /** Only https URLs are returned; otherwise null. */
  source_url: string | null;
  sha256: string;
  license: string;
  title: string;
  review_status: string;
}

/** `POST /advisor/assessments`: one bounded provider answer per pillar plus evidence gaps. */
export interface ChatAdvisorOutputDto {
  pillars: Record<string, ChatAnswerDto>;
  gaps: Record<string, string[]>;
  context: Record<string, unknown>;
}
