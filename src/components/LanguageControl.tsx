// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// A self-contained UI-language picker. Unlike FontSizeControl/ReaderThemeControl,
// the UI language is NOT owned by useReaderSettings — this control owns its whole
// change flow: normalize -> i18n.changeLanguage (applies to all chrome without a
// restart, Req 8.2) -> persistLanguage (validated-read/signal-on-failure, Req 8.3;
// a failed write surfaces via onSaveError -> non-blocking notice, Req 8.8).
//
// Options are EXACTLY the bundled locales from UI_LANGUAGES (Req 8.1). The visible
// labels are each locale's endonym (native name) — language-agnostic, so they need
// no per-locale translation key (the design doesn't specify one).

import { Select } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { UI_LANGUAGES, normalizeLanguage } from "../lib/language";
import { persistLanguage, type SaveErrorKind } from "../lib/persistenceManager";

interface LanguageControlProps {
  onSaveError: (kind: SaveErrorKind) => void;
}

// Endonyms for the bundled locales (keys cover exactly UI_LANGUAGES).
const ENDONYMS: Record<(typeof UI_LANGUAGES)[number], string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
};

const DATA = UI_LANGUAGES.map((lang) => ({ value: lang, label: ENDONYMS[lang] }));

export default function LanguageControl({ onSaveError }: LanguageControlProps) {
  const { t, i18n } = useTranslation("ui");
  const label = t("settings.language");
  // Normalize so the Select value is always a valid bundled locale, even if
  // i18n.language carries a region subtag or an unbundled value.
  const value = normalizeLanguage(i18n.language);

  return (
    <Select
      label={label}
      data={DATA}
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
