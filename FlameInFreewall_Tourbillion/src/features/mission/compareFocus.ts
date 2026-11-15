import { useQueries } from '@tanstack/react-query';
import { mapInvestigationDetailDto } from '@/api/mappers';
import { getInvestigationById } from '@/api/services';
import { apiQueryKeys } from '@/hooks/api/queryKeys';
import { isUuid } from '@/hooks/api/queryHelpers';

/**
 * Investigations handed over from the compare tray/modal via `/mission?compare=a,b,c`.
 * Keys may be investigation UUIDs or catalog slugs. Max 3, matching the compare tray.
 */
export const MAX_COMPARE_FOCUS = 3;
const KEY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function parseCompareFocus(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const keys = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => KEY.test(part));
  return [...new Set(keys)].slice(0, MAX_COMPARE_FOCUS);
}

/**
 * The compare tray stores investigation UUIDs, while mission research rows use the
 * catalog slug. Resolve UUIDs through the catalog detail endpoint (shared cache with
 * the explorer); slugs pass through. A UUID that cannot be resolved stays as-is and
 * is reported by the panel as not returned, never silently dropped.
 */
export function useMissionFocusKeys(raw: string | null | undefined): string[] {
  const parsed = parseCompareFocus(raw);
  const results = useQueries({
    queries: parsed.map((key) => ({
      queryKey: apiQueryKeys.investigationDetail(key),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        mapInvestigationDetailDto(await getInvestigationById(key, signal)),
      enabled: isUuid(key),
      staleTime: Infinity,
    })),
  });
  const keys = parsed.map((key, i) => (isUuid(key) ? results[i].data?.routeKey ?? key : key));
  return [...new Set(keys)];
}
