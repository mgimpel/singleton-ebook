// Standalone self-check for the swipe-classification pure module. Runs under
// `pnpm check` (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
// Validates: Requirements 2.4, 2.8
import assert from "node:assert/strict";

import { classifySwipe, SWIPE_THRESHOLD } from "./swipe";

// Direction: a dominant horizontal swipe maps leftward → "next", rightward → "prev".
assert.equal(classifySwipe(-60, 0), "next"); // leftward, dominant, above threshold

assert.equal(classifySwipe(60, 0), "prev"); // rightward

// Threshold boundary: exactly at the threshold qualifies; just below does not.
assert.equal(SWIPE_THRESHOLD, 50);

assert.equal(classifySwipe(-50, 0), "next"); // exactly at threshold

assert.equal(classifySwipe(-49, 0), "none"); // below threshold

// Dominance boundary: |dx| must be strictly greater than |dy|.
assert.equal(classifySwipe(-60, 60), "none"); // tie → not dominant

assert.equal(classifySwipe(-60, 59), "next"); // dominant by one px

// Vertical / no travel → no navigation.
assert.equal(classifySwipe(0, 100), "none"); // vertical

assert.equal(classifySwipe(0, 0), "none"); // no travel
