// Standalone self-check for the shared persistence manager. Runs under
// `pnpm check` (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
//
// This runs under vite-node (NOT jsdom), so there is no `localStorage` global
// by default — each case installs a minimal fake on globalThis to exercise the
// validated-read / never-throw-write behavior.
import assert from "node:assert/strict";

import { DEFAULT_LANGUAGE } from "./language";
import { persistLanguage, readLanguage, type SaveErrorKind } from "./persistenceManager";

// Minimal Storage-shaped fake; only the methods under test do anything.
function fakeStorage(overrides: Partial<Storage>): Storage {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
    ...overrides,
  } as Storage;
}

const original = (globalThis as { localStorage?: Storage }).localStorage;
function installStorage(storage: Storage): void {
  (globalThis as { localStorage?: Storage }).localStorage = storage;
}

try {
  // 1. Never-throw write signals onSaveError: setItem throws (quota/private
  //    mode), persistLanguage must swallow it and report the kind instead.
  {
    const errs: SaveErrorKind[] = [];
    installStorage(
      fakeStorage({
        setItem: () => {
          throw new Error("quota exceeded");
        },
      }),
    );
    assert.doesNotThrow(() => persistLanguage("fr", (kind) => errs.push(kind)));
    assert.deepEqual(errs, ["language"]);
  }

  // 2a. Validated read falls back to default on garbage.
  {
    installStorage(fakeStorage({ getItem: () => "not-a-locale" }));
    assert.equal(readLanguage(), DEFAULT_LANGUAGE);
  }

  // 2b. Validated read never throws even when getItem itself throws → default.
  {
    installStorage(
      fakeStorage({
        getItem: () => {
          throw new Error("access denied");
        },
      }),
    );
    let read: string | undefined;
    assert.doesNotThrow(() => {
      read = readLanguage();
    });
    assert.equal(read, DEFAULT_LANGUAGE);
  }
} finally {
  // Tidy up: restore whatever was there (undefined under vite-node).
  if (original === undefined) {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  } else {
    installStorage(original);
  }
}
