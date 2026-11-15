// Feature: epub-reader, Property 2: Font size is always a valid bounded step and clamps out-of-range to the nearest bound
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import {
  normalizeFontSize,
  FONT_SIZE_OPTIONS,
  FONT_SIZE_DEFAULT,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
} from "../fontSize";

describe("Property 2: normalizeFontSize", () => {
  test("always returns a member of FONT_SIZE_OPTIONS for any input", () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(FONT_SIZE_OPTIONS).toContain(normalizeFontSize(value));
      }),
      { numRuns: 100 },
    );
  });

  test("clamps numbers below the minimum to FONT_SIZE_MIN", () => {
    fc.assert(
      fc.property(
        fc.double({ max: FONT_SIZE_MIN, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          expect(normalizeFontSize(value)).toBe(FONT_SIZE_MIN);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("clamps numbers above the maximum to FONT_SIZE_MAX", () => {
    fc.assert(
      fc.property(
        fc.double({ min: FONT_SIZE_MAX, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          expect(normalizeFontSize(value)).toBe(FONT_SIZE_MAX);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("returns FONT_SIZE_DEFAULT for absent / non-numeric input", () => {
    const nonNumeric = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.string().filter((s) => !Number.isFinite(Number(s)) || s.trim() === ""),
      fc.object(),
      fc.boolean(),
      fc.array(fc.anything()),
    );

    fc.assert(
      fc.property(nonNumeric, (value) => {
        expect(normalizeFontSize(value)).toBe(FONT_SIZE_DEFAULT);
      }),
      { numRuns: 100 },
    );
  });

  test("snaps strictly in-range values to a valid even step", () => {
    // Open interval (12, 32) so the result is a snapped step, not a clamp bound.
    fc.assert(
      fc.property(
        fc.double({
          min: FONT_SIZE_MIN,
          max: FONT_SIZE_MAX,
          minExcluded: true,
          maxExcluded: true,
          noNaN: true,
        }),
        (value) => {
          const result = normalizeFontSize(value);
          expect(FONT_SIZE_OPTIONS).toContain(result);
          // A snapped step is the nearest option: within half a step of input.
          expect(Math.abs(result - value)).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });
});
