// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Framework-agnostic coalescing writer. No framework imports — the clock and
// timer are injected so this is drivable deterministically from tests.

export interface CoalesceOptions<T> {
  /** Coalescing window in milliseconds. Defaults to 1000 (one second). */
  windowMs?: number;
  /** Injected clock returning the current time in ms (e.g. Date.now). */
  now: () => number;
  /** The actual storage write. Called at most once per window. */
  write: (value: T) => void;
  /**
   * Injected timer (e.g. setTimeout). Schedules `fn` to run after `delayMs`.
   * Injected so tests can drive flushing with a fake clock and no real timers.
   */
  schedule: (fn: () => void, delayMs: number) => void;
}

export interface CoalescingWriter<T> {
  /** Record the latest value; writes it at most once per window (trailing edge). */
  push(value: T): void;
}

/**
 * Create a coalescing writer using a trailing-edge policy: the first push in an
 * idle window schedules a flush at the window's end; further pushes within that
 * window only update the pending value (last-value-wins). When the window ends,
 * exactly one `write` fires with the most recent value. This guarantees at most
 * one write per `windowMs` window and that the written value is the last pushed
 * in that window.
 */
export function createCoalescingWriter<T>(
  opts: CoalesceOptions<T>,
): CoalescingWriter<T> {
  const { write, schedule, windowMs = 1000 } = opts;

  let pending: { value: T } | null = null;

  function flush(): void {
    if (pending === null) return;
    const { value } = pending;
    pending = null;
    write(value);
  }

  return {
    push(value: T): void {
      const idle = pending === null;
      pending = { value };

      // Only the first push in an idle window schedules a flush; later pushes in
      // the same window just update the pending value (last-value-wins), so at
      // most one write fires per window.
      if (idle) schedule(flush, windowMs);
    },
  };
}
