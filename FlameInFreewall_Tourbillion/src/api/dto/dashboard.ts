import type { InvestigationDto } from './catalog';
import type { ContextDto, DecimalString, UnavailableFieldsDto } from './common';

export interface SourceCoverageDto {
  numerator: number;
  denominator: number;
  ratio: DecimalString | null;
}

export interface DashboardDto {
  selection: Record<string, string>;
  investigationCount: number;
  runCount: number;
  claimCount: number;
  sourceCount: number;
  verifiedRunCount: null;
  sourceCoverage: SourceCoverageDto;
  fuelDistribution: null;
  facilityDistribution: null;
  gravityDistribution: null;
  featuredInvestigations: InvestigationDto[];
  unavailableFields: UnavailableFieldsDto;
  context: ContextDto;
}
