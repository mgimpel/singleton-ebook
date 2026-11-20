// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Feature: epub-reader, Property 5: Reader scheme resolution maps system by device and passes concrete schemes through
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import {
  resolveReaderScheme,
  READER_COLOR_SCHEMES,
} from "../readerColorScheme";

const CONCRETE = ["light", "dark", "sepia"] as const;
const anyScheme = fc.constantFrom(...READER_COLOR_SCHEMES);

describe("Property 5: resolveReaderScheme", () => {
  test("always returns a concrete scheme (light|dark|sepia)", () => {
    fc.assert(
      fc.property(anyScheme, fc.boolean(), (scheme, deviceIsDark) => {
        expect(CONCRETE).toContain(resolveReaderScheme(scheme, deviceIsDark));
      }),
      { numRuns: 100 },
    );
  });

  test("maps system to dark when the device is dark and light otherwise", () => {
    fc.assert(
      fc.property(fc.boolean(), (deviceIsDark) => {
        expect(resolveReaderScheme("system", deviceIsDark)).toBe(
          deviceIsDark ? "dark" : "light",
        );
      }),
      { numRuns: 100 },
    );
  });

  test("passes concrete schemes through unchanged regardless of device", () => {
    fc.assert(
      fc.property(fc.constantFrom(...CONCRETE), fc.boolean(), (scheme, deviceIsDark) => {
        expect(resolveReaderScheme(scheme, deviceIsDark)).toBe(scheme);
      }),
      { numRuns: 100 },
    );
  });
});
