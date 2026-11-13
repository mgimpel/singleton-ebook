// Feature: epub-reader, Property 3: Font size persistence round-trips
// Validates: Requirements 4.5, 4.6, 7.1, 7.2
import { describe, test, expect, vi } from "vitest";
import fc from "fast-check";
import { readFontSize, persistFontSize } from "../persistenceManager";
import { FONT_SIZE_OPTIONS } from "../fontSize";

const validFontSize = fc.constantFrom(...FONT_SIZE_OPTIONS);

describe("Property 3: Font size persistence round-trips", () => {
  test("persisting any valid font size and reading it back returns that size", () => {
    fc.assert(
      fc.property(validFontSize, (size) => {
        // fast-check runs the predicate many times within one test, so reset
        // between runs here rather than relying on a hook.
        localStorage.clear();

        const onSaveError = vi.fn();
        persistFontSize(size, onSaveError);

        expect(readFontSize()).toBe(size);
        // A successful write must not signal a save failure.
        expect(onSaveError).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
