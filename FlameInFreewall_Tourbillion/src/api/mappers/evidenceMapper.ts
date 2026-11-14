import type { ClaimDto, ClaimSourceDto, SourceDto } from '@/api/dto';
import type { MappedClaim, MappedClaimSource, MappedSource } from '@/types/api';
import { mapContext } from './contextMapper';

/** Maps a `SourceDto` into a `MappedSource`. */
export function mapSourceDto(dto: SourceDto): MappedSource {
  return {
    id: dto.id,
    investigationId: dto.investigationId,
    sourceUrl: dto.sourceUrl,
    doi: dto.doi,
    documentType: dto.documentType,
    version: dto.version,
    ingestionStatus: dto.ingestionStatus,
    context: mapContext(dto.context),
  };
}

/** Maps a `ClaimSourceDto` into a `MappedClaimSource`. */
export function mapClaimSourceDto(dto: ClaimSourceDto): MappedClaimSource {
  return {
    id: dto.id,
    claimId: dto.claimId,
    source: mapSourceDto(dto.source),
    testRunId: dto.testRunId,
    runInvestigationId: dto.runInvestigationId,
    sourceLocator: dto.sourceLocator,
    sourceExcerpt: dto.sourceExcerpt,
    contextMismatch: dto.contextMismatch,
    context: mapContext(dto.context),
  };
}

/** Maps a `ClaimDto` into a `MappedClaim` with `hasContextMismatch` derived from sources. */
export function mapClaimDto(dto: ClaimDto): MappedClaim {
  const sources = dto.sources.items.map(mapClaimSourceDto);
  return {
    id: dto.id,
    claimText: dto.claimText,
    evidenceStatus: dto.evidenceStatus,
    reviewStatus: dto.reviewStatus,
    limitation: dto.limitation,
    createdAt: dto.createdAt,
    sources,
    sourcesTotal: dto.sources.total,
    hasContextMismatch: sources.some((source) => source.contextMismatch),
    context: mapContext(dto.context),
  };
}
