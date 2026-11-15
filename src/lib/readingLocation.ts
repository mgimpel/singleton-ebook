// Framework-agnostic reading-location logic. No framework imports.
//
// A persisted reading location is just the CFI string foliate-js emits on
// `relocate`. This layer only validates the CFI *shape* and round-trips it
// through storage; whether a CFI actually resolves within the book is
// foliate-js's job (`goTo` returning `undefined`), not ours.

// A persisted location is the raw EPUB CFI string.
export type ReadingLocation = string;

// Shape-only check: a non-empty `epubcfi(...)` wrapper with non-empty content
// inside. This does NOT validate the CFI internals — resolution within the
// book is left to foliate-js.
const CFI_PATTERN = /^epubcfi\(.+\)$/;

/**
 * True iff `value` is a non-empty string shaped like an EPUB CFI
 * (`epubcfi(...)`). Rejects empty, malformed, and non-string input.
 * Shape-only — it does not validate CFI internals.
 */
export function isValidReadingLocation(
  value: string | null | undefined,
): value is ReadingLocation {
  return value != null && CFI_PATTERN.test(value);
}

/**
 * Parse a stored raw value: return the CFI if it is CFI-shaped, else `null`
 * (absent, empty, malformed, or non-string all map to `null`).
 */
export function parseReadingLocation(raw: string | null): ReadingLocation | null {
  return isValidReadingLocation(raw) ? raw : null;
}

/**
 * Serialize a location for storage. Identity for the string form — centralized
 * here so a future encoding change has a single home. Guarantees
 * `parseReadingLocation(serializeReadingLocation(loc)) === loc` for valid `loc`.
 */
export function serializeReadingLocation(loc: ReadingLocation): string {
  return loc;
}
