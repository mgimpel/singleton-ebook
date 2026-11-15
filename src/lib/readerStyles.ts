// Framework-agnostic builder for the reader's user stylesheet. No framework
// imports. Pure, deterministic string builder.

import { READER_SCHEME_COLORS, type ConcreteReaderScheme } from "./readerColorScheme";

/**
 * Build the user stylesheet injected via `renderer.setStyles`, from a
 * normalized font size (px) and a *resolved* concrete reader scheme.
 *
 * Callers pass `resolveReaderScheme(scheme, deviceIsDark)`, so "system" is
 * already mapped to light/dark before reaching here.
 *
 * Applies the font size to `html` (foliate-js scales text against the root
 * font size) and the scheme's foreground/background to `html, body`.
 */
export function buildReaderStyles(fontSize: number, scheme: ConcreteReaderScheme): string {
  const { fg, bg } = READER_SCHEME_COLORS[scheme];

  return `html { font-size: ${fontSize}px; } html, body { color: ${fg}; background: ${bg}; }`;
}
