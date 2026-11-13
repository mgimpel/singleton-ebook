// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// The settings surface: a ResponsiveOverlay (Drawer on mobile, Modal on
// desktop) titled via i18n, hosting the three settings controls. It owns no
// state — the two reader-owned values (font size, scheme) come from
// useReaderSettings up in the reader via props, and the UI-language control is
// self-contained. onSaveError is threaded to LanguageControl so a failed
// persist surfaces as a non-blocking notice (Req 8.8). Focus returns to the
// gear that opened it via returnFocusRef.

import { Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { ReaderColorScheme } from "../lib/readerColorScheme";
import type { SaveErrorKind } from "../lib/persistenceManager";
import ResponsiveOverlay from "./ResponsiveOverlay";
import FontSizeControl from "./FontSizeControl";
import ReaderThemeControl from "./ReaderThemeControl";
import LanguageControl from "./LanguageControl";

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
