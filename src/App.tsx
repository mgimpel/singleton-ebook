// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Thin root: a MantineProvider whose color scheme is driven, read-only, by the
// persisted reader color scheme (Req 5.3 — chrome reflects the reader scheme;
// 5.7 persisted scheme applied at start; 5.8 default "system" when none), then
// composes AppLayout. The reader surface styles are owned by useReaderSettings;
// here the same scheme only decides the Mantine chrome.

import "@mantine/core/styles.css";
import { MantineProvider, type MantineColorSchemeManager } from "@mantine/core";

import { readReaderScheme } from "./lib/persistenceManager";
import { resolveReaderScheme } from "./lib/readerColorScheme";
import AppLayout from "./components/AppLayout";

/**
 * Read-only Mantine color-scheme manager: the chrome scheme follows the
 * persisted reader color scheme and cannot be set independently. On read it
 * resolves the stored scheme to a concrete one via the device preference and
 * maps it to Mantine's palette — sepia reads as light (Req 7.4: the resolved
 * scheme drives the chrome).
 */
export function createAppColorSchemeManager(): MantineColorSchemeManager {
  return {
    get() {
      const deviceIsDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const concrete = resolveReaderScheme(readReaderScheme(), deviceIsDark);

      // sepia chrome uses the light palette (design: sepia -> Mantine light).
      return concrete === "dark" ? "dark" : "light";
    },
    // ponytail: no-op set — the scheme is owned by the reader setting, not by
    // Mantine. Relies on Mantine 9.8.0 only calling set() from setColorScheme
    // (which this app never invokes). Re-verify on a Mantine upgrade.
    set() {},
    subscribe() {},
    unsubscribe() {},
    clear() {},
  };
}

export default function App() {
  return (
    <MantineProvider colorSchemeManager={createAppColorSchemeManager()}>
      <AppLayout />
    </MantineProvider>
  );
}
