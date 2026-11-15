// Framework-agnostic reading-progress logic. No framework imports.

/**
 * Clamp a progress fraction to the inclusive range [0, 1].
 * Non-finite inputs are handled: NaN -> 0, -Infinity / negatives -> 0,
 * +Infinity / values > 1 -> 1. Total over any number input.
 */
export function clampFraction(fraction: number): number {
  if (Number.isNaN(fraction) || fraction < 0) return 0;

  if (fraction > 1) return 1;

  return fraction;
}

/**
 * Clamp the fraction to [0, 1] then format it as an integer-percent string.
 * Always within the inclusive range "0%"–"100%", e.g. "37%".
 */
export function formatProgressPercent(fraction: number): string {
  return `${Math.round(clampFraction(fraction) * 100)}%`;
}
