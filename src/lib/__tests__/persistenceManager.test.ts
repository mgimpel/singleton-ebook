// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Feature: epub-reader, Property 14: UI language persistence round-trips
// Validates: Requirements 8.3, 8.4
import { describe, test, expect, vi } from "vitest";
import fc from "fast-check";
import { readLanguage, persistLanguage } from "../persistenceManager";
import { UI_LANGUAGES } from "../language";

const bundledLocale = fc.constantFrom(...UI_LANGUAGES);

describe("Property 14: UI language persistence round-trips", () => {
  test("persisting any bundled locale and reading it back returns that locale", () => {
    fc.assert(
      fc.property(bundledLocale, (locale) => {
        // fast-check runs the predicate many times within one test, so reset
        // between runs here rather than relying on the afterEach hook.
        localStorage.clear();

        const onSaveError = vi.fn();
        persistLanguage(locale, onSaveError);

        expect(readLanguage()).toBe(locale);
        // A successful write must not signal a save failure.
        expect(onSaveError).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
