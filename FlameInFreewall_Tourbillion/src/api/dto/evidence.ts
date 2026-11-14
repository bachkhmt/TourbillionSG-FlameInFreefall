import type { ContextDto, PaginatedPageDto } from './common';

export interface SourceDto {
  id: string;
  investigationId: string;
  sourceUrl: string;
  doi: string | null;
  documentType: string;
  version: string | null;
  ingestionStatus: string;
  context: ContextDto;
}

export type SourcePageDto = PaginatedPageDto<SourceDto>;

export interface ClaimSourceDto {
  id: string;
  claimId: string;
  source: SourceDto;
  testRunId: string | null;
  runInvestigationId: string | null;
  sourceLocator: string;
  sourceExcerpt: string | null;
  contextMismatch: boolean;
  context: ContextDto;
}

export type ClaimSourcePageDto = PaginatedPageDto<ClaimSourceDto>;

export interface ClaimDto {
  id: string;
  claimText: string;
  evidenceStatus: string;
  reviewStatus: string;
  limitation: string | null;
  createdAt: string;
  sources: ClaimSourcePageDto;
  context: ContextDto;
}

export type ClaimPageDto = PaginatedPageDto<ClaimDto>;
