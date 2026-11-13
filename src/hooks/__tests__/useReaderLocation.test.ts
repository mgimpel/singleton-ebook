// Feature: epub-reader, Task 9.4 — unit tests for useReaderLocation.
// Validates: Requirements 6.1, 6.3, 6.5
//
// The hook subscribes to the foliate view's `relocate` event, exposes the
// latest { fraction, cfi }, and persists valid CFIs through a coalescing
// writer (at most one localStorage write per second) that reports save
// failures via onSaveError.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useReaderLocation, type FoliateView } from "../useReaderLocation";

const KEY = "ebook:readingLocation";

// A fake foliate view: a single-slot listener store for the `relocate` event
// plus an emit() that invokes the registered handler with a CustomEvent-like
// detail, mirroring how foliate-js dispatches relocate.
function makeFakeView(): {
  view: FoliateView;
  emit: (fraction: number, cfi: string) => void;
  listenerCount: () => number;
} {
  const listeners = new Set<(event: CustomEvent) => void>();
  const view: FoliateView = {
    addEventListener: (_type, listener) => {
      listeners.add(listener as (event: CustomEvent) => void);
    },
    removeEventListener: (_type, listener) => {
      listeners.delete(listener as (event: CustomEvent) => void);
    },
  };
  return {
    view,
    emit: (fraction, cfi) => {
      const event = { detail: { fraction, cfi } } as CustomEvent;
      for (const listener of listeners) listener(event);
    },
    listenerCount: () => listeners.size,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useReaderLocation", () => {
  // Req 6.3: expose the current reading progress as fraction + cfi.
  test("relocate updates the returned fraction and cfi", () => {
    const { view, emit } = makeFakeView();
    const onSaveError = vi.fn();

    const { result } = renderHook(() => useReaderLocation(view, onSaveError));
    expect(result.current).toEqual({ fraction: 0, cfi: null });

    act(() => emit(0.42, "epubcfi(/6/4!/4/2)"));

    expect(result.current).toEqual({ fraction: 0.42, cfi: "epubcfi(/6/4!/4/2)" });
  });

  // Req 6.1: coalesce rapid relocates to at most one write per second,
  // keeping the last cfi.
  test("rapid relocates coalesce to one persist per second (last cfi wins)", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { view, emit } = makeFakeView();
    const onSaveError = vi.fn();

    renderHook(() => useReaderLocation(view, onSaveError));

    // Three relocates inside the same <1000ms window.
    act(() => {
      emit(0.1, "epubcfi(/6/2!/4/2)");
      emit(0.2, "epubcfi(/6/4!/4/2)");
      emit(0.3, "epubcfi(/6/6!/4/2)");
    });
    // Nothing written until the window closes.
    expect(setItem).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Exactly one write carrying the last cfi.
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith(KEY, "epubcfi(/6/6!/4/2)");

    // A relocate in a new window produces a second write.
    act(() => emit(0.5, "epubcfi(/6/8!/4/2)"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(setItem).toHaveBeenCalledTimes(2);
    expect(setItem).toHaveBeenLastCalledWith(KEY, "epubcfi(/6/8!/4/2)");
    expect(onSaveError).not.toHaveBeenCalled();
  });

  // Req 6.5: a failed write signals the caller and never throws.
  test("a throwing storage write signals onSaveError without throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const { view, emit } = makeFakeView();
    const onSaveError = vi.fn();

    renderHook(() => useReaderLocation(view, onSaveError));

    expect(() => {
      act(() => emit(0.6, "epubcfi(/6/4!/4/2)"));
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }).not.toThrow();

    expect(onSaveError).toHaveBeenCalledTimes(1);
    expect(onSaveError).toHaveBeenCalledWith("readingLocation");
  });

  // Guard: a malformed cfi still updates the displayed location but is never
  // persisted (only CFI-shaped values reach the writer).
  test("invalid cfi is reflected in the location but not persisted", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { view, emit } = makeFakeView();
    const onSaveError = vi.fn();

    const { result } = renderHook(() => useReaderLocation(view, onSaveError));

    act(() => emit(0.25, "not-a-cfi"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // The display reflects whatever the view reported...
    expect(result.current).toEqual({ fraction: 0.25, cfi: "not-a-cfi" });
    // ...but a non-CFI value is never written.
    expect(setItem).not.toHaveBeenCalled();
    expect(onSaveError).not.toHaveBeenCalled();
  });

  // The hook unsubscribes on unmount.
  test("unmount removes the relocate listener", () => {
    const { view, listenerCount } = makeFakeView();
    const { unmount } = renderHook(() => useReaderLocation(view, vi.fn()));

    expect(listenerCount()).toBe(1);
    unmount();
    expect(listenerCount()).toBe(0);
  });
});
