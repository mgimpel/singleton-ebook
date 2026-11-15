// Framework-agnostic UI language logic. No framework imports.

export type UI_Language = "en" | "fr" | "es" | "de";

export const UI_LANGUAGES: readonly UI_Language[] = ["en", "fr", "es", "de"] as const;

export const DEFAULT_LANGUAGE: UI_Language = "en";

function isUILanguage(value: unknown): value is UI_Language {
  // SAFETY: widening to string[] only to call includes on a value already checked as a string.
  return typeof value === "string" && (UI_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Returns the value unchanged if it is a bundled locale, else the default ("en").
 * Total: handles any unknown input (non-string, null, undefined).
 */
export function normalizeLanguage(value: unknown): UI_Language {
  return isUILanguage(value) ? value : DEFAULT_LANGUAGE;
}

/**
 * Resolve the initial UI language at startup:
 *  1. the persisted value when it is a bundled locale (exact match);
 *  2. else the bundled locale whose primary subtag matches the device
 *     language's primary subtag (case-insensitive, split on `-`/`_`,
 *     e.g. "fr-CA" -> "fr");
 *  3. else English.
 * The result is always a member of UI_LANGUAGES.
 */
export function resolveLanguage(
  persisted: unknown,
  deviceLanguage: string | null | undefined,
): UI_Language {
  if (isUILanguage(persisted)) {
    return persisted;
  }

  if (typeof deviceLanguage === "string") {
    const primary = deviceLanguage.toLowerCase().split(/[-_]/)[0];

    if (isUILanguage(primary)) {
      return primary;
    }
  }

  return DEFAULT_LANGUAGE;
}
