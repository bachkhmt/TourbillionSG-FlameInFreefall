import type { DashboardDto } from '@/api/dto';
import type { MappedDashboardSummary, MappedSourceCoverage } from '@/types/api';
import { mapContext, mapUnavailableFields } from './contextMapper';
import { parseDecimalString } from './decimalMapper';
import { mapInvestigationDto } from './investigationMapper';

function mapSourceCoverage(dto: DashboardDto['sourceCoverage']): MappedSourceCoverage {
  const parsedRatio =
    dto.denominator > 0 ? parseDecimalString(dto.ratio) : null;
  const percentage =
    parsedRatio !== null ? Number((parsedRatio * 100).toPrecision(12)) : null;

  return {
    numerator: dto.numerator,
    denominator: dto.denominator,
    ratio: parsedRatio,
    percentage,
    rawRatio: dto.ratio,
  };
}

/**
 * Maps a `DashboardDto` into `MappedDashboardSummary`, preserving unapproved
 * distribution fields as `null` and computing safe `sourceCoverage` percentages.
 */
export function mapDashboardSummaryDto(dto: DashboardDto): MappedDashboardSummary {
  return {
    selection: { ...dto.selection },
    investigationCount: dto.investigationCount,
    runCount: dto.runCount,
    claimCount: dto.claimCount,
    sourceCount: dto.sourceCount,
    verifiedRunCount: dto.verifiedRunCount,
    sourceCoverage: mapSourceCoverage(dto.sourceCoverage),
    fuelDistribution: null,
    facilityDistribution: null,
    gravityDistribution: null,
    featuredInvestigations: dto.featuredInvestigations.map(mapInvestigationDto),
    unavailableFields: mapUnavailableFields(dto.unavailableFields),
    context: mapContext(dto.context),
  };
}
