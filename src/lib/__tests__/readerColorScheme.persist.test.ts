// Feature: epub-reader, Property 6: Reader color scheme persistence round-trips
// Validates: Requirements 5.6, 7.1, 7.2
import { describe, test, expect, vi } from "vitest";
import fc from "fast-check";
import { readReaderScheme, persistReaderScheme } from "../persistenceManager";
import { READER_COLOR_SCHEMES } from "../readerColorScheme";

const validScheme = fc.constantFrom(...READER_COLOR_SCHEMES);

describe("Property 6: Reader color scheme persistence round-trips", () => {
  test("persisting any valid scheme and reading it back returns that scheme", () => {
    fc.assert(
      fc.property(validScheme, (scheme) => {
        // fast-check runs the predicate many times within one test, so reset
        // between runs here rather than relying on a hook.
        localStorage.clear();

        const onErr = vi.fn();
        persistReaderScheme(scheme, onErr);

        expect(readReaderScheme()).toBe(scheme);
        // A successful write must not signal a save failure.
        expect(onErr).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
