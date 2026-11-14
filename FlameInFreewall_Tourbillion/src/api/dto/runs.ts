import type {
  CollectionLinkDto,
  ContextDto,
  DecimalString,
  PaginatedPageDto,
  UnavailableFieldsDto,
} from './common';

export interface ConditionDto {
  id: string;
  testRunId: string;
  variable: string;
  valueNumeric: DecimalString | null;
  valueText: string | null;
  unit: string | null;
  dataStatus: string;
  context: ContextDto;
}

export type ConditionPageDto = PaginatedPageDto<ConditionDto>;

export interface MeasurementDto {
  id: string;
  testRunId: string;
  observable: string;
  measuredValue: DecimalString | null;
  unit: string;
  rawAssetRef: string | null;
  uncertainty: DecimalString | null;
  unavailableFields: UnavailableFieldsDto;
  context: ContextDto;
}

export type MeasurementPageDto = PaginatedPageDto<MeasurementDto>;

export interface RunDto {
  id: string;
  investigationId: string;
  externalRunKey: string | null;
  materialType: string | null;
  sampleGeometry: string | null;
  gravity: string | null;
  verification: 'unknown' | string;
  unavailableFields: UnavailableFieldsDto;
  conditions: CollectionLinkDto;
  measurements: CollectionLinkDto;
  context: ContextDto;
}

export type RunPageDto = PaginatedPageDto<RunDto>;

export interface ObservationDto {
  measurement: MeasurementDto;
  run: RunDto;
  context: ContextDto;
}

export type ObservationPageDto = PaginatedPageDto<ObservationDto>;
