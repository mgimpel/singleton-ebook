// Feature: epub-reader, Property 8: Reading-location serialize/parse round-trips
// Validates: Requirements 6.1, 6.2
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import {
  serializeReadingLocation,
  parseReadingLocation,
  isValidReadingLocation,
} from "../readingLocation";

describe("Property 8: reading-location serialize/parse round-trip", () => {
  // A valid location is `epubcfi(...)` with non-empty, single-line content.
  // Build the inner payload without newlines so the whole value matches the
  // module's `^epubcfi\(.+\)$` shape, then guard with the real validator.
  const validLocation = fc
    .string({ minLength: 1 })
    .filter((inner) => !/[\r\n]/.test(inner))
    .map((inner) => `epubcfi(${inner})`)
    .filter(isValidReadingLocation);

  test("parse(serialize(loc)) === loc for any valid location", () => {
    fc.assert(
      fc.property(validLocation, (loc) => {
        expect(parseReadingLocation(serializeReadingLocation(loc))).toBe(loc);
      }),
      { numRuns: 100 },
    );
  });
});
