// Standalone self-check for the TOC normalization pure module. Runs under
// `pnpm check` (vite-node auto-globs src/**/*.check.ts), independent of Vitest.
import assert from "node:assert/strict";

import { normalizeToc } from "./toc";

// Non-array input -> [].
for (const bad of [null, undefined, {}, "x", 42]) {
  const out = normalizeToc(bad);
  assert.ok(Array.isArray(out));
  assert.deepEqual(out, []);
}

// Mixed valid/invalid entries at the top level: drop entries missing href or
// label; keep valid ones in order with subitems always an array.
assert.deepEqual(
  normalizeToc([
    { label: "Chapter 1", href: "ch1.xhtml" },
    { label: "No href" }, // dropped: missing href
    { href: "no-label.xhtml" }, // dropped: missing label
    { label: "", href: "empty-label.xhtml" }, // dropped: empty label
    { label: "Chapter 2", href: "" }, // dropped: empty href
    { label: "Chapter 3", href: "ch3.xhtml" },
  ]),
  [
    { label: "Chapter 1", href: "ch1.xhtml", subitems: [] },
    { label: "Chapter 3", href: "ch3.xhtml", subitems: [] },
  ],
);

// Nested subitems preserved: a valid parent with a valid child keeps the child
// nested under it, and subitems is always an array.
const nested = normalizeToc([
  {
    label: "Part I",
    href: "part1.xhtml",
    subitems: [{ label: "Section 1.1", href: "s1-1.xhtml" }],
  },
]);
assert.ok(Array.isArray(nested));
assert.ok(Array.isArray(nested[0].subitems));
assert.deepEqual(nested, [
  {
    label: "Part I",
    href: "part1.xhtml",
    subitems: [{ label: "Section 1.1", href: "s1-1.xhtml", subitems: [] }],
  },
]);

// A valid parent containing an invalid child: drop the child, keep the parent
// with subitems: [].
assert.deepEqual(
  normalizeToc([
    {
      label: "Part II",
      href: "part2.xhtml",
      subitems: [{ label: "Missing href" }],
    },
  ]),
  [{ label: "Part II", href: "part2.xhtml", subitems: [] }],
);
