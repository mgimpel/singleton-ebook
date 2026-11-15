// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// The single responsive overlay for the TOC and settings surfaces: a bottom
// Drawer on mobile (below the breakpoint), a centered Modal on larger screens.
// It owns the one labelled close button (common.close) and returns focus to the
// control that opened it via returnFocusRef. Keep the breakpoint and the close
// label in this one place (per steering) — don't add size/position props until
// a third caller needs them.

import { useEffect, useRef } from "react";
import { Drawer, Modal } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";

interface ResponsiveOverlayProps {
  opened: boolean;
  onClose: () => void;
  /** Overlay accessible name (SettingsPanel/AboutPanel pass a title). */
  title?: React.ReactNode;
  /** Focus returns here on close (the trigger that opened the overlay). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * Default true. Escape hatch for callers that render their own labelled
   * close control in-body (ElementDetail-style) and so name the overlay with an
   * in-body heading instead of the title.
   */
  withCloseButton?: boolean;
  children: React.ReactNode;
}

export default function ResponsiveOverlay({
  opened,
  onClose,
  title,
  returnFocusRef,
  withCloseButton = true,
  children,
}: ResponsiveOverlayProps) {
  const { t } = useTranslation("ui");
  // Below 48em → mobile Drawer. useMediaQuery returns undefined before the
  // first match evaluation; treat that as "not mobile" so desktop is the safe
  // default (SSR/first paint).
  const isMobile = useMediaQuery("(max-width: 48em)");

  // Honor the explicit returnFocusRef: when the overlay transitions from open
  // to closed, move focus back to the trigger. We drive this ourselves rather
  // than relying on Mantine's returnFocus so the caller's ref always wins.
  const wasOpen = useRef(opened);
  useEffect(() => {
    if (wasOpen.current && !opened) {
      returnFocusRef?.current?.focus();
    }

    wasOpen.current = opened;
  }, [opened, returnFocusRef]);

  const common = {
    opened,
    onClose,
    title,
    withCloseButton,
    // We restore focus explicitly via returnFocusRef, so turn off Mantine's own
    // return-focus to avoid two handlers fighting over focus.
    returnFocus: false,
    closeButtonProps: { "aria-label": t("common.close") },
    children,
  } as const;

  return isMobile ? (
    <Drawer {...common} position="bottom" />
  ) : (
    <Modal {...common} centered />
  );
}
