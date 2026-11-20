// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Subscribes to the foliate view's `relocate` event, holds the latest
// { fraction, cfi } for the ProgressIndicator (Req 6.3), and persists the CFI
// through a coalescing writer (at most one write per second — Req 6.1) backed
// by persistReadingLocation. Save failures surface via onSaveError (Req 6.5).

import { useEffect, useRef, useState } from "react";
import { createCoalescingWriter } from "../lib/coalesce";
import {
  persistReadingLocation,
  type SaveErrorKind,
} from "../lib/persistenceManager";
import { isValidReadingLocation } from "../lib/readingLocation";

// Minimal structural type for the <foliate-view> element. Kept local rather
// than imported from useBook (9.1) to avoid coupling to that task's export
// timing — we only need relocate (un)subscription here.
// ponytail: structural subset of foliate-view's EventTarget surface; replace
// with the FoliateView type from useBook once that hook exports it.
export interface FoliateView {
  addEventListener(
    type: "relocate",
    listener: (event: CustomEvent<RelocateDetail>) => void,
  ): void;
  removeEventListener(
    type: "relocate",
    listener: (event: CustomEvent<RelocateDetail>) => void,
  ): void;
}

// foliate-js relocate detail carries more fields; we only read these two.
interface RelocateDetail {
  fraction: number;
  cfi: string;
}

export interface ReaderLocation {
  fraction: number;
  cfi: string | null;
}

export function useReaderLocation(
  view: FoliateView | null,
  onSaveError: (kind: SaveErrorKind) => void,
): ReaderLocation {
  const [location, setLocation] = useState<ReaderLocation>({
    fraction: 0,
    cfi: null,
  });

  // onSaveError may change identity between renders; read the latest through a
  // ref so the coalescing writer stays stable. Both refs are only ever touched
  // inside effects / event handlers (never during render) per the rules of hooks.
  const onSaveErrorRef = useRef(onSaveError);
  useEffect(() => {
    onSaveErrorRef.current = onSaveError;
  }, [onSaveError]);

  // The coalescing writer persists across renders (and keeps its pending
  // window). It's created lazily inside the relocate effect's first run so no
  // ref is accessed during render. Real timers here; coalesce.ts is
  // property-tested with fake ones.
  const writerRef = useRef<
    ReturnType<typeof createCoalescingWriter<string>> | undefined
  >(undefined);

  useEffect(() => {
    if (view === null) return;

    if (!writerRef.current) {
      writerRef.current = createCoalescingWriter<string>({
        now: () => Date.now(),
        schedule: (fn, ms) => setTimeout(fn, ms),
        write: (cfi) => persistReadingLocation(cfi, onSaveErrorRef.current),
      });
    }

    const writer = writerRef.current;

    const handler = (event: CustomEvent<RelocateDetail>): void => {
      const { fraction, cfi } = event.detail;
      setLocation({ fraction, cfi: cfi ?? null });

      // Only persist valid CFIs — persistReadingLocation stores via
      // serializeReadingLocation which assumes a CFI; skip null/malformed.
      if (isValidReadingLocation(cfi)) {
        writer.push(cfi);
      }
    };

    view.addEventListener("relocate", handler);

    return () => view.removeEventListener("relocate", handler);
    // ponytail: a trailing coalesced write may fire shortly after unmount; it
    // is a harmless localStorage write, so we do not expose a cancel hook.
  }, [view]);

  return location;
}
