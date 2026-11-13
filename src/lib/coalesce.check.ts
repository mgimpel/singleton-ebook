// Standalone self-check for the coalescing writer. Runs under `pnpm check`
// (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
import assert from "node:assert/strict";

import { createCoalescingWriter } from "./coalesce";

// Deterministic fake clock + scheduler: `schedule` records a pending timer at
// `clock + delay`; `advance` moves the clock and fires every timer whose fireAt
// has been reached. Nothing fires until we advance past the window.
let clock = 0;
let pending: { fireAt: number; fn: () => void }[] = [];

function schedule(fn: () => void, delayMs: number): void {
  pending.push({ fireAt: clock + delayMs, fn });
}

function advance(ms: number): void {
  clock += ms;
  const due = pending.filter((t) => t.fireAt <= clock);
  pending = pending.filter((t) => t.fireAt > clock);
  for (const t of due) t.fn();
}

const writes: string[] = [];
const writer = createCoalescingWriter<string>({
  now: () => clock,
  write: (value) => writes.push(value),
  schedule,
  windowMs: 1000,
});

// Window 1: three pushes within 1s, none past the window → no write yet.
writer.push("a");
advance(300); // 300ms — flush not due yet
writer.push("b");
advance(300); // 600ms
writer.push("c");
assert.equal(writes.length, 0, "no write before the window elapses");

// Elapse the window and fire the scheduled flush: exactly one write, last value.
advance(500); // 1100ms ≥ the 1000ms flush fireAt
assert.deepEqual(writes, ["c"], "one write with the last value (last-value-wins)");

// Window 2: a fresh push schedules a new flush; firing it writes 'd'.
writer.push("d");
advance(1000);
assert.deepEqual(writes, ["c", "d"], "a new window produces a second write");

// Totals: at most one write per window → exactly two writes overall.
assert.equal(writes.length, 2, "two windows → two writes");
