export interface SessionInputDto {
  investigationId?: string | null;
  title?: string | null;
}

export interface QuestionDto {
  question: string;
}

export interface SessionOutputDto {
  id: string;
  investigationId: string | null;
  title: string | null;
  createdAt: string;
  expiresAt: string;
  privacy: string;
}

export interface CitationDto {
  sourceDocumentId: string;
  sourceLocator: string;
  sourceExcerpt?: string | null;
  testRunId?: string | null;
}

export type AnswerStateDto = 'answered' | 'abstained' | 'unavailable' | 'timeout';

export interface AnswerDto {
  state: AnswerStateDto;
  text: string;
  origin?: 'synthetic' | 'unknown' | 'real';
  reviewStatus?: 'unreviewed' | 'unknown';
  providerVersion?: string | null;
  modelVersion?: string | null;
  corpusVersion?: string | null;
  citations: CitationDto[];
}

export interface MessageOutputDto {
  id: string;
  role: string;
  createdAt: string;
  answer: AnswerDto;
}

export interface MessagePageDto {
  items: MessageOutputDto[];
  offset: number;
  limit: number;
}

export interface ExchangeDto {
  user: MessageOutputDto;
  assistant: MessageOutputDto;
}

export interface AdvisorOutputDto {
  pillars: Record<string, AnswerDto>;
  gaps: Record<string, string[]>;
  context: Record<string, unknown>;
}
