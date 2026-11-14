import type {
  ContextDto,
  PaginatedPageDto,
  UnavailableFieldsDto,
  UnavailableReason,
} from '@/api/dto';
import type { ApiContextMeta, FieldAvailabilityMap, MappedPage } from '@/types/api';

/**
 * Maps backend `ContextDto` provenance metadata to frontend `ApiContextMeta`.
 */
export function mapContext(dto: ContextDto): ApiContextMeta {
  return {
    collectionId: dto.collectionId,
    origin: dto.origin,
    reviewState: dto.reviewState,
    caveats: [...dto.caveats],
    isSynthetic: dto.origin === 'synthetic',
    isUnreviewed: dto.reviewState === 'unreviewed',
  };
}

/**
 * Clones backend `unavailableFields` into a `FieldAvailabilityMap`.
 */
export function mapUnavailableFields(
  dto: UnavailableFieldsDto | null | undefined
): FieldAvailabilityMap {
  return { ...(dto ?? {}) };
}

/**
 * Returns the explicit `UnavailableReason` for `field`, or `null` if available.
 */
export function getFieldUnavailableReason(
  unavailableFields: FieldAvailabilityMap | null | undefined,
  field: string
): UnavailableReason | null {
  return unavailableFields?.[field] ?? null;
}

/**
 * Maps a `PaginatedPageDto<TDto>` envelope into a `MappedPage<TMapped>`.
 */
export function mapPaginatedPage<TDto, TMapped>(
  page: PaginatedPageDto<TDto>,
  mapItem: (item: TDto) => TMapped
): MappedPage<TMapped> {
  const items = page.items.map(mapItem);
  return {
    items,
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.next !== null || page.offset + items.length < page.total,
    next: page.next,
    context: mapContext(page.context),
  };
}
