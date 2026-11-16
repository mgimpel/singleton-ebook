// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// The settings surface: a ResponsiveOverlay (Drawer on mobile, Modal on
// desktop) titled via i18n, hosting the three settings controls (font size,
// reader scheme, UI language), all defined in this file. It owns no state —
// the two reader-owned values (font size, scheme) come from useReaderSettings
// up in the reader via props, whose setters already normalize -> apply ->
// persist; the UI-language control is self-contained (normalize ->
// i18n.changeLanguage -> persistLanguage). onSaveError is threaded to
// LanguageControl so a failed persist surfaces as a non-blocking notice
// (Req 8.8). Focus returns to the gear that opened it via returnFocusRef.

import { Input, SegmentedControl, Select, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { FONT_SIZE_OPTIONS } from "../lib/fontSize";
import { UI_LANGUAGES, normalizeLanguage } from "../lib/language";
import { persistLanguage, type SaveErrorKind } from "../lib/persistenceManager";
import {
  READER_COLOR_SCHEMES,
  type ReaderColorScheme,
} from "../lib/readerColorScheme";
import ResponsiveOverlay from "./ResponsiveOverlay";

// SegmentedControl data must be strings; map the numeric options once.
const FONT_SIZE_DATA = FONT_SIZE_OPTIONS.map((n) => String(n));

export function FontSizeControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useTranslation("ui");
  const label = t("settings.fontSize");

  return (
    <Input.Wrapper label={label}>
      {/* SegmentedControl is a radiogroup, not a single labelable control, so
          the Input.Wrapper <label> won't associate via `for` — name it
          directly so the control always has an accessible name. */}
      <SegmentedControl
        fullWidth
        data={FONT_SIZE_DATA}
        value={String(value)}
        onChange={(v) => onChange(Number(v))}
        aria-label={label}
      />
    </Input.Wrapper>
  );
}

export function ReaderThemeControl({
  value,
  onChange,
}: {
  value: ReaderColorScheme;
  onChange: (value: ReaderColorScheme) => void;
}) {
  const { t } = useTranslation("ui");

  const data = READER_COLOR_SCHEMES.map((scheme) => ({
    value: scheme,
    label: t(`settings.theme.${scheme}`),
  }));

  return (
    <Input.Wrapper label={t("settings.theme.label")}>
      <SegmentedControl
        fullWidth
        data={data}
        value={value}
        // SAFETY: option values come only from `data`, built from ReaderColorScheme values.
        onChange={(v) => onChange(v as ReaderColorScheme)}
      />
    </Input.Wrapper>
  );
}

// Endonyms for the bundled locales (keys cover exactly UI_LANGUAGES). They are
// language-agnostic, so they need no per-locale translation key.
const ENDONYMS: Record<(typeof UI_LANGUAGES)[number], string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
};

const LANGUAGE_DATA = UI_LANGUAGES.map((lang) => ({
  value: lang,
  label: ENDONYMS[lang],
}));

export function LanguageControl({
  onSaveError,
}: {
  onSaveError: (kind: SaveErrorKind) => void;
}) {
  const { t, i18n } = useTranslation("ui");
  // Normalize so the Select value is always a valid bundled locale, even if
  // i18n.language carries a region subtag or an unbundled value.
  const value = normalizeLanguage(i18n.language);

  return (
    <Select
      label={t("settings.language")}
      data={LANGUAGE_DATA}
      value={value}
      allowDeselect={false}
      onChange={(v) => {
        const lang = normalizeLanguage(v);
        // changeLanguage returns a promise; don't block the UI. react-i18next
        // re-renders chrome once it resolves, so the Select value follows.
        void i18n.changeLanguage(lang);
        persistLanguage(lang, onSaveError);
      }}
    />
  );
}

interface SettingsPanelProps {
  opened: boolean;
  onClose: () => void;
  /** Current font size, from useReaderSettings. */
  fontSize: number;
  /** useReaderSettings.setFontSize — normalizes, applies, and persists (Req 4.1). */
  onFontSizeChange: (value: number) => void;
  /** Current reader color scheme, from useReaderSettings. */
  readerScheme: ReaderColorScheme;
  /** useReaderSettings.setReaderScheme — normalizes, applies, and persists (Req 5.1). */
  onReaderSchemeChange: (value: ReaderColorScheme) => void;
  /** Threaded to LanguageControl for the non-blocking save-failure notice (Req 8.1/8.8). */
  onSaveError: (kind: SaveErrorKind) => void;
  /** Focus returns here on close (the settings gear button). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

export default function SettingsPanel({
  opened,
  onClose,
  fontSize,
  onFontSizeChange,
  readerScheme,
  onReaderSchemeChange,
  onSaveError,
  returnFocusRef,
}: SettingsPanelProps) {
  const { t } = useTranslation("ui");

  return (
    <ResponsiveOverlay
      opened={opened}
      onClose={onClose}
      title={t("settings.title")}
      returnFocusRef={returnFocusRef}
    >
      <Stack>
        <FontSizeControl value={fontSize} onChange={onFontSizeChange} />
        <ReaderThemeControl value={readerScheme} onChange={onReaderSchemeChange} />
        <LanguageControl onSaveError={onSaveError} />
      </Stack>
    </ResponsiveOverlay>
  );
}
