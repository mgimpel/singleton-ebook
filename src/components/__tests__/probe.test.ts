// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

import { test, expect } from "vitest";

test("view.js imports under jsdom", async () => {
  await import("../../vendor/foliate-js/view.js");
  expect(customElements.get("foliate-view")).toBeDefined();
});
