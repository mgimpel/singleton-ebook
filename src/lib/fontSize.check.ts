// Standalone self-check for the reader font-size pure module. Runs under
// `pnpm check` (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
import assert from "node:assert/strict";

import {
  FONT_SIZE_DEFAULT,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  normalizeFontSize,
  stepFontSize,
} from "./fontSize";

// normalizeFontSize: default on absent/non-numeric input (total over garbage).
assert.equal(normalizeFontSize(undefined), FONT_SIZE_DEFAULT);

assert.equal(normalizeFontSize(null), FONT_SIZE_DEFAULT);

assert.equal(normalizeFontSize("abc"), FONT_SIZE_DEFAULT);

assert.equal(normalizeFontSize({}), FONT_SIZE_DEFAULT);

// normalizeFontSize: clamp out-of-range to the nearest bound.
assert.equal(normalizeFontSize(5), FONT_SIZE_MIN); // below min

assert.equal(normalizeFontSize(-100), FONT_SIZE_MIN); // far below min

assert.equal(normalizeFontSize(99), FONT_SIZE_MAX); // above max

// normalizeFontSize: snap in-range values to the nearest 2px step. Ties break
// upward (Math.round over (n-MIN)/STEP), matching the source comment.
assert.equal(normalizeFontSize(13), 14); // .5 tie → up

assert.equal(normalizeFontSize(17), 18); // .5 tie → up

assert.equal(normalizeFontSize(21), 22); // .5 tie → up

// normalizeFontSize: identity on exact in-bounds options.
assert.equal(normalizeFontSize(16), 16);

// stepFontSize: one 2px increment, clamped to bounds.
assert.equal(stepFontSize(18, 1), 20); // mid-range step up

assert.equal(stepFontSize(FONT_SIZE_MAX, 1), FONT_SIZE_MAX); // clamp at max

assert.equal(stepFontSize(FONT_SIZE_MIN, -1), FONT_SIZE_MIN); // clamp at min
