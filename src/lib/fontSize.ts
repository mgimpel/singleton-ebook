// Framework-agnostic reader font-size logic. No framework imports.

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 32;
export const FONT_SIZE_STEP = 2;
export const FONT_SIZE_DEFAULT = 18;

// [12, 14, 16, ..., 32] — the discrete, in-bounds steps.
export const FONT_SIZE_OPTIONS: readonly number[] = Array.from(
  { length: (FONT_SIZE_MAX - FONT_SIZE_MIN) / FONT_SIZE_STEP + 1 },
  (_, i) => FONT_SIZE_MIN + i * FONT_SIZE_STEP,
);

/**
 * Coerce an unknown value to a finite number, or null if it isn't one.
 * Accepts numbers and numeric strings (the persisted value is stored as a
 * string). Empty/whitespace strings, null, undefined, and non-numeric strings
 * are rejected — so they fall through to the default rather than becoming 0.
 */
function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * The single validator for both user requests (clamp) and persisted reads.
 * Returns a member of FONT_SIZE_OPTIONS: clamps out-of-range numbers to the
 * nearest bound, snaps in-range values to the nearest 2px step (ties round up),
 * and returns FONT_SIZE_DEFAULT for absent/non-numeric input.
 */
export function normalizeFontSize(value: unknown): number {
  const n = toFiniteNumber(value);
  if (n === null) {
    return FONT_SIZE_DEFAULT;
  }
  if (n <= FONT_SIZE_MIN) {
    return FONT_SIZE_MIN;
  }
  if (n >= FONT_SIZE_MAX) {
    return FONT_SIZE_MAX;
  }
  // Snap to the nearest step. Math.round breaks .5 ties upward, consistently.
  const steps = Math.round((n - FONT_SIZE_MIN) / FONT_SIZE_STEP);
  return FONT_SIZE_MIN + steps * FONT_SIZE_STEP;
}

/**
 * Step up (direction 1) or down (-1) one 2px increment, staying within bounds.
 * Normalizes first so a bogus current value still steps from a valid base.
 */
export function stepFontSize(value: number, direction: 1 | -1): number {
  const current = normalizeFontSize(value);
  const next = current + direction * FONT_SIZE_STEP;
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, next));
}
