// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Feature: epub-reader — unit tests for useBook against a mocked <foliate-view>.
// Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 6.2, 6.4
//
// useBook's real I/O is stubbed at three seams so the hook's own logic (status
// transitions, the 10s open timeout, persisted-location restore/fallback/discard)
// is what's exercised:
//   - the vendored view.js dynamic import (mocked to a no-op module),
//   - global fetch (a Response whose .blob() yields a fake Blob),
//   - document.createElement('foliate-view') (a mock element with open/goTo/...).
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

// The hook dynamically imports this absolute URL; the real vendored module only
// exists under src/vendor/ at runtime. Mock the specifier so import() resolves to a
// no-op (its only job is registering the custom element, which we bypass).
vi.mock("../../vendor/foliate-js/view.js", () => ({}));

import { useBook } from "../useBook";
import type { FoliateView } from "../useBook";

const READING_LOCATION_KEY = "ebook:readingLocation";
const VALID_CFI = "epubcfi(/6/4!/4/2)";

/**
 * A mock <foliate-view>. open/goTo resolve by default; override per test.
 * setAttribute/append/remove are stubbed because useBook now mounts the element
 * into its container before opening (and removes it on cleanup).
 */
interface MockView {
  open: ReturnType<typeof vi.fn>;
  goTo: ReturnType<typeof vi.fn>;
  next: ReturnType<typeof vi.fn>;
  prev: ReturnType<typeof vi.fn>;
  goLeft: ReturnType<typeof vi.fn>;
  goRight: ReturnType<typeof vi.fn>;
  renderer: { setStyles: ReturnType<typeof vi.fn> };
  setAttribute: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  book?: { toc?: unknown };
}

function makeView(overrides: Partial<MockView> = {}): MockView {
  return {
    open: vi.fn().mockResolvedValue(undefined),
    // Default: a resolvable destination (any non-undefined value counts).
    goTo: vi.fn().mockResolvedValue({ index: 0 }),
    next: vi.fn().mockResolvedValue(undefined),
    prev: vi.fn().mockResolvedValue(undefined),
    goLeft: vi.fn().mockResolvedValue(undefined),
    goRight: vi.fn().mockResolvedValue(undefined),
    renderer: { setStyles: vi.fn() },
    setAttribute: vi.fn(),
    remove: vi.fn(),
    book: { toc: [] },
    ...overrides,
  };
}

/** A container whose append() is a no-op (the mock view isn't a real Node). */
function makeContainer(): HTMLElement {
  const host = document.createElement("div");
  vi.spyOn(host, "append").mockImplementation(() => {});

  return host;
}

let currentView: MockView;

beforeEach(() => {
  localStorage.clear();
  currentView = makeView();

  // fetch -> a Response-like object whose blob() yields a fake Blob.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob(["epub"])) }),
  );

  // createElement('foliate-view') -> the mock view; everything else passes
  // through to the real jsdom implementation.
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
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useBook — load lifecycle", () => {
  test("starts loading, then becomes ready with normalized toc and view set", async () => {
    // book.toc has one valid entry and one invalid (no href) that must be dropped.
    currentView = makeView({
      book: { toc: [{ label: "Act I", href: "ch1.html" }, { label: "bad" }] },
    });

    const { result } = renderHook((c) => useBook(c), { initialProps: makeContainer() });

    // Initial synchronous state is loading (Req 1.5).
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.view).toBe(currentView as unknown as FoliateView);
    expect(result.current.toc).toEqual([{ label: "Act I", href: "ch1.html", subitems: [] }]);
    expect(currentView.open).toHaveBeenCalledOnce();
  });

  test("open() rejecting surfaces status 'error' (Req 1.6)", async () => {
    currentView = makeView({ open: vi.fn().mockRejectedValue(new Error("bad epub")) });

    const { result } = renderHook((c) => useBook(c), { initialProps: makeContainer() });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.view).toBeNull();
  });

  test("open() hanging past 10s surfaces status 'error' (Req 1.7)", async () => {
    // shouldAdvanceTime lets real time keep nudging the fake clock, so the
    // awaited import()/fetch()/blob() setup chain (which vitest resolves on real
    // macrotasks) can progress and arm the race; advanceTimersByTimeAsync then
    // jumps the clock past the 10s open timeout instantly.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // open never resolves, so only the 10s timeout can settle the race.
    currentView = makeView({ open: vi.fn().mockReturnValue(new Promise<void>(() => {})) });

    const openMock = currentView.open;
    const { result } = renderHook((c) => useBook(c), { initialProps: makeContainer() });
    expect(result.current.status).toBe("loading");

    // Wait until open() is called — by then the race (and its 10s timeout) is
    // armed. waitFor works here because shouldAdvanceTime keeps real time moving.
    await waitFor(() => expect(openMock).toHaveBeenCalled());

    // Jump past the 10s timeout; its rejection drives the catch -> setStatus
    // ('error') (Req 1.7). Wrapped in act so the state update is flushed cleanly.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(result.current.status).toBe("error");
  });
});

describe("useBook — persisted location restore", () => {
  test("no persisted location restores the first section via goTo(0) (Req 1.2)", async () => {
    const { result } = renderHook((c) => useBook(c), { initialProps: makeContainer() });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(currentView.goTo).toHaveBeenCalledWith(0);
  });

  test("a resolvable persisted CFI is restored and left in storage (Req 1.3, 6.2)", async () => {
    localStorage.setItem(READING_LOCATION_KEY, VALID_CFI);
    // goTo(cfi) resolves to a destination -> stays put, no goTo(0).
    currentView = makeView({ goTo: vi.fn().mockResolvedValue({ index: 3 }) });

    const { result } = renderHook((c) => useBook(c), { initialProps: makeContainer() });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(currentView.goTo).toHaveBeenCalledWith(VALID_CFI);
    expect(currentView.goTo).not.toHaveBeenCalledWith(0);
    // Storage left unchanged.
    expect(localStorage.getItem(READING_LOCATION_KEY)).toBe(VALID_CFI);
  });

  test("an unresolvable persisted CFI falls back to goTo(0) and is discarded (Req 1.4, 6.4)", async () => {
    localStorage.setItem(READING_LOCATION_KEY, VALID_CFI);

    // goTo(cfi) -> undefined (can't resolve); goTo(0) -> a destination.
    const goTo = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ index: 0 });

    currentView = makeView({ goTo });

    const { result } = renderHook((c) => useBook(c), { initialProps: makeContainer() });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(goTo).toHaveBeenNthCalledWith(1, VALID_CFI);
    expect(goTo).toHaveBeenNthCalledWith(2, 0);
    // Unresolvable location discarded from storage.
    expect(localStorage.getItem(READING_LOCATION_KEY)).toBeNull();
  });

  test("on open error, a persisted location is left unchanged (Req 1.6)", async () => {
    localStorage.setItem(READING_LOCATION_KEY, VALID_CFI);
    currentView = makeView({ open: vi.fn().mockRejectedValue(new Error("boom")) });

    const { result } = renderHook((c) => useBook(c), { initialProps: makeContainer() });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(currentView.goTo).not.toHaveBeenCalled();
    expect(localStorage.getItem(READING_LOCATION_KEY)).toBe(VALID_CFI);
  });
});
