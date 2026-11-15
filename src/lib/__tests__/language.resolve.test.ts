// Feature: epub-reader, Property 13: UI language resolution follows persisted → device subtag → English precedence
// Validates: Requirements 8.4, 8.5, 8.6, 8.7
import { test, expect } from "vitest";
import fc from "fast-check";
import {
  resolveLanguage,
  DEFAULT_LANGUAGE,
  UI_LANGUAGES,
  type UI_Language,
} from "../language";

const bundled = fc.constantFrom<UI_Language>(...UI_LANGUAGES);

// Randomise the case of each character in a string.
const randomCase = (s: string) =>
  fc
    .array(fc.boolean(), { minLength: s.length, maxLength: s.length })
    .map((flags) =>
      Array.from(s, (c, i) => (flags[i] ? c.toUpperCase() : c.toLowerCase())).join(""),
    );

// A device language whose primary subtag is a bundled locale, in random case
// with an optional region suffix (e.g. "fr-CA", "DE_at", "Es").
const matchingDevice = bundled.chain((locale) =>
  fc.record({ cased: randomCase(locale), region: fc.string({ maxLength: 4 }), sep: fc.constantFrom("-", "_", "") }).map(
    ({ cased, region, sep }) => (sep && region ? `${cased}${sep}${region}` : cased),
  ),
);

// A non-bundled persisted value: anything whose string form is not a bundled locale.
const invalidPersisted = fc
  .oneof(fc.string(), fc.constant(null), fc.constant(undefined))
  .filter((v) => !UI_LANGUAGES.some((lang) => lang === v));

test("Property 13 (1): persisted bundled locale is returned as-is", () => {
  fc.assert(
    fc.property(bundled, fc.option(fc.string(), { nil: undefined }), (persisted, device) => {
      const result = resolveLanguage(persisted, device);
      expect(result).toBe(persisted);
      expect(UI_LANGUAGES).toContain(result);
    }),
    { numRuns: 200 },
  );
});

test("Property 13 (2): invalid persisted + device subtag match resolves to that locale", () => {
  fc.assert(
    fc.property(invalidPersisted, matchingDevice, (persisted, device) => {
      const expected = device.toLowerCase().split(/[-_]/)[0];
      const result = resolveLanguage(persisted, device);
      expect(result).toBe(expected);
      expect(UI_LANGUAGES).toContain(result);
    }),
    { numRuns: 200 },
  );
});

test("Property 13 (3): invalid persisted + non-matching device subtag resolves to English", () => {
  const nonMatchingDevice = fc
    .string()
    .filter((s) => !UI_LANGUAGES.some((lang) => lang === s.toLowerCase().split(/[-_]/)[0]));

  fc.assert(
    fc.property(invalidPersisted, nonMatchingDevice, (persisted, device) => {
      const result = resolveLanguage(persisted, device);
      expect(result).toBe(DEFAULT_LANGUAGE);
      expect(UI_LANGUAGES).toContain(result);
    }),
    { numRuns: 200 },
  );
});

test("Property 13 (4): invalid persisted + absent device language resolves to English", () => {
  fc.assert(
    fc.property(invalidPersisted, fc.constantFrom(null, undefined, ""), (persisted, device) => {
      const result = resolveLanguage(persisted, device);
      expect(result).toBe(DEFAULT_LANGUAGE);
      expect(UI_LANGUAGES).toContain(result);
    }),
    { numRuns: 200 },
  );
});
