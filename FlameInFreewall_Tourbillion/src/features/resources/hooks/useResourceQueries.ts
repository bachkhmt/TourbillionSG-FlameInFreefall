import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ChallengeResourceDto, ChallengeResourcePageDto } from "@/api/dto";
import { getOfficialResources } from "@/api/services/resourceService";
import {
  getMockOfficialResources,
  MOCK_OFFICIAL_RESOURCES,
} from "@/api/mockFallback";
import type { ApiQueryOptions } from "@/hooks/api/queryHelpers";
import {
  handleTimeoutFallback,
  isTimeoutError,
  shouldFallback,
} from "@/hooks/api/queryHelpers";

const KIND_ROLE_MAP: Record<string, { kind: string; role: string }> = {};
for (const r of MOCK_OFFICIAL_RESOURCES) {
  KIND_ROLE_MAP[r.resource_id] = {
    kind: r.kind ?? "general",
    role: r.role ?? "",
  };
}

function enrichResource(r: ChallengeResourceDto): ChallengeResourceDto {
  const meta = KIND_ROLE_MAP[r.resource_id];
  return {
    ...r,
    kind: r.kind || meta?.kind || "reference",
    role:
      r.role ||
      meta?.role ||
      "NASA physical science challenge reference document.",
  };
}

export function useOfficialResourcesQuery(
  options?: ApiQueryOptions<ChallengeResourcePageDto>,
): UseQueryResult<ChallengeResourcePageDto, Error> {
  return useQuery<ChallengeResourcePageDto, Error>({
    ...options,
    queryKey: ["official-resources"],
    queryFn: async ({ signal }) => {
      try {
        const dto = await getOfficialResources(signal);
        return {
          items: (dto.items || []).map(enrichResource),
          total: dto.total ?? dto.items?.length ?? 0,
        };
      } catch (err) {
        if (shouldFallback(options?.enableFallback) && isTimeoutError(err)) {
          handleTimeoutFallback(err);
          return { ...getMockOfficialResources(), isFallback: true };
        }
        throw err;
      }
    },
    enabled: options?.enabled ?? true,
  });
}
