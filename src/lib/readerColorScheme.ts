// Framework-agnostic reader color-scheme logic. No framework imports.

export type ReaderColorScheme = "system" | "light" | "dark" | "sepia";

export const READER_COLOR_SCHEMES: readonly ReaderColorScheme[] = [
  "system",
  "light",
  "dark",
  "sepia",
] as const;

export const DEFAULT_READER_COLOR_SCHEME: ReaderColorScheme = "system";

// A concrete, directly paintable scheme (excludes "system").
export type ConcreteReaderScheme = "light" | "dark" | "sepia";

// Maps each concrete scheme to reader-surface colors used by buildReaderStyles.
// "system" is not paintable — it resolves via resolveReaderScheme first.
export const READER_SCHEME_COLORS: Record<ConcreteReaderScheme, { fg: string; bg: string }> = {
  light: { fg: "#1a1a1a", bg: "#ffffff" },
  dark: { fg: "#e8e8e8", bg: "#1a1a1a" },
  sepia: { fg: "#5b4636", bg: "#f4ecd8" },
};

function isReaderColorScheme(value: string | null | undefined): value is ReaderColorScheme {
  return READER_COLOR_SCHEMES.some((scheme) => scheme === value);
}

/**
 * Returns the value unchanged if it is a valid scheme, else the default
 * ("system"). Total: handles absent input (null, undefined).
 */
export function normalizeReaderColorScheme(value: string | null | undefined): ReaderColorScheme {
  return isReaderColorScheme(value) ? value : DEFAULT_READER_COLOR_SCHEME;
}

/**
 * Resolve to a paintable scheme: "system" maps to "dark" when the device
 * prefers dark and "light" otherwise; light/dark/sepia pass through unchanged.
 */
export function resolveReaderScheme(
  scheme: ReaderColorScheme,
  deviceIsDark: boolean,
): ConcreteReaderScheme {
  if (scheme === "system") {
    return deviceIsDark ? "dark" : "light";
  }

  return scheme;
}
