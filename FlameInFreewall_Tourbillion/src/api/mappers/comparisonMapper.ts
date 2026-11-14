import type { ComparisonDto, ComparisonStudyDto } from '@/api/dto';
import type {
  MappedComparisonResult,
  MappedComparisonStudy,
  MappedObservableSummary,
  MappedObservation,
} from '@/types/api';
import {
  mapContext,
  mapPaginatedPage,
  mapUnavailableFields,
} from './contextMapper';
import { computeNumericRange } from './decimalMapper';
import { mapInvestigationDto } from './investigationMapper';
import { mapObservationDto } from './runMapper';

function collectUniqueStrings(values: ReadonlyArray<string | null>): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) seen.add(trimmed);
  }
  return Array.from(seen);
}

function summarizeObservables(
  observations: ReadonlyArray<MappedObservation>
): MappedObservableSummary[] {
  const groups = new Map<
    string,
    { observable: string; unit: string; values: Array<number | null>; count: number }
  >();

  for (const { measurement } of observations) {
    const key = `${measurement.observable}\0${measurement.unit}`;
    const existing = groups.get(key);
    if (existing) {
      existing.values.push(measurement.measuredValue);
      existing.count += 1;
    } else {
      groups.set(key, {
        observable: measurement.observable,
        unit: measurement.unit,
        values: [measurement.measuredValue],
        count: 1,
      });
    }
  }

  return Array.from(groups.values()).map(({ observable, unit, values, count }) => {
    const { min, max } = computeNumericRange(values);
    return { observable, unit, count, minValue: min, maxValue: max };
  });
}

function mapComparisonStudy(dto: ComparisonStudyDto): MappedComparisonStudy {
  const observations = mapPaginatedPage(dto.observations, mapObservationDto);
  return {
    investigation: mapInvestigationDto(dto.investigation),
    observations,
    observableSummaries: summarizeObservables(observations.items),
    observedMaterials: collectUniqueStrings(
      observations.items.map((obs) => obs.run.materialType)
    ),
    observedGravities: collectUniqueStrings(
      observations.items.map((obs) => obs.run.gravity)
    ),
    context: mapContext(dto.context),
  };
}

/**
 * Maps a `ComparisonDto` into `MappedComparisonResult`, keeping unapproved
 * `deltas` and `highlights` strictly `null` while summarizing observed values.
 */
export function mapComparisonDto(dto: ComparisonDto): MappedComparisonResult {
  return {
    studies: dto.studies.map(mapComparisonStudy),
    deltas: null,
    highlights: null,
    comparability: dto.comparability,
    unavailableFields: mapUnavailableFields(dto.unavailableFields),
    context: mapContext(dto.context),
  };
}
