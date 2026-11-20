// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Feature: epub-reader, Property 11: Location writes are coalesced to at most one per one-second window
// Validates: Requirements 6.1
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import { createCoalescingWriter } from "../coalesce";

const WINDOW_MS = 1000;

/**
 * Drive the REAL coalescing writer with a fake clock + a fake scheduler queue.
 * Returns the recorded writes (timestamp + value) after all pushes are made and
 * every scheduled flush has fired.
 */
function run(events: readonly { value: number; dtMs: number }[]) {
  let clock = 0;
  // Fake timer queue: callbacks tagged with the absolute time they fire at.
  const queue: { fireAt: number; fn: () => void }[] = [];
  // `pushesSoFar` counts pushes already issued when a write fires, so we can
  // tie each write to the exact value that was most-recently pushed in real
  // execution order (robust to pushes landing exactly on a flush boundary).
  let pushesSoFar = 0;
  const writes: { t: number; value: number; lastPushIndex: number }[] = [];

  const writer = createCoalescingWriter<number>({
    now: () => clock,
    write: (value) =>
      writes.push({ t: clock, value, lastPushIndex: pushesSoFar - 1 }),
    schedule: (fn, delayMs) => {
      queue.push({ fireAt: clock + delayMs, fn });
    },
    windowMs: WINDOW_MS,
  });

  // Fire every scheduled callback whose time is <= the current clock, in time
  // order. Firing one may schedule another (same or later fireAt), so loop.
  const fireDue = () => {
    for (;;) {
      let idx = -1;

      for (let i = 0; i < queue.length; i++) {
        if (queue[i].fireAt <= clock && (idx === -1 || queue[i].fireAt < queue[idx].fireAt)) {
          idx = i;
        }
      }

      if (idx === -1) return;
      const [due] = queue.splice(idx, 1);
      due.fn();
    }
  };

  for (const { value, dtMs } of events) {
    clock += dtMs;
    fireDue();
    writer.push(value);
    pushesSoFar += 1;
  }

  // Flush the tail: advance to the latest pending fire time and fire everything.
  while (queue.length > 0) {
    clock = Math.max(clock, ...queue.map((q) => q.fireAt));
    fireDue();
  }

  return writes;
}

describe("Property 11: location writes coalesced to one per 1s window", () => {
  // Non-empty sequence of pushes; gaps span sub-window and multi-window spacing.
  const events = fc.array(
    fc.record({
      value: fc.integer(),
      dtMs: fc.integer({ min: 0, max: 3000 }),
    }),
    { minLength: 1, maxLength: 50 },
  );

  test("at most one write per window and each write carries the window's last value", () => {
    fc.assert(
      fc.property(events, (seq) => {
        const values = seq.map((e) => e.value);
        const writes = run(seq);

        // Every non-empty sequence yields at least one write: the final push
        // always leaves a pending value that the tail flush drains.
        expect(writes.length).toBeGreaterThanOrEqual(1);

        // (a) At most one write per 1s window: consecutive writes are >= windowMs
        // apart (a window's flush is scheduled windowMs after its first push, and
        // the next window can't open until that flush clears the pending value).
        for (let i = 1; i < writes.length; i++) {
          expect(writes[i].t - writes[i - 1].t).toBeGreaterThanOrEqual(WINDOW_MS);
        }

        // (b) Last-value-wins: each write carries the most recent value pushed at
        // or before the flush fired, in real execution order.
        for (const w of writes) {
          expect(w.value).toBe(values[w.lastPushIndex]);
        }

        // All pushes are accounted for: the last write carries the final value.
        expect(writes[writes.length - 1].value).toBe(values[values.length - 1]);
      }),
      { numRuns: 200 },
    );
  });
});
