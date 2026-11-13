// Framework-agnostic persistence helpers. No framework imports.
//
// Shared validated-read / signal-on-failure localStorage access, plus one
// read/persist pair per persisted preference. Each pair owns only its storage
// key and normalizer; the shared helpers own the try/catch and graceful
// degradation (Req 7.5: a failed write must never break the session).

import { normalizeFontSize } from "./fontSize";
import { normalizeLanguage, type UI_Language } from "./language";
import { normalizeReaderColorScheme, type ReaderColorScheme } from "./readerColorScheme";
import {
  parseReadingLocation,
  serializeReadingLocation,
  type ReadingLocation,
} from "./readingLocation";

export type SaveErrorKind = "readerScheme" | "fontSize" | "readingLocation" | "language";

const STORAGE_KEYS = {
  readerScheme: "ebook:readerScheme",
  fontSize: "ebook:fontSize",
  language: "ebook:language",
  readingLocation: "ebook:readingLocation",
} as const;

/**
 * Validated read: reads localStorage in a try/catch (reads can throw in some
 * privacy modes) and hands the raw string|null to the normalizer, which is
 * responsible for defaulting on absent/invalid input. Never throws.
 */
function readPref<T>(key: string, normalize: (raw: string | null) => T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    raw = null;
  }
  return normalize(raw);
}

/**
 * Never-throw write: attempts localStorage.setItem and, on failure, signals the
 * caller via onSaveError(kind) instead of throwing (graceful degradation).
 */
function persistPref(
  key: string,
  value: string,
  onSaveError: (kind: SaveErrorKind) => void,
  kind: SaveErrorKind,
): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    onSaveError(kind);
  }
}

// --- Reader color scheme -----------------------------------------------------
export function readReaderScheme(): ReaderColorScheme {
  return readPref(STORAGE_KEYS.readerScheme, (raw) => normalizeReaderColorScheme(raw));
}

export function persistReaderScheme(
  v: ReaderColorScheme,
  onErr: (kind: SaveErrorKind) => void,
): void {
  persistPref(STORAGE_KEYS.readerScheme, v, onErr, "readerScheme");
}

// --- Font size ---------------------------------------------------------------
export function readFontSize(): number {
  return readPref(STORAGE_KEYS.fontSize, (raw) => normalizeFontSize(raw));
}

export function persistFontSize(v: number, onErr: (kind: SaveErrorKind) => void): void {
  persistPref(STORAGE_KEYS.fontSize, String(v), onErr, "fontSize");
}

// --- UI language (fully wired) ----------------------------------------------
export function readLanguage(): UI_Language {
  return readPref(STORAGE_KEYS.language, (raw) => normalizeLanguage(raw));
}

export function persistLanguage(v: UI_Language, onErr: (kind: SaveErrorKind) => void): void {
  persistPref(STORAGE_KEYS.language, v, onErr, "language");
}

// --- Reading location --------------------------------------------------------
export function readReadingLocation(): ReadingLocation | null {
  return readPref(STORAGE_KEYS.readingLocation, (raw) => parseReadingLocation(raw));
}

export function persistReadingLocation(
  v: ReadingLocation,
  onErr: (kind: SaveErrorKind) => void,
): void {
  persistPref(STORAGE_KEYS.readingLocation, serializeReadingLocation(v), onErr, "readingLocation");
}
