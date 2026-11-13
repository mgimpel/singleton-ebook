// Framework-agnostic table-of-contents normalization. No framework imports.

export interface TocEntry {
  label: string;
  href: string;
  subitems: TocEntry[];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Normalize raw foliate `book.toc` (possibly undefined/null/non-array or
 * arbitrarily nested) into a stable TocEntry[] where `subitems` is always an
 * array.
 *
 * Rules:
 * - Non-array `raw` (undefined, null, object, primitive) -> [].
 * - Drop any entry lacking a non-empty string `href` OR a non-empty string
 *   `label`.
 * - Recurse into `subitems`; output entries always get `subitems: []` (never
 *   undefined).
 * - Order and nesting depth of retained entries are preserved.
 * - Dropping a parent drops its whole subtree: children are only reachable
 *   through a retained parent, so "nesting depth preserved" means a retained
 *   entry's children stay at the same depth beneath it. This keeps the walk a
 *   simple recursive filter rather than re-parenting orphaned children.
 */
export function normalizeToc(raw: unknown): TocEntry[] {
  if (!Array.isArray(raw)) return [];
  const result: TocEntry[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const { label, href, subitems } = item as Record<string, unknown>;
    if (!isNonEmptyString(label) || !isNonEmptyString(href)) continue;
    result.push({ label, href, subitems: normalizeToc(subitems) });
  }
  return result;
}
