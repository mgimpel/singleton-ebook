// Standalone self-check for the reading-location pure module. Runs under
// `pnpm check` (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
// Validates: Requirements 6.4 (CFI shape validation + storage round-trip).
import assert from "node:assert/strict";

import {
  isValidReadingLocation,
  parseReadingLocation,
  serializeReadingLocation,
} from "./readingLocation";

// isValidReadingLocation: accept well-formed CFI shapes (shape-only check).
assert.equal(isValidReadingLocation("epubcfi(/6/4!/4/2)"), true);

assert.equal(isValidReadingLocation("epubcfi(x)"), true); // minimal non-empty inner

// isValidReadingLocation: reject empty, malformed, and non-string input.
assert.equal(isValidReadingLocation(""), false);

assert.equal(isValidReadingLocation("epubcfi()"), false); // empty inner

assert.equal(isValidReadingLocation("notcfi"), false);

assert.equal(isValidReadingLocation("epubcfi(abc"), false); // unterminated

assert.equal(isValidReadingLocation(null), false);

assert.equal(isValidReadingLocation(undefined), false);

assert.equal(isValidReadingLocation(123), false);

assert.equal(isValidReadingLocation({}), false);

// parseReadingLocation: pass valid CFI through, map everything else to null.
assert.equal(parseReadingLocation("epubcfi(/6/4!/4/2)"), "epubcfi(/6/4!/4/2)");

assert.equal(parseReadingLocation(""), null);

assert.equal(parseReadingLocation("bad"), null);

assert.equal(parseReadingLocation(null), null);

// Round-trip: serialize then parse recovers the original valid location.
assert.equal(
  parseReadingLocation(serializeReadingLocation("epubcfi(/6/4)")),
  "epubcfi(/6/4)",
);
