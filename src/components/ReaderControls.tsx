// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// The reader control bar: a Group of ActionIcon buttons for page navigation
// (prev/next) and opening the TOC and settings overlays. Each button's
// accessible name comes from i18n (the glyph child is decorative). The project
// ships no icon library (Mantine 9.8.0 only), so the glyphs are plain unicode.

import { ActionIcon, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface ReaderControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onOpenToc: () => void;
  onOpenSettings: () => void;
  /** So the TOC overlay can return focus to its trigger on close. */
  tocButtonRef?: React.Ref<HTMLButtonElement>;
  /** So the Settings overlay can return focus to its trigger on close. */
  settingsButtonRef?: React.Ref<HTMLButtonElement>;
}

export default function ReaderControls({
  onPrev,
  onNext,
  onOpenToc,
  onOpenSettings,
  tocButtonRef,
  settingsButtonRef,
}: ReaderControlsProps) {
  const { t } = useTranslation("ui");
  return (
    <Group gap="xs" wrap="nowrap">
      <ActionIcon
        variant="subtle"
        size="lg"
        aria-label={t("nav.previous")}
        onClick={onPrev}
      >
        <span aria-hidden="true">‹</span>
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        size="lg"
        aria-label={t("nav.next")}
        onClick={onNext}
      >
        <span aria-hidden="true">›</span>
      </ActionIcon>
      <ActionIcon
        ref={tocButtonRef}
        variant="subtle"
        size="lg"
        aria-label={t("nav.openToc")}
        onClick={onOpenToc}
      >
        <span aria-hidden="true">☰</span>
      </ActionIcon>
      <ActionIcon
        ref={settingsButtonRef}
        variant="subtle"
        size="lg"
        aria-label={t("nav.openSettings")}
        onClick={onOpenSettings}
      >
        <span aria-hidden="true">⚙</span>
      </ActionIcon>
    </Group>
  );
}
