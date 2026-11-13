// Standalone self-check for the reader color-scheme pure module. Runs under
// `pnpm check` (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
import assert from "node:assert/strict";

import {
  DEFAULT_READER_COLOR_SCHEME,
  normalizeReaderColorScheme,
  resolveReaderScheme,
} from "./readerColorScheme";

// normalizeReaderColorScheme: identity on each valid scheme.
assert.equal(normalizeReaderColorScheme("system"), "system");
assert.equal(normalizeReaderColorScheme("light"), "light");
assert.equal(normalizeReaderColorScheme("dark"), "dark");
assert.equal(normalizeReaderColorScheme("sepia"), "sepia");

// normalizeReaderColorScheme: total over garbage — anything invalid → default.
assert.equal(DEFAULT_READER_COLOR_SCHEME, "system");
assert.equal(normalizeReaderColorScheme("xx"), "system");
assert.equal(normalizeReaderColorScheme(""), "system");
assert.equal(normalizeReaderColorScheme(null), "system");
assert.equal(normalizeReaderColorScheme(undefined), "system");
assert.equal(normalizeReaderColorScheme(123), "system");
assert.equal(normalizeReaderColorScheme({}), "system");

// resolveReaderScheme: "system" follows the device preference.
assert.equal(resolveReaderScheme("system", true), "dark");
assert.equal(resolveReaderScheme("system", false), "light");

// resolveReaderScheme: concrete schemes pass through regardless of device.
assert.equal(resolveReaderScheme("light", true), "light");
assert.equal(resolveReaderScheme("light", false), "light");
assert.equal(resolveReaderScheme("dark", false), "dark");
assert.equal(resolveReaderScheme("sepia", true), "sepia");
