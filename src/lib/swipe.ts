// Framework-agnostic swipe-gesture classification. No framework imports.

export type SwipeDirection = "next" | "prev" | "none";

/** Minimum horizontal travel (px) for a gesture to count as a swipe. */
export const SWIPE_THRESHOLD = 50;

/**
 * Classify a swipe gesture's travel into a navigation direction.
 *  - "next" when |dx| >= SWIPE_THRESHOLD and |dx| > |dy| and dx < 0 (leftward -> advance)
 *  - "prev" when |dx| >= SWIPE_THRESHOLD and |dx| > |dy| and dx > 0 (rightward -> go back)
 *  - "none" otherwise (sub-threshold, vertically dominant, or dx === 0)
 */
export function classifySwipe(dx: number, dy: number): SwipeDirection {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) {
    return "none";
  }

  return dx < 0 ? "next" : "prev";
}
