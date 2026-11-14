export type DecimalString = string;

export const UNAVAILABLE_FIELD_REASONS = [
  'MISSING_SOURCE_DATA',
  'UNSUPPORTED_MAPPING',
  'VERIFICATION_NOT_ESTABLISHED',
  'SCIENTIFIC_COMPARISON_NOT_APPROVED',
  'NO_DENOMINATOR',
  'ASSET_CONTRACT_PENDING',
] as const;

export type UnavailableReason = (typeof UNAVAILABLE_FIELD_REASONS)[number];

export type UnavailableFieldsDto = Record<string, UnavailableReason>;

export type DataOriginDto = 'synthetic' | 'real' | 'unknown';

export type ReviewStateDto = 'unreviewed' | 'curated' | 'unknown';

export interface ContextDto {
  collectionId: string;
  origin: DataOriginDto;
  reviewState: ReviewStateDto;
  caveats: string[];
}

export interface CollectionLinkDto {
  href: string;
  total: number;
}

export interface PaginationParamsDto {
  offset?: number;
  limit?: number;
}

export interface PaginatedPageDto<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  next: string | null;
  context: ContextDto;
}

export type ApiErrorCodeDto =
  | 'ENTITY_NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'UNSUPPORTED_CAPABILITY'
  | 'COLLECTION_SCOPE_INVALID'
  | 'IDENTITY_MAPPING_UNAVAILABLE'
  | 'DATA_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ErrorDetailDto {
  code: ApiErrorCodeDto | string;
  message: string;
  fields: string[];
  supportedValues: string[];
}

export interface ApiErrorEnvelopeDto {
  error: ErrorDetailDto;
  context: ContextDto;
}

const VALID_ORIGINS: ReadonlySet<string> = new Set<DataOriginDto>([
  'synthetic',
  'real',
  'unknown',
]);

const VALID_REVIEW_STATES: ReadonlySet<string> = new Set<ReviewStateDto>([
  'unreviewed',
  'curated',
  'unknown',
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isContextDto(value: unknown): value is ContextDto {
  if (!isPlainRecord(value)) return false;
  return (
    typeof value.collectionId === 'string' &&
    typeof value.origin === 'string' &&
    VALID_ORIGINS.has(value.origin) &&
    typeof value.reviewState === 'string' &&
    VALID_REVIEW_STATES.has(value.reviewState) &&
    isStringArray(value.caveats)
  );
}

/**
 * Runtime type guard for backend `ApiErrorEnvelopeDto` payloads.
 */
export function isApiErrorEnvelopeDto(value: unknown): value is ApiErrorEnvelopeDto {
  if (!isPlainRecord(value)) return false;
  if (!isPlainRecord(value.error) || !isContextDto(value.context)) return false;

  const { code, message, fields, supportedValues } = value.error;
  return (
    typeof code === 'string' &&
    typeof message === 'string' &&
    isStringArray(fields) &&
    isStringArray(supportedValues)
  );
}
