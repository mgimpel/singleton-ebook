// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Framework-agnostic UI language logic. No framework imports.

export type UI_Language = "en" | "fr" | "es" | "de";

export const UI_LANGUAGES: readonly UI_Language[] = ["en", "fr", "es", "de"] as const;

export const DEFAULT_LANGUAGE: UI_Language = "en";

function isUILanguage(value: string | null | undefined): value is UI_Language {
  return UI_LANGUAGES.some((lang) => lang === value);
}

/**
 * Returns the value unchanged if it is a bundled locale, else the default ("en").
 * Total: handles absent input (null, undefined).
 */
export function normalizeLanguage(value: string | null | undefined): UI_Language {
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
  persisted: string | null | undefined,
  deviceLanguage: string | null | undefined,
): UI_Language {
  if (isUILanguage(persisted)) {
    return persisted;
  }

  const primary = deviceLanguage?.toLowerCase().split(/[-_]/)[0];

  if (isUILanguage(primary)) {
    return primary;
  }

  return DEFAULT_LANGUAGE;
}
