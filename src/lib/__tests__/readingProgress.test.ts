// Feature: epub-reader, Property 9: Reading progress is clamped to [0,1] and formatted within 0–100%
// Validates: Requirements 6.3
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import { clampFraction, formatProgressPercent } from "../readingProgress";

describe("Property 9: reading progress clamp/format", () => {
  // Include the hard cases the function promises to handle: NaN, ±Infinity,
  // negatives and values > 1.
  const anyDouble = fc.double({
    noNaN: false,
    noDefaultInfinity: false,
  });

  test("clampFraction returns a value in [0,1] (NaN -> 0)", () => {
    fc.assert(
      fc.property(anyDouble, (fraction) => {
        const clamped = clampFraction(fraction);
        expect(clamped).toBeGreaterThanOrEqual(0);
        expect(clamped).toBeLessThanOrEqual(1);

        if (Number.isNaN(fraction)) expect(clamped).toBe(0);
      }),
      { numRuns: 200 },
    );
  });

  test('formatProgressPercent returns an integer-percent string in "0%"–"100%"', () => {
    fc.assert(
      fc.property(anyDouble, (fraction) => {
        const formatted = formatProgressPercent(fraction);
        expect(formatted).toMatch(/^\d+%$/);
        const percent = Number.parseInt(formatted, 10);
        expect(Number.isInteger(percent)).toBe(true);
        expect(percent).toBeGreaterThanOrEqual(0);
        expect(percent).toBeLessThanOrEqual(100);
      }),
      { numRuns: 200 },
    );
  });
});
