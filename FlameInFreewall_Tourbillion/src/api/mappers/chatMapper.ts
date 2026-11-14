import type {
  ChatAnswerDto,
  ChatCitationDto,
  ChatMessageDto,
  ChatReadinessDto,
  ChatSessionDto,
  ChatSourceDto,
} from '../dto';
import type {
  MappedChatAnswer,
  MappedChatCitation,
  MappedChatMessage,
  MappedChatReadiness,
  MappedChatSession,
  MappedChatSource,
} from '@/types/api';

/** Citation excerpts are verbatim source slices; never trim or rewrite them. */
export function mapChatCitationDto(dto: ChatCitationDto): MappedChatCitation {
  return {
    sourceDocumentId: dto.source_document_id,
    sourceLocator: dto.source_locator,
    sourceExcerpt: dto.source_excerpt ?? null,
    testRunId: dto.test_run_id ?? null,
  };
}

export function mapChatAnswerDto(dto: ChatAnswerDto): MappedChatAnswer {
  return {
    state: dto.state,
    text: dto.text,
    origin: dto.origin,
    reviewStatus: dto.review_status,
    providerVersion: dto.provider_version ?? null,
    corpusVersion: dto.corpus_version ?? null,
    citations: (dto.citations ?? []).map(mapChatCitationDto),
  };
}

export function mapChatMessageDto(dto: ChatMessageDto): MappedChatMessage {
  return {
    id: dto.id,
    role: dto.role === 'assistant' ? 'assistant' : 'user',
    createdAt: dto.created_at,
    answer: mapChatAnswerDto(dto.answer),
  };
}

export function mapChatReadinessDto(dto: ChatReadinessDto): MappedChatReadiness {
  return {
    state: dto.state === 'ready' ? 'ready' : 'not_ready',
    mode: dto.mode,
    providerVersion: dto.provider_version ?? null,
    corpusVersion: dto.corpus_version ?? null,
    passages: typeof dto.passages === 'number' ? dto.passages : null,
    reasons: dto.reasons ?? [],
  };
}

export function mapChatSessionDto(dto: ChatSessionDto): MappedChatSession {
  return {
    id: dto.id,
    investigationId: dto.investigation_id ?? null,
    expiresAt: dto.expires_at,
    privacy: dto.privacy,
  };
}

export function mapChatSourceDto(dto: ChatSourceDto): MappedChatSource {
  return {
    sourceId: dto.source_document_id,
    locator: dto.locator,
    corpusVersion: dto.corpus_version,
    filename: dto.filename,
    // Only https links are rendered as clickable; anything else stays plain text.
    sourceUrl: dto.source_url && /^https:\/\//i.test(dto.source_url) ? dto.source_url : null,
    sha256: dto.sha256,
    license: dto.license,
    title: dto.title,
    reviewStatus: dto.review_status,
  };
}
