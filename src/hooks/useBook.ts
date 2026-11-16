// useBook — loads and parses the bundled EPUB with a 10s timeout, dynamically
// importing the vendored foliate-js view module. Owns the <foliate-view>
// element; restores the persisted reading location and applies the initial
// font size + reader scheme on ready so the first paint is correct.
//
// Pure logic lives in src/lib; this hook is the imperative glue between
// foliate-js and React state (Requirements 1.1–1.7, 2.6, 2.7, 3.3, 6.2, 6.4).

import { useCallback, useEffect, useRef, useState } from "react";

import bookUrl from "../assets/william-shakespeare_the-merchant-of-venice.epub?url";
import { buildReaderStyles } from "../lib/readerStyles";
import { resolveReaderScheme } from "../lib/readerColorScheme";
import {
  readFontSize,
  readReaderScheme,
  readReadingLocation,
} from "../lib/persistenceManager";
import { normalizeToc, type RawTocItem, type TocEntry } from "../lib/toc";

export type BookStatus = "loading" | "ready" | "error";

/**
 * Minimal structural type for the parts of the foliate-js `<foliate-view>`
 * custom element this feature uses. Importing view.js registers the element;
 * we type only what we touch rather than depending on foliate-js's ambient
 * types (it ships none suited to bundling).
 */
export interface FoliateView extends HTMLElement {
  open(book: Blob): Promise<void>;
  // Resolves to the destination, or undefined when it can't be resolved.
  goTo(target: string | number): Promise<object | null | undefined>;
  next(): Promise<void>;
  prev(): Promise<void>;
  goLeft(): Promise<void> | void;
  goRight(): Promise<void> | void;
  book?: { toc?: readonly RawTocItem[] };
  // The renderer is a real element (<foliate-paginator>): setStyles injects the
  // user stylesheet, and flow/gap/etc. are plain attributes read off it.
  renderer?: { setStyles(css: string): void; nextSection(): Promise<void>; prevSection(): Promise<void>; setAttribute(name: string, value: string): void };
}

export interface UseBookResult {
  status: BookStatus;
  view: FoliateView | null;
  toc: TocEntry[];
  // Arrow-typed (not method syntax): these are stable useCallback values, not
  // instance methods, so destructuring them must not trip unbound-method.
  next: () => void;
  prev: () => void;
  nextChapter: () => void;
  prevChapter: () => void;
  goTo: (target: string | number) => Promise<boolean>;
}

const OPEN_TIMEOUT_MS = 10_000;
const READING_LOCATION_KEY = "ebook:readingLocation";

/** Reject after `ms`, so a hung open() surfaces as an error (Req 1.7). */
function timeout(ms: number): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error("book open timed out")), ms);
  });
}

/**
 * Clear the persisted reading location directly. persistReadingLocation can
 * only write a valid CFI, so discarding an unresolvable one (Req 1.4/6.4) needs
 * a removeItem. Guarded because storage access can throw in privacy modes.
 */
function clearStoredLocation(): void {
  try {
    localStorage.removeItem(READING_LOCATION_KEY);
  } catch {
    // ponytail: best-effort discard — a storage that throws on remove also
    // threw on read, so there is nothing resolvable to leak. Nothing to do.
  }
}

export function useBook(container: HTMLElement | null): UseBookResult {
  const [status, setStatus] = useState<BookStatus>("loading");
  const [toc, setToc] = useState<TocEntry[]>([]);
  const viewRef = useRef<FoliateView | null>(null);
  const [view, setView] = useState<FoliateView | null>(null);

  useEffect(() => {
    // foliate-js's paginator lays out columns by measuring its container's
    // getBoundingClientRect(); a detached (zero-size) element renders zero
    // pages, so open()/goTo() resolve but no text ever paints. Wait for the
    // live surface, then mount the <foliate-view> into it *before* opening so
    // the engine always measures a real box.
    if (!container) return;

    let cancelled = false;
    let mounted: FoliateView | null = null;

    async function load(host: HTMLElement) {
      try {
        // Importing view.js registers the <foliate-view> custom element.
        await import("../vendor/foliate-js/view.js");

        const res = await fetch(bookUrl);

        // foliate-js detects format from the file name/type (isCBZ/isFBZ/isFB2
        // read `.name` off the file), so it needs a File, not a bare Blob — a
        // Blob has no `name` and `name.endsWith(...)` throws. Give it a .epub name.
        const file = new File([await res.blob()], "book.epub", {
          type: "application/epub+zip",
        });

        // SAFETY: "foliate-view" is registered by the foliate-js import above.
        const el = document.createElement("foliate-view") as FoliateView;
        // Paginated flow rather than continuous scroll (Req 2.1); the paginator
        // reads `flow` as an attribute on the view before its first render.
        el.setAttribute("flow", "paginated");
        // Mount into the live, sized surface before open() so layout measures a
        // real box. Tracked locally for cleanup even if we bail before setView.
        host.append(el);
        mounted = el;

        await Promise.race([el.open(file), timeout(OPEN_TIMEOUT_MS)]);

        if (cancelled) return;

        viewRef.current = el;
        setToc(normalizeToc(el.book?.toc));

        // Apply the initial font size + resolved reader scheme before the first
        // paint (Req 4.5, 5.7, 5.8, 7.4). useReaderSettings takes over changes.
        const deviceIsDark =
          window.matchMedia !== undefined &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;

        el.renderer?.setStyles(
          buildReaderStyles(readFontSize(), resolveReaderScheme(readReaderScheme(), deviceIsDark)),
        );

        // Publish the view before navigating so useReaderLocation can subscribe
        // to `relocate` and catch the first event goTo emits.
        setView(el);

        // Restore the persisted location, falling back to the first linear
        // section and discarding an unresolvable location (Req 1.2–1.4, 6.2/6.4).
        const persisted = readReadingLocation();

        if (persisted != null) {
          const dest = await el.goTo(persisted);

          if (dest === undefined) {
            await el.goTo(0);
            clearStoredLocation();
          }
        } else {
          await el.goTo(0);
        }

        if (cancelled) return;

        setStatus("ready");
      } catch {
        if (cancelled) return;
        // Leave any persisted location unchanged on failure/timeout (Req 1.6).
        setStatus("error");
      }
    }

    void load(container);

    return () => {
      cancelled = true;
      // Remove the element we mounted so a re-run (or unmount) leaves no
      // orphaned <foliate-view> in the surface.
      mounted?.remove();
      viewRef.current = null;
    };
  }, [container]);

  // foliate-js clamps at the book's first/last page, so Req 2.6/2.7 are
  // satisfied by the engine — no extra bounds logic here. LTR: goRight = next.
  const next = useCallback(() => {
    void viewRef.current?.goRight();
  }, []);

  const prev = useCallback(() => {
    void viewRef.current?.goLeft();
  }, []);

  const nextChapter = useCallback(() => {
    void viewRef.current?.renderer?.nextSection();
  }, []);

  const prevChapter = useCallback(() => {
    void viewRef.current?.renderer?.prevSection();
  }, []);

  const goTo = useCallback(async (target: string | number): Promise<boolean> => {
    const dest = await viewRef.current?.goTo(target);

    return dest !== undefined && dest !== null;
  }, []);

  return { status, view, toc, next, prev, nextChapter, prevChapter, goTo };
}
