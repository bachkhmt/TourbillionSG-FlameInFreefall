import type {
  ConditionDto,
  MeasurementDto,
  ObservationDto,
  RunDto,
} from '@/api/dto';
import type {
  MappedCondition,
  MappedMeasurement,
  MappedObservation,
  MappedRun,
} from '@/types/api';
import { mapContext, mapUnavailableFields } from './contextMapper';
import { formatDecimalDisplay, parseDecimalString } from './decimalMapper';

function formatConditionDisplay(dto: ConditionDto, valueNumeric: number | null): string {
  if (valueNumeric !== null) {
    return formatDecimalDisplay(valueNumeric, dto.unit);
  }
  const text = dto.valueText?.trim();
  if (!text) return '—';
  const unit = dto.unit?.trim();
  return unit ? `${text} ${unit}` : text;
}

/** Maps a `ConditionDto` into a `MappedCondition`. */
export function mapConditionDto(dto: ConditionDto): MappedCondition {
  const valueNumeric = parseDecimalString(dto.valueNumeric);
  return {
    id: dto.id,
    testRunId: dto.testRunId,
    variable: dto.variable,
    valueNumeric,
    rawValueNumeric: dto.valueNumeric,
    valueText: dto.valueText,
    displayValue: formatConditionDisplay(dto, valueNumeric),
    unit: dto.unit,
    dataStatus: dto.dataStatus,
    context: mapContext(dto.context),
  };
}

/** Maps a `MeasurementDto` into a `MappedMeasurement`. */
export function mapMeasurementDto(dto: MeasurementDto): MappedMeasurement {
  return {
    id: dto.id,
    testRunId: dto.testRunId,
    observable: dto.observable,
    measuredValue: parseDecimalString(dto.measuredValue),
    rawMeasuredValue: dto.measuredValue,
    unit: dto.unit,
    rawAssetRef: dto.rawAssetRef,
    uncertainty: parseDecimalString(dto.uncertainty),
    rawUncertainty: dto.uncertainty,
    displayValue: formatDecimalDisplay(dto.measuredValue, dto.unit),
    unavailableFields: mapUnavailableFields(dto.unavailableFields),
    context: mapContext(dto.context),
  };
}

/** Maps a `RunDto` into a `MappedRun`. */
export function mapRunDto(dto: RunDto): MappedRun {
  return {
    id: dto.id,
    investigationId: dto.investigationId,
    externalRunKey: dto.externalRunKey,
    materialType: dto.materialType,
    sampleGeometry: dto.sampleGeometry,
    gravity: dto.gravity,
    verification: dto.verification,
    conditionsCount: dto.conditions.total,
    measurementsCount: dto.measurements.total,
    unavailableFields: mapUnavailableFields(dto.unavailableFields),
    context: mapContext(dto.context),
  };
}

/** Maps an `ObservationDto` into a `MappedObservation`. */
export function mapObservationDto(dto: ObservationDto): MappedObservation {
  return {
    measurement: mapMeasurementDto(dto.measurement),
    run: mapRunDto(dto.run),
    context: mapContext(dto.context),
  };
}
