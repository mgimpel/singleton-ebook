import { useEffect, useRef } from "react";
import { classifySwipe } from "../lib/swipe";

export interface SwipeHandlers {
  next: () => void;
  prev: () => void;
}

/**
 * Attach touch-swipe navigation to a reader surface element.
 *
 * On touchstart the first touch's start point is recorded; on touchend the
 * travel (dx, dy) is classified by the pure `classifySwipe` and the matching
 * handler is invoked — `next` for a leftward swipe, `prev` for rightward, and
 * nothing for a gesture that doesn't qualify (Req 2.4, 2.8).
 *
 * Handlers are kept in a ref so the listeners bind once per `target` and always
 * read the latest `next`/`prev` without re-binding on every render.
 */
export function useSwipeNavigation(
  target: HTMLElement | null,
  handlers: SwipeHandlers,
): void {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!target) return;

    let startX = 0;
    let startY = 0;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      const direction = classifySwipe(touch.clientX - startX, touch.clientY - startY);
      if (direction === "next") handlersRef.current.next();
      else if (direction === "prev") handlersRef.current.prev();
    };

    // Read-only classification, no preventDefault — passive listeners are fine.
    target.addEventListener("touchstart", onTouchStart, { passive: true });
    target.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      target.removeEventListener("touchstart", onTouchStart);
      target.removeEventListener("touchend", onTouchEnd);
    };
  }, [target]);
}
