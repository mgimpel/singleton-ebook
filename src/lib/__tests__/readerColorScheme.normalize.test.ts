// Feature: epub-reader, Property 4: Reader color scheme normalization is total, identity on valid, default on invalid
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import {
  normalizeReaderColorScheme,
  READER_COLOR_SCHEMES,
  DEFAULT_READER_COLOR_SCHEME,
} from "../readerColorScheme";

const validScheme = fc.constantFrom(...READER_COLOR_SCHEMES);

describe("Property 4: normalizeReaderColorScheme", () => {
  test("is total and always returns a member of READER_COLOR_SCHEMES", () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(READER_COLOR_SCHEMES).toContain(normalizeReaderColorScheme(value));
      }),
      { numRuns: 100 },
    );
  });

  test("is the identity on valid schemes", () => {
    fc.assert(
      fc.property(validScheme, (scheme) => {
        expect(normalizeReaderColorScheme(scheme)).toBe(scheme);
      }),
      { numRuns: 100 },
    );
  });

  test("returns the default (system) for any value that is not a scheme", () => {
    const invalid = fc
      .string()
      .filter((v) => !READER_COLOR_SCHEMES.some((scheme) => scheme === v));

    fc.assert(
      fc.property(invalid, (value) => {
        expect(normalizeReaderColorScheme(value)).toBe(DEFAULT_READER_COLOR_SCHEME);
      }),
      { numRuns: 100 },
    );
  });
});
