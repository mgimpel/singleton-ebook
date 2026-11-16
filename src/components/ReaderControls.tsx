// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// The reader control bar: a Group of ActionIcon buttons for page navigation
// (prev/next) and opening the TOC, settings and about overlays. Each button's
// accessible name comes from i18n; the Font Awesome icons are decorative
// (FontAwesomeIcon sets aria-hidden). Icons are imported individually so only
// these five are bundled.

import { ActionIcon, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCircleInfo,
  faGear,
  faList,
} from "@fortawesome/free-solid-svg-icons";

interface ReaderControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onOpenToc: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  /** So the TOC overlay can return focus to its trigger on close. */
  tocButtonRef?: React.Ref<HTMLButtonElement>;
  /** So the Settings overlay can return focus to its trigger on close. */
  settingsButtonRef?: React.Ref<HTMLButtonElement>;
  /** So the About overlay can return focus to its trigger on close. */
  aboutButtonRef?: React.Ref<HTMLButtonElement>;
}

export default function ReaderControls({
  onPrev,
  onNext,
  onOpenToc,
  onOpenSettings,
  onOpenAbout,
  tocButtonRef,
  settingsButtonRef,
  aboutButtonRef,
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
        <FontAwesomeIcon icon={faChevronLeft} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        size="lg"
        aria-label={t("nav.next")}
        onClick={onNext}
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </ActionIcon>
      <ActionIcon
        ref={tocButtonRef}
        variant="subtle"
        size="lg"
        aria-label={t("nav.openToc")}
        onClick={onOpenToc}
      >
        <FontAwesomeIcon icon={faList} />
      </ActionIcon>
      <ActionIcon
        ref={settingsButtonRef}
        variant="subtle"
        size="lg"
        aria-label={t("nav.openSettings")}
        onClick={onOpenSettings}
      >
        <FontAwesomeIcon icon={faGear} />
      </ActionIcon>
      <ActionIcon
        ref={aboutButtonRef}
        variant="subtle"
        size="lg"
        aria-label={t("nav.openAbout")}
        onClick={onOpenAbout}
      >
        <FontAwesomeIcon icon={faCircleInfo} />
      </ActionIcon>
    </Group>
  );
}
