/**
 * NASA chat DTOs. Core chat schemas from the backend are snake_case; the
 * integration-only `/chat/readiness` and `/chat/sources/{id}` routes are camelCase.
 */

export type ChatAnswerStateDto = 'answered' | 'abstained' | 'unavailable' | 'timeout';

/** `GET /chat/readiness` (camelCase, integrations/nasa_chat). */
export interface ChatReadinessDto {
  state: 'ready' | 'not_ready';
  mode: string;
  providerVersion?: string;
  corpusVersion?: string;
  sourceRevision?: string;
  passages?: number;
  reviewStatus?: string;
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

/** `GET /chat/sources/{id}` (camelCase, revision-pinned registry entry). */
export interface ChatSourceDto {
  sourceId: string;
  locator: string;
  corpusVersion: string;
  filename: string;
  sourceUrl: string;
  sha256: string;
  license: string;
  title: string;
  slug: string;
  investigationId: string;
  version: string;
  reviewStatus: string;
}
