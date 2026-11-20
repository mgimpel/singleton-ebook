// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Feature: epub-reader, Property 12: UI language normalization is total, identity on valid, default on invalid
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import {
  normalizeLanguage,
  UI_LANGUAGES,
  DEFAULT_LANGUAGE,
} from "../language";

const validLocale = fc.constantFrom(...UI_LANGUAGES);

describe("Property 12: normalizeLanguage", () => {
  test("is total and always returns a bundled UI language", () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(UI_LANGUAGES).toContain(normalizeLanguage(value));
      }),
      { numRuns: 100 },
    );
  });

  test("is the identity on valid bundled locales", () => {
    fc.assert(
      fc.property(validLocale, (locale) => {
        expect(normalizeLanguage(locale)).toBe(locale);
      }),
      { numRuns: 100 },
    );
  });

  test("returns the default for any value that is not a bundled locale", () => {
    const invalid = fc
      .string()
      .filter((v) => !UI_LANGUAGES.some((lang) => lang === v));

    fc.assert(
      fc.property(invalid, (value) => {
        expect(normalizeLanguage(value)).toBe(DEFAULT_LANGUAGE);
      }),
      { numRuns: 100 },
    );
  });
});
