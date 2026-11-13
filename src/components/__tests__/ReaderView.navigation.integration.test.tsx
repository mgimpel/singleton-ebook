// Feature: epub-reader — navigation integration test for ReaderView.
// Validates: Requirements 2.4, 2.5, 2.8
//
// Unlike ReaderView.test.tsx (which mocks useBook), this mounts the REAL
// ReaderView wired to the REAL useBook + REAL useSwipeNavigation and drives it
// end to end: keyboard arrows and simulated touch swipes flow through the live
// hooks into the view's goRight/goLeft (next/prev). Only the external seams are
// stubbed — the vendored view.js module, global fetch, and
// createElement('foliate-view') — plus the location/settings hooks are no-ops
// (they need a live foliate view we don't have here), so navigation is isolated.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";

// useBook dynamically imports this absolute URL; the real vendored module only
// exists under public/ at runtime. Resolve it to a no-op (its only job is
// registering the custom element, which we bypass via createElement below).
vi.mock("/vendor/foliate-js/view.js", () => ({}));

// Isolate navigation: the location/settings hooks touch a live foliate view's
// relocate events / renderer.setStyles we don't exercise here. useBook and
// useSwipeNavigation are the hooks under test — NOT mocked.
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

import ReaderView from "../ReaderView";
import i18n from "../../i18n";

/** The parts of the mock <foliate-view> a test asserts on. */
interface MockView extends HTMLElement {
  open: ReturnType<typeof vi.fn>;
  goTo: ReturnType<typeof vi.fn>;
  goLeft: ReturnType<typeof vi.fn>;
  goRight: ReturnType<typeof vi.fn>;
}

/**
 * A REAL DOM element standing in for <foliate-view> so ReaderView's
 * surface.append(view) / view.remove() / container.contains(view) all work,
 * with spy open/goTo/goLeft/goRight and a spy renderer attached. useBook's
 * next→goRight / prev→goLeft land on these spies.
 */
function makeView(): MockView {
  const el = document.createElement("div") as unknown as MockView;
  el.open = vi.fn().mockResolvedValue(undefined);
  el.goTo = vi.fn().mockResolvedValue({ index: 0 });
  el.goLeft = vi.fn().mockResolvedValue(undefined);
  el.goRight = vi.fn().mockResolvedValue(undefined);
  (el as unknown as { next: unknown }).next = vi.fn().mockResolvedValue(undefined);
  (el as unknown as { prev: unknown }).prev = vi.fn().mockResolvedValue(undefined);
  (el as unknown as { renderer: unknown }).renderer = {
    setStyles: vi.fn(),
    setAttribute: vi.fn(),
  };
  (el as unknown as { book: unknown }).book = { toc: [] };
  return el;
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

  // createElement('foliate-view') -> the SAME mock object useBook will drive,
  // so next/prev's goRight/goLeft land on our spies. Everything else passes
  // through to the real jsdom implementation (ReaderView renders real divs).
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

/** jsdom lacks reliable Touch constructors; dispatch a plain Event with the
 *  single changedTouches entry useSwipeNavigation reads (clientX/Y). */
function dispatchTouch(
  target: EventTarget,
  type: "touchstart" | "touchend",
  clientX: number,
  clientY: number,
): void {
  const event = new Event(type);
  Object.defineProperty(event, "changedTouches", { value: [{ clientX, clientY }] });
  target.dispatchEvent(event);
}

/** Full swipe gesture on the reader surface: touchstart at (sx,sy) → touchend at (ex,ey). */
function swipe(target: EventTarget, sx: number, sy: number, ex: number, ey: number): void {
  dispatchTouch(target, "touchstart", sx, sy);
  dispatchTouch(target, "touchend", ex, ey);
}

/** Render, wait for the view to mount into the surface (ready), return the surface node. */
async function renderReady() {
  renderReader();
  // The view mounts into the surface asynchronously once useBook reaches ready.
  await waitFor(() => expect(currentView.isConnected).toBe(true));
  // The surface is the node useBook's view was appended to and useSwipeNavigation
  // bound its touch listeners to — i.e. the view's parent element.
  return currentView.parentElement as HTMLElement;
}

describe("ReaderView navigation integration", () => {
  test("keyboard arrows drive the view's goRight/goLeft (Req 2.5)", async () => {
    await renderReady();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(currentView.goRight).toHaveBeenCalledTimes(1);
    expect(currentView.goLeft).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(currentView.goLeft).toHaveBeenCalledTimes(1);
    expect(currentView.goRight).toHaveBeenCalledTimes(1);
  });

  test("a qualifying swipe drives next/prev through useSwipeNavigation (Req 2.4)", async () => {
    const surface = await renderReady();

    // Leftward qualifying swipe (dx = -100, dy = 0) → next → goRight.
    swipe(surface, 200, 100, 100, 100);
    expect(currentView.goRight).toHaveBeenCalledTimes(1);
    expect(currentView.goLeft).not.toHaveBeenCalled();

    // Rightward qualifying swipe (dx = +120, dy = 0) → prev → goLeft.
    swipe(surface, 100, 100, 220, 100);
    expect(currentView.goLeft).toHaveBeenCalledTimes(1);
    expect(currentView.goRight).toHaveBeenCalledTimes(1);
  });

  test("a sub-threshold swipe moves neither direction (Req 2.8)", async () => {
    const surface = await renderReady();

    // dx = 30 (< 50 px) → classifies as none → no navigation.
    swipe(surface, 100, 100, 130, 100);
    expect(currentView.goRight).not.toHaveBeenCalled();
    expect(currentView.goLeft).not.toHaveBeenCalled();
  });
});
