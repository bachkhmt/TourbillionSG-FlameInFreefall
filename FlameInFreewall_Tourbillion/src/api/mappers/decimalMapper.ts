import type { DecimalString } from '@/api/dto';

const STRICT_DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

/**
 * Strictly parses a backend `DecimalString` into a finite JS `number`.
 * Rejects scientific notation, non-decimal strings, `NaN`, and `Infinity`.
 */
export function parseDecimalString(value: DecimalString | null | undefined): number | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!STRICT_DECIMAL_PATTERN.test(trimmed)) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;

  return parsed === 0 ? 0 : parsed;
}

/**
 * Formats a `DecimalString` or numeric value with an optional unit, returning
 * `fallback` when the value is nullish or invalid.
 */
export function formatDecimalDisplay(
  value: DecimalString | number | null | undefined,
  unit?: string | null,
  fallback = '—'
): string {
  const numeric =
    typeof value === 'number'
      ? Number.isFinite(value)
        ? value === 0
          ? 0
          : value
        : null
      : parseDecimalString(value);

  if (numeric === null) return fallback;

  const trimmedUnit = unit?.trim();
  return trimmedUnit ? `${numeric} ${trimmedUnit}` : String(numeric);
}

/**
 * Computes `{ min, max, count }` across valid numeric / `DecimalString` values.
 */
export function computeNumericRange(
  values: ReadonlyArray<DecimalString | number | null | undefined>
): { min: number | null; max: number | null; count: number } {
  const nums: number[] = [];

  for (const item of values) {
    if (typeof item === 'number') {
      if (Number.isFinite(item)) nums.push(item === 0 ? 0 : item);
      continue;
    }

    const parsed = parseDecimalString(item);
    if (parsed !== null) nums.push(parsed);
  }

  if (nums.length === 0) {
    return { min: null, max: null, count: 0 };
  }

  return {
    min: Math.min(...nums),
    max: Math.max(...nums),
    count: nums.length,
  };
}
