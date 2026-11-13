// Unit tests for useReaderSettings.
// Validates: Requirements 4.2, 5.2, 5.4, 5.5, 5.9, 7.3, 7.4
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useReaderSettings, type FoliateView } from "../useReaderSettings";
import { READER_SCHEME_COLORS } from "../../lib/readerColorScheme";

// A fake foliate-view exposing only the method the hook touches.
function makeView(): { view: FoliateView; setStyles: ReturnType<typeof vi.fn> } {
  const setStyles = vi.fn();
  return { view: { renderer: { setStyles } }, setStyles };
}

// A controllable matchMedia: a settable `matches` and real add/remove listener
// bookkeeping so a test can fire a `change`. Only the dark query is driven.
interface ControllableMatchMedia {
  install(): void;
  restore(): void;
  setDark(dark: boolean): void;
  fireChange(): void;
}

function controllableMatchMedia(): ControllableMatchMedia {
  const original = window.matchMedia;
  let matches = false;
  const listeners = new Set<() => void>();

  const install = () => {
    window.matchMedia = ((query: string) =>
      ({
        get matches() {
          return matches;
        },
        media: query,
        onchange: null,
        addEventListener: (_: string, cb: () => void) => listeners.add(cb),
        removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  };

  return {
    install,
    restore: () => {
      window.matchMedia = original;
    },
    setDark: (dark: boolean) => {
      matches = dark;
    },
    fireChange: () => {
      for (const cb of listeners) {
        cb();
      }
    },
  };
}

const lastStyles = (setStyles: ReturnType<typeof vi.fn>): string =>
  setStyles.mock.calls.at(-1)?.[0] as string;

describe("useReaderSettings", () => {
  let mm: ControllableMatchMedia;

  beforeEach(() => {
    localStorage.clear();
    mm = controllableMatchMedia();
    mm.install();
  });

  afterEach(() => {
    mm.restore();
    vi.restoreAllMocks();
  });

  test("resolves initial values from persistence and applies them once on mount (Req 7.3, 7.4)", () => {
    localStorage.setItem("ebook:fontSize", "22");
    localStorage.setItem("ebook:readerScheme", "sepia");
    const { view, setStyles } = makeView();

    const { result } = renderHook(() => useReaderSettings(view, vi.fn()));

    expect(result.current.fontSize).toBe(22);
    expect(result.current.readerScheme).toBe("sepia");
    expect(setStyles).toHaveBeenCalledTimes(1);
    const css = lastStyles(setStyles);
    expect(css).toContain("22px");
    expect(css).toContain(READER_SCHEME_COLORS.sepia.fg);
    expect(css).toContain(READER_SCHEME_COLORS.sepia.bg);
  });

  test("applies and persists on setFontSize / setReaderScheme (Req 4.2, 5.2)", () => {
    const { view, setStyles } = makeView();
    const { result } = renderHook(() => useReaderSettings(view, vi.fn()));

    act(() => result.current.setFontSize(24));
    expect(lastStyles(setStyles)).toContain("24px");
    expect(localStorage.getItem("ebook:fontSize")).toBe("24");

    act(() => result.current.setReaderScheme("dark"));
    const css = lastStyles(setStyles);
    expect(css).toContain(READER_SCHEME_COLORS.dark.fg);
    expect(css).toContain(READER_SCHEME_COLORS.dark.bg);
    expect(localStorage.getItem("ebook:readerScheme")).toBe("dark");
  });

  test("re-applies when the device preference changes while scheme is system (Req 5.4, 5.5)", () => {
    mm.setDark(false);
    const { view, setStyles } = makeView();
    const { result } = renderHook(() => useReaderSettings(view, vi.fn()));

    // Default scheme is "system"; initial resolve is light.
    expect(result.current.readerScheme).toBe("system");
    expect(lastStyles(setStyles)).toContain(READER_SCHEME_COLORS.light.bg);

    const before = setStyles.mock.calls.length;
    act(() => {
      mm.setDark(true);
      mm.fireChange();
    });

    expect(setStyles.mock.calls.length).toBeGreaterThan(before);
    const css = lastStyles(setStyles);
    expect(css).toContain(READER_SCHEME_COLORS.dark.fg);
    expect(css).toContain(READER_SCHEME_COLORS.dark.bg);
  });

  test("stops re-applying on device change once a concrete scheme is chosen (Req 5.5)", () => {
    mm.setDark(false);
    const { view, setStyles } = makeView();
    const { result } = renderHook(() => useReaderSettings(view, vi.fn()));

    act(() => result.current.setReaderScheme("light"));
    const after = setStyles.mock.calls.length;

    act(() => {
      mm.setDark(true);
      mm.fireChange();
    });

    // The media listener was removed when leaving "system": no new apply.
    expect(setStyles.mock.calls.length).toBe(after);
    expect(lastStyles(setStyles)).toContain(READER_SCHEME_COLORS.light.bg);
  });

  test("signals onSaveError and keeps the session going when a write fails (Req 5.9)", () => {
    const onSaveError = vi.fn();
    const { view } = makeView();
    const { result } = renderHook(() => useReaderSettings(view, onSaveError));

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    act(() => result.current.setFontSize(20));
    expect(onSaveError).toHaveBeenCalledWith("fontSize");
    // State still updated despite the write failure — session continues.
    expect(result.current.fontSize).toBe(20);

    act(() => result.current.setReaderScheme("dark"));
    expect(onSaveError).toHaveBeenCalledWith("readerScheme");
    expect(result.current.readerScheme).toBe("dark");

    spy.mockRestore();
  });
});
