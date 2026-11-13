// Standalone self-check for the reader user-stylesheet builder. Runs under
// `pnpm check` (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
import assert from "node:assert/strict";

import { READER_SCHEME_COLORS, type ConcreteReaderScheme } from "./readerColorScheme";
import { buildReaderStyles } from "./readerStyles";

// For each concrete scheme, the built CSS carries the font size and the
// resolved scheme's foreground and background colors.
const schemes: ConcreteReaderScheme[] = ["light", "dark", "sepia"];
for (const scheme of schemes) {
  const css = buildReaderStyles(20, scheme);
  const { fg, bg } = READER_SCHEME_COLORS[scheme];

  assert.ok(css.includes("20px"), `${scheme}: CSS missing font size`);
  assert.ok(css.includes(fg), `${scheme}: CSS missing fg ${fg}`);
  assert.ok(css.includes(bg), `${scheme}: CSS missing bg ${bg}`);
}
