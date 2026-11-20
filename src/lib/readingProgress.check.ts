// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Standalone self-check for the reading-progress pure module. Runs under
// `pnpm check` (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
import assert from "node:assert/strict";

import { clampFraction, formatProgressPercent } from "./readingProgress";

// clampFraction: in-range values pass through; bounds are inclusive.
assert.equal(clampFraction(0.5), 0.5);

assert.equal(clampFraction(0), 0);

assert.equal(clampFraction(1), 1);

// clampFraction: out-of-range clamps to the nearest bound.
assert.equal(clampFraction(-1), 0);

assert.equal(clampFraction(2), 1);

// clampFraction: non-finite inputs are total (NaN/-Inf → 0, +Inf → 1).
assert.equal(clampFraction(Number.NaN), 0);

assert.equal(clampFraction(Number.POSITIVE_INFINITY), 1);

assert.equal(clampFraction(Number.NEGATIVE_INFINITY), 0);

// formatProgressPercent: clamps then renders an integer-percent string.
assert.equal(formatProgressPercent(0), "0%");

assert.equal(formatProgressPercent(1), "100%");

assert.equal(formatProgressPercent(0.5), "50%");

assert.equal(formatProgressPercent(0.37), "37%");

assert.equal(formatProgressPercent(-1), "0%");

assert.equal(formatProgressPercent(2), "100%");

assert.equal(formatProgressPercent(Number.NaN), "0%");
