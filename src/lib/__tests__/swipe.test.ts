// Feature: epub-reader, Property 1: Swipe classification maps gesture to navigation direction
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import { classifySwipe, SWIPE_THRESHOLD, type SwipeDirection } from "../swipe";

// Oracle restated from the spec predicate (acceptable for a classification):
//  - "next" when |dx| >= SWIPE_THRESHOLD and |dx| > |dy| and dx < 0
//  - "prev" when |dx| >= SWIPE_THRESHOLD and |dx| > |dy| and dx > 0
//  - "none" otherwise (sub-threshold, vertically dominant/tied, or dx === 0)
function expected(dx: number, dy: number): SwipeDirection {
  if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? "next" : "prev";
  }

  return "none";
}

describe("Property 1: Swipe classification maps gesture to navigation direction", () => {
  test("matches the spec predicate for arbitrary integer travel", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: -1000, max: 1000 }),
        (dx, dy) => {
          expect(classifySwipe(dx, dy)).toBe(expected(dx, dy));
        },
      ),
      { numRuns: 200 },
    );
  });

  test("matches the spec predicate for arbitrary real travel", () => {
    const finite = fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true });
    fc.assert(
      fc.property(finite, finite, (dx, dy) => {
        expect(classifySwipe(dx, dy)).toBe(expected(dx, dy));
      }),
      { numRuns: 200 },
    );
  });

  // Concentrate runs right at the threshold and dominance boundaries, where the
  // branch conditions flip — the broad ranges above rarely land exactly here.
  test("matches the spec predicate near the threshold and dominance boundaries", () => {
    const nearThreshold = fc.integer({ min: SWIPE_THRESHOLD - 3, max: SWIPE_THRESHOLD + 3 });
    const sign = fc.constantFrom(-1, 1);
    fc.assert(
      fc.property(nearThreshold, sign, fc.integer({ min: 0, max: 60 }), (mag, s, dyMag) => {
        const dx = mag * s;

        // exercise dy both below and at/above |dx| to hit the dominance tie
        for (const dy of [dyMag, -dyMag, Math.abs(dx), -Math.abs(dx)]) {
          expect(classifySwipe(dx, dy)).toBe(expected(dx, dy));
        }
      }),
      { numRuns: 200 },
    );
  });

  test.each([
    { name: "|dx| = 50 exactly qualifies (leftward -> next)", dx: -50, dy: 10, want: "next" },
    { name: "|dx| = 50 exactly qualifies (rightward -> prev)", dx: 50, dy: 10, want: "prev" },
    { name: "|dx| = 49 is sub-threshold -> none", dx: -49, dy: 0, want: "none" },
    { name: "|dx| = |dy| is a tie, not dominant -> none", dx: -60, dy: 60, want: "none" },
    { name: "dx = 0 -> none", dx: 0, dy: 100, want: "none" },
    { name: "large leftward -> next", dx: -300, dy: 20, want: "next" },
    { name: "large rightward -> prev", dx: 300, dy: 20, want: "prev" },
    { name: "vertically dominant despite large dx -> none", dx: 60, dy: 100, want: "none" },
  ] satisfies { name: string; dx: number; dy: number; want: SwipeDirection }[])(
    "$name",
    ({ dx, dy, want }) => {
      expect(classifySwipe(dx, dy)).toBe(want);
    },
  );
});
