// Feature: epub-reader, Property 10: TOC normalization preserves the entry tree
import { describe, test, expect } from "vitest";
import fc from "fast-check";
import { normalizeToc, type TocEntry } from "../toc";

// --- Valid-only tree: every node has a non-empty label+href, so normalizeToc
// drops nothing. This lets us assert the output tree shape (labels, hrefs,
// order, nesting depth) is identical to the input — i.e. preservation when
// nothing is dropped. We stamp a junk field to prove it is stripped too.
const nonEmpty = fc.string({ minLength: 1 });

type ValidRaw = { label: string; href: string; subitems: ValidRaw[]; junk: number };

// Bounded-depth recursion: letrec alone recurses without a depth limit and
// blows the stack, so cap depth explicitly (max depth 3).
function validTreeAt(depth: number): fc.Arbitrary<ValidRaw> {
  const subitems =
    depth <= 0
      ? fc.constant<ValidRaw[]>([])
      : fc.array(validTreeAt(depth - 1), { maxLength: 3 });
  return fc.record({ label: nonEmpty, href: nonEmpty, junk: fc.integer(), subitems });
}

const validForest = fc.array(validTreeAt(3), { maxLength: 4 });

// Expected normalized form of a known-valid tree: same labels/hrefs/order/depth,
// subitems recursively normalized, junk dropped.
function expectedFromValid(nodes: ValidRaw[]): TocEntry[] {
  return nodes.map((n) => ({
    label: n.label,
    href: n.href,
    subitems: expectedFromValid(n.subitems),
  }));
}

// --- Mixed-validity raw tree: nodes may be valid, missing label/href, have
// wrong-typed fields, be junk primitives, or have a non-array subitems. Used to
// assert the structural invariants hold for whatever survives.
const maybeLabel = fc.oneof(nonEmpty, fc.constant(""), fc.constant(undefined), fc.integer());
const maybeHref = fc.oneof(nonEmpty, fc.constant(""), fc.constant(undefined), fc.integer());
const maybeSubitems = (sub: fc.Arbitrary<unknown>) =>
  fc.oneof(fc.array(sub, { maxLength: 3 }), fc.constant(undefined), fc.constant(null), fc.integer(), fc.string());

// Bounded-depth recursion (max depth 3) to keep generation fast and finite.
function mixedTreeAt(depth: number): fc.Arbitrary<unknown> {
  const sub = depth <= 0 ? fc.constant(undefined) : mixedTreeAt(depth - 1);
  return fc.oneof(
    // object-ish node with possibly-valid/invalid fields
    fc.record({
      label: maybeLabel,
      href: maybeHref,
      subitems: maybeSubitems(sub),
    }),
    // junk non-object nodes
    fc.constant(null),
    fc.constant(undefined),
    fc.integer(),
    fc.string(),
  );
}

const mixedRaw = fc.oneof(
  fc.array(mixedTreeAt(3), { maxLength: 5 }),
  // non-array raw inputs
  fc.constant(undefined),
  fc.constant(null),
  fc.record({ not: fc.string() }),
  fc.integer(),
  fc.string(),
);

// Recursively assert every retained entry has non-empty string label+href and
// an array subitems.
function assertInvariants(entries: TocEntry[]): void {
  expect(Array.isArray(entries)).toBe(true);
  for (const e of entries) {
    expect(typeof e.label).toBe("string");
    expect(e.label.length).toBeGreaterThan(0);
    expect(typeof e.href).toBe("string");
    expect(e.href.length).toBeGreaterThan(0);
    expect(Array.isArray(e.subitems)).toBe(true);
    assertInvariants(e.subitems);
  }
}

describe("Property 10: TOC normalization preserves the entry tree", () => {
  test("preserves labels, hrefs, order and nesting depth when nothing is dropped", () => {
    fc.assert(
      fc.property(validForest, (forest) => {
        expect(normalizeToc(forest)).toEqual(expectedFromValid(forest));
      }),
      { numRuns: 200 },
    );
  });

  test("output is always a TocEntry[] whose retained entries are valid with array subitems", () => {
    fc.assert(
      fc.property(mixedRaw, (raw) => {
        assertInvariants(normalizeToc(raw));
      }),
      { numRuns: 200 },
    );
  });

  test("non-array raw normalizes to an empty array", () => {
    const nonArray = fc.anything().filter((v) => !Array.isArray(v));
    fc.assert(
      fc.property(nonArray, (raw) => {
        expect(normalizeToc(raw)).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });
});
