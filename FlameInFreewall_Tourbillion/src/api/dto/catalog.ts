import type {
  CollectionLinkDto,
  ContextDto,
  PaginatedPageDto,
  PaginationParamsDto,
  UnavailableFieldsDto,
} from './common';

export interface TagDto {
  id: string;
  slug: string;
  label: string;
  category: string | null;
  context: ContextDto;
}

export type TagPageDto = PaginatedPageDto<TagDto>;

export interface InvestigationDto {
  id: string;
  psiId: string;
  slug: string | null;
  title: string;
  researchPurpose: string | null;
  platform: string | null;
  tags: TagPageDto;
  unavailableFields: UnavailableFieldsDto;
  context: ContextDto;
}

export interface InvestigationDetailDto extends InvestigationDto {
  runs: CollectionLinkDto;
  sources: CollectionLinkDto;
  claims: CollectionLinkDto;
}

export type InvestigationPageDto = PaginatedPageDto<InvestigationDto>;

export type CatalogSortDto = 'title-asc' | 'runs-desc';

export interface InvestigationFilterParamsDto {
  q?: string;
  platform?: string;
  material?: string;
  gravityRaw?: string;
  tag?: string;
  purpose?: string;
  sourceType?: string;
  evidenceStatus?: string;
  reviewStatus?: string;
}

export interface InvestigationListParamsDto
  extends InvestigationFilterParamsDto,
    PaginationParamsDto {
  sort?: CatalogSortDto;
}

export interface CatalogCapabilitiesDto {
  supportedFilters: string[];
  supportedSorts: string[];
  unsupportedFilters: string[];
  unsupportedSorts: string[];
  unavailableDisplayFields: string[];
  maxPageSize: number;
  context: ContextDto;
}
