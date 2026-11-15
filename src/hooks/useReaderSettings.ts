// Holds the reader's font size and color scheme, applies them to the live
// foliate-view as a user stylesheet, persists changes, and resolves initial
// values from persistence on mount. While the scheme is "system" it watches
// the device prefers-color-scheme media query and re-applies on change.
//
// Apply + persist + system-watch live here; the panel controls just call the
// setters (normalize -> setState -> persist happens inside each setter).

import { useCallback, useEffect, useRef, useState } from "react";

import { normalizeFontSize } from "../lib/fontSize";
import {
  normalizeReaderColorScheme,
  resolveReaderScheme,
  type ReaderColorScheme,
} from "../lib/readerColorScheme";
import { buildReaderStyles } from "../lib/readerStyles";
import {
  persistFontSize,
  persistReaderScheme,
  readFontSize,
  readReaderScheme,
  type SaveErrorKind,
} from "../lib/persistenceManager";

// Minimal structural type for the foliate-view element — we only touch the
// one method this hook needs, to avoid coupling to useBook's richer type.
export interface FoliateView {
  // Optional to match useBook's view type — the renderer only exists after a
  // successful open; the apply effect no-ops until then.
  renderer?: { setStyles(css: string): void };
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

// Read the device dark preference, tolerating a matchMedia that is absent
// (non-browser) or a never-matching polyfill (jsdom): default to false.
function readDeviceIsDark(): boolean {
  if (typeof matchMedia !== "function") {
    return false;
  }

  return matchMedia(DARK_QUERY).matches;
}

export interface UseReaderSettingsResult {
  fontSize: number;
  readerScheme: ReaderColorScheme;
  setFontSize: (value: unknown) => void;
  setReaderScheme: (value: unknown) => void;
}

export function useReaderSettings(
  view: FoliateView | null,
  onSaveError: (kind: SaveErrorKind) => void,
): UseReaderSettingsResult {
  // Resolve initial values from persistence once, on mount.
  const [fontSize, setFontSizeState] = useState<number>(() => readFontSize());
  const [readerScheme, setReaderSchemeState] = useState<ReaderColorScheme>(() => readReaderScheme());
  // A bump counter driven only by the device media-query `change` event (set
  // from the event, never synchronously in an effect). The apply effect reads
  // the live matchMedia value and depends on this tick to re-run on change.
  const [deviceDarkTick, setDeviceDarkTick] = useState(0);

  // Keep onSaveError in a ref so the setters stay stable across renders even
  // if the caller passes a fresh callback each render. The ref is updated in
  // an effect (not during render) to satisfy the rules of hooks.
  const onSaveErrorRef = useRef(onSaveError);
  useEffect(() => {
    onSaveErrorRef.current = onSaveError;
  }, [onSaveError]);

  const setFontSize = useCallback((value: unknown) => {
    const next = normalizeFontSize(value);
    setFontSizeState(next);
    persistFontSize(next, onSaveErrorRef.current);
  }, []);

  const setReaderScheme = useCallback((value: unknown) => {
    const next = normalizeReaderColorScheme(value);
    setReaderSchemeState(next);
    persistReaderScheme(next, onSaveErrorRef.current);
  }, []);

  // Apply styles to the view whenever a visual input changes. Reads the live
  // device preference (so a concrete->system switch picks up the current value
  // without a stale state copy); deviceDarkTick forces a re-run after a device
  // `change`. No-op until the view is ready — useBook applies the initial
  // styles for first paint, so there is no flash while this is null.
  useEffect(() => {
    if (view === null) {
      return;
    }

    const concrete = resolveReaderScheme(readerScheme, readDeviceIsDark());
    view.renderer?.setStyles(buildReaderStyles(fontSize, concrete));
  }, [view, fontSize, readerScheme, deviceDarkTick]);

  // While the scheme is "system", watch the device preference; each change
  // bumps deviceDarkTick (set from the event, so no synchronous setState in an
  // effect), which re-runs the apply effect above. Unsubscribe on a concrete
  // choice or unmount.
  useEffect(() => {
    if (readerScheme !== "system" || typeof matchMedia !== "function") {
      return;
    }

    const mql = matchMedia(DARK_QUERY);
    const onChange = () => setDeviceDarkTick((t) => t + 1);
    mql.addEventListener("change", onChange);

    return () => mql.removeEventListener("change", onChange);
  }, [readerScheme]);

  return { fontSize, readerScheme, setFontSize, setReaderScheme };
}
