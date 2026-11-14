import type { InvestigationDto } from './catalog';
import type { ContextDto, UnavailableFieldsDto } from './common';
import type { ObservationPageDto } from './runs';

export interface ComparisonRequestDto {
  investigationIds: string[];
  observationOffset?: number;
  observationLimit?: number;
}

export interface ComparisonStudyDto {
  investigation: InvestigationDto;
  observations: ObservationPageDto;
  context: ContextDto;
}

export interface ComparisonDto {
  studies: ComparisonStudyDto[];
  deltas: null;
  highlights: null;
  comparability: 'not_established' | string;
  unavailableFields: UnavailableFieldsDto;
  context: ContextDto;
}
