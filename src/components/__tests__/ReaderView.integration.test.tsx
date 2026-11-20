// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Feature: epub-reader — integration test for the bundled-blob open path.
// Validates: Requirements 1.1
//
// Unlike ReaderView.test.tsx (task 11.6), this test does NOT mock useBook: it
// mounts the real ReaderView + real useBook and exercises the actual load path,
// proving the app opens its bundled book automatically with no import or
// file-selection UI. Only the external seams are stubbed, exactly as
// useBook.test.ts does:
//   - the vendored view.js dynamic import (mocked to a no-op module),
//   - global fetch (captures the URL, yields a Response whose .blob() -> a Blob),
//   - document.createElement('foliate-view') (a REAL <div> mock; captures open()).
// The three wiring hooks (location/settings/swipe) are mocked to no-ops so the
// test stays focused on the load path, matching ReaderView.test.tsx.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";

// The hook dynamically imports this absolute URL; the real vendored module only
// exists under src/vendor/ at runtime. Resolve import() to a no-op module.
vi.mock("../../vendor/foliate-js/view.js", () => ({}));

// Keep the wiring hooks inert — they touch a live foliate view's event streams
// we don't drive here. useBook itself stays REAL (that's the point).
vi.mock("../../hooks/useReaderLocation", () => ({
  useReaderLocation: () => ({ fraction: 0, cfi: null }),
}));

vi.mock("../../hooks/useReaderSettings", () => ({
  useReaderSettings: () => ({
    fontSize: 16,
    readerScheme: "system",
    setFontSize: vi.fn(),
    setReaderScheme: vi.fn(),
  }),
}));

vi.mock("../../hooks/useSwipeNavigation", () => ({
  useSwipeNavigation: () => undefined,
}));

import ReaderView from "../ReaderView";
import type { FoliateView } from "../../hooks/useBook";
import i18n from "../../i18n";
import uiEn from "../../locales/ui.en.json";

const loadingLabel = uiEn.reader.loading;

/**
 * A mock <foliate-view> built on a REAL DOM <div> so ReaderView's
 * surface.append(view) / view.remove() / container.contains(view) all work
 * natively (no global prototype spy needed). open/goTo resolve, renderer spies,
 * empty toc. Returns the `open` spy alongside so tests assert on a bound
 * reference (reading `view.open` directly trips oxlint's unbound-method rule).
 */
function makeView(): { view: FoliateView; open: ReturnType<typeof vi.fn> } {
  const open = vi.fn().mockResolvedValue(undefined);
  const el = document.createElement("div");
  Object.assign(el, {
    open,
    goTo: vi.fn().mockResolvedValue({ index: 0 }),
    next: vi.fn().mockResolvedValue(undefined),
    prev: vi.fn().mockResolvedValue(undefined),
    goLeft: vi.fn().mockResolvedValue(undefined),
    goRight: vi.fn().mockResolvedValue(undefined),
    renderer: { setStyles: vi.fn(), setAttribute: vi.fn() },
    book: { toc: [] },
  });

  return { view: el as unknown as FoliateView, open };
}

let fetchMock: ReturnType<typeof vi.fn>;
let currentView: FoliateView;
let openMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  ({ view: currentView, open: openMock } = makeView());

  // fetch -> capture the URL, yield a Response-like object whose blob() is a Blob.
  fetchMock = vi
    .fn()
    .mockResolvedValue({ blob: () => Promise.resolve(new Blob(["epub"])) });
  vi.stubGlobal("fetch", fetchMock);

  // createElement('foliate-view') -> the REAL-element mock; everything else real.
  // Because the mock is a real node, surface.append(view) mounts it for real —
  // no HTMLDivElement.prototype.append spy (that global override raced other
  // suites and intermittently yielded a null capture in the full run).
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((
    tag: string,
    options?: ElementCreationOptions,
  ) => {
    if (tag === "foliate-view") return currentView as unknown as HTMLElement;

    return realCreate(tag, options);
  }) as typeof document.createElement);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderReader() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider>
        <ReaderView onSaveError={() => {}} />
      </MantineProvider>
    </I18nextProvider>,
  );
}

describe("ReaderView integration — bundled-blob open (Req 1.1)", () => {
  test("opens the bundled EPUB blob automatically with no import/file-selection UI", async () => {
    renderReader();

    // Loading indicator is shown while parsing (Req 1.5), then removed on ready.
    expect(screen.getByLabelText(loadingLabel)).toBeInTheDocument();

    // Wait for the real load path to finish and the view to mount.
    await waitFor(() => {
      expect(screen.queryByLabelText(loadingLabel)).not.toBeInTheDocument();
    });

    // 1. fetch was called exactly once, with the bundled EPUB asset URL.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const fetchedUrl = fetchMock.mock.calls[0][0];
    expect(typeof fetchedUrl).toBe("string");
    // Under vitest the `?url` import resolves to a transformed path string; it
    // still references the bundled epub by basename.
    expect(fetchedUrl).toContain("merchant-of-venice");
    expect(fetchedUrl).toMatch(/\.epub$/);

    // 2. The view's open() was called exactly once with the bundled Blob.
    expect(openMock).toHaveBeenCalledTimes(1);
    expect(openMock.mock.calls[0][0]).toBeInstanceOf(Blob);

    // Sanity: the live view was really mounted into the surface (ready state).
    // As a real appended node it is now connected to the rendered document.
    expect((currentView as unknown as HTMLElement).isConnected).toBe(true);

    // 3. No import / file-selection UI — the book opens with no user action.
    expect(
      screen.queryByRole("button", { name: /import|open file|choose/i }),
    ).toBeNull();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });
});
