import type {
  CatalogCapabilitiesDto,
  InvestigationDetailDto,
  InvestigationDto,
  TagDto,
} from '@/api/dto';
import type {
  MappedCatalogCapabilities,
  MappedInvestigation,
  MappedInvestigationDetail,
  MappedTag,
} from '@/types/api';
import { mapContext, mapUnavailableFields } from './contextMapper';

/** Maps a `TagDto` into a `MappedTag`. */
export function mapTagDto(dto: TagDto): MappedTag {
  return {
    id: dto.id,
    slug: dto.slug,
    label: dto.label,
    category: dto.category,
    context: mapContext(dto.context),
  };
}

/** Maps an `InvestigationDto` into a `MappedInvestigation` (`routeKey = slug ?? id`). */
export function mapInvestigationDto(dto: InvestigationDto): MappedInvestigation {
  const routeKey = dto.slug && dto.slug.trim().length > 0 ? dto.slug : dto.id;
  return {
    id: dto.id,
    psiId: dto.psiId,
    slug: dto.slug,
    routeKey,
    title: dto.title,
    researchPurpose: dto.researchPurpose,
    platform: dto.platform,
    tags: dto.tags.items.map(mapTagDto),
    tagsTotal: dto.tags.total,
    unavailableFields: mapUnavailableFields(dto.unavailableFields),
    context: mapContext(dto.context),
  };
}

/** Maps an `InvestigationDetailDto` including `runsMeta`, `sourcesMeta`, and `claimsMeta`. */
export function mapInvestigationDetailDto(
  dto: InvestigationDetailDto
): MappedInvestigationDetail {
  return {
    ...mapInvestigationDto(dto),
    runsMeta: { href: dto.runs.href, total: dto.runs.total },
    sourcesMeta: { href: dto.sources.href, total: dto.sources.total },
    claimsMeta: { href: dto.claims.href, total: dto.claims.total },
  };
}

/** Maps a `CatalogCapabilitiesDto` into a `MappedCatalogCapabilities`. */
export function mapCatalogCapabilitiesDto(
  dto: CatalogCapabilitiesDto
): MappedCatalogCapabilities {
  return {
    supportedFilters: [...dto.supportedFilters],
    supportedSorts: [...dto.supportedSorts],
    unsupportedFilters: [...dto.unsupportedFilters],
    unsupportedSorts: [...dto.unsupportedSorts],
    unavailableDisplayFields: [...dto.unavailableDisplayFields],
    maxPageSize: dto.maxPageSize,
    context: mapContext(dto.context),
  };
}
