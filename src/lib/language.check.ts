// Standalone self-check for the UI language pure module. Runs under `pnpm check`
// (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
import assert from "node:assert/strict";

import { DEFAULT_LANGUAGE, normalizeLanguage, resolveLanguage } from "./language";

// normalizeLanguage: identity on bundled locales.
for (const lang of ["en", "fr", "es", "de"] as const) {
  assert.equal(normalizeLanguage(lang), lang);
}

// normalizeLanguage: default on anything else (total over unknown input).
assert.equal(normalizeLanguage("xx"), DEFAULT_LANGUAGE);

assert.equal(normalizeLanguage(""), DEFAULT_LANGUAGE);

assert.equal(normalizeLanguage(null), DEFAULT_LANGUAGE);

assert.equal(normalizeLanguage(undefined), DEFAULT_LANGUAGE);



// resolveLanguage: persisted bundled locale wins over the device language.
assert.equal(resolveLanguage("fr", "en-US"), "fr");

assert.equal(resolveLanguage("de", "fr-CA"), "de");

// resolveLanguage: invalid persisted → match device primary subtag
// (lowercased, split on `-`/`_`).
assert.equal(resolveLanguage("xx", "fr-CA"), "fr");

assert.equal(resolveLanguage("xx", "FR_fr"), "fr");

// resolveLanguage: unmatched device language, or no device language → English.
assert.equal(resolveLanguage("xx", "ja-JP"), DEFAULT_LANGUAGE);

assert.equal(resolveLanguage("xx", null), DEFAULT_LANGUAGE);
