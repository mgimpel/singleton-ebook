import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSwipeNavigation } from "../useSwipeNavigation";

// jsdom lacks reliable TouchEvent/Touch constructors, so dispatch a plain Event
// and attach the single `changedTouches` entry the hook reads (clientX/Y).
function dispatchTouch(
  target: HTMLElement,
  type: "touchstart" | "touchend",
  clientX: number,
  clientY: number,
): void {
  const event = new Event(type);
  Object.defineProperty(event, "changedTouches", {
    value: [{ clientX, clientY }],
  });
  target.dispatchEvent(event);
}

/** Dispatch a full swipe gesture: touchstart at (sx,sy) then touchend at (ex,ey). */
function swipe(
  target: HTMLElement,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
): void {
  dispatchTouch(target, "touchstart", sx, sy);
  dispatchTouch(target, "touchend", ex, ey);
}

describe("useSwipeNavigation", () => {
  let el: HTMLElement;

  function setup() {
    el = document.createElement("div");
    document.body.appendChild(el);
    const next = vi.fn();
    const prev = vi.fn();
    const { unmount } = renderHook(() =>
      useSwipeNavigation(el, { next, prev }),
    );
    return { next, prev, unmount };
  }

  afterEach(() => {
    el?.remove();
  });

  it("calls next on a qualifying leftward swipe (Req 2.4)", () => {
    const { next, prev } = setup();
    swipe(el, 200, 100, 100, 100); // dx = -100, dy = 0
    expect(next).toHaveBeenCalledTimes(1);
    expect(prev).not.toHaveBeenCalled();
  });

  it("calls prev on a qualifying rightward swipe (Req 2.4)", () => {
    const { next, prev } = setup();
    swipe(el, 100, 100, 220, 100); // dx = +120, dy = 0
    expect(prev).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls neither on a sub-threshold swipe (Req 2.8)", () => {
    const { next, prev } = setup();
    swipe(el, 100, 100, 130, 100); // dx = 30 (< 50)
    expect(next).not.toHaveBeenCalled();
    expect(prev).not.toHaveBeenCalled();
  });

  it("calls neither on a vertically dominant swipe (Req 2.8)", () => {
    const { next, prev } = setup();
    swipe(el, 100, 100, 40, 200); // dx = -60, dy = +100 → |dx| not > |dy|
    expect(next).not.toHaveBeenCalled();
    expect(prev).not.toHaveBeenCalled();
  });

  it("detaches listeners on unmount", () => {
    const { next, prev, unmount } = setup();
    unmount();
    swipe(el, 200, 100, 100, 100); // would be a next swipe if still bound
    expect(next).not.toHaveBeenCalled();
    expect(prev).not.toHaveBeenCalled();
  });
});
