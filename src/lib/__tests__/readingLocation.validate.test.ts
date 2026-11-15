// Feature: epub-reader, Property 7: Reading-location validation accepts only CFI-shaped strings
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import { isValidReadingLocation, parseReadingLocation } from "../readingLocation";

// The real shape regex is /^epubcfi\(.+\)$/. `.` excludes newlines and `$`
// can match before a trailing newline, so a CFI-shaped string is
// `epubcfi(` + non-empty inner text with no newline + `)`, with no trailing
// newline. Generate inner content from printable-ish strings minus newlines.
const noNewline = (s: string) => !/[\n\r]/.test(s);
const innerContent = fc.string({ minLength: 1 }).filter(noNewline);
const validCfi = innerContent.map((inner) => `epubcfi(${inner})`);

describe("Property 7: reading-location validation accepts only CFI-shaped strings", () => {
  test("accepts CFI-shaped strings; parse returns the value unchanged", () => {
    fc.assert(
      fc.property(validCfi, (cfi) => {
        expect(isValidReadingLocation(cfi)).toBe(true);
        expect(parseReadingLocation(cfi)).toBe(cfi);
      }),
      { numRuns: 100 },
    );
  });

  test("rejects non-CFI strings; parse returns null", () => {
    // Any string that does not match the shape regex.
    const nonCfiString = fc.string().filter((s) => !/^epubcfi\(.+\)$/.test(s));
    fc.assert(
      fc.property(nonCfiString, (s) => {
        expect(isValidReadingLocation(s)).toBe(false);
        expect(parseReadingLocation(s)).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  test("rejects the empty string", () => {
    expect(isValidReadingLocation("")).toBe(false);
    expect(parseReadingLocation("")).toBeNull();
  });

  test("rejects null", () => {
    expect(isValidReadingLocation(null)).toBe(false);
    expect(parseReadingLocation(null)).toBeNull();
  });

  test("rejects any non-string value", () => {
    const nonString = fc.anything().filter((v) => typeof v !== "string");
    fc.assert(
      fc.property(nonString, (value) => {
        expect(isValidReadingLocation(value)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
