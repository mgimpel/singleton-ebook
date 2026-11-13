// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// The table-of-contents overlay (Req 3): a ResponsiveOverlay listing the book's
// TOC entries in reading order, with nested subitems indented beneath their
// parent via recursively nested Mantine NavLinks (Req 3.1, 3.3). Selecting an
// entry calls goTo(href): on a resolved destination the panel closes (Req 3.2);
// on an unresolvable one it stays open and shows an inline "unavailable" message
// (Req 3.6). An empty TOC shows a message with the overlay's reachable close
// button (Req 3.5). ResponsiveOverlay moves focus in on open and returns it to
// returnFocusRef on close (Req 3.1, 3.4).

import { useState } from "react";
import { NavLink, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { TocEntry } from "../lib/toc";
import ResponsiveOverlay from "./ResponsiveOverlay";

interface TocPanelProps {
  opened: boolean;
  onClose: () => void;
  /** Normalized TOC (from useBook); every entry has a `subitems` array. */
  toc: TocEntry[];
  /** Navigate to a destination; resolves false when unresolvable. */
  goTo: (target: string | number) => Promise<boolean>;
  /** Focus returns here on close (the TOC trigger button). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

/** Recursively render an entry and its subitems; NavLink nesting indents them. */
function TocEntries({
  entries,
  onSelect,
}: {
  entries: TocEntry[];
  onSelect: (href: string) => void;
}) {
  return entries.map((entry, index) => (
    <NavLink
      key={`${entry.href}-${index}`}
      label={entry.label}
      onClick={() => onSelect(entry.href)}
    >
      {entry.subitems.length > 0 && (
        <TocEntries entries={entry.subitems} onSelect={onSelect} />
      )}
    </NavLink>
  ));
}

export default function TocPanel({
  opened,
  onClose,
  toc,
  goTo,
  returnFocusRef,
}: TocPanelProps) {
  const { t } = useTranslation("ui");
  const [unavailable, setUnavailable] = useState(false);

  // Clear the notice on close so it never lingers into the next open (closing
  // is the event that should reset it — no effect needed).
  const handleClose = () => {
    setUnavailable(false);
    onClose();
  };

  const handleSelect = async (href: string) => {
    const resolved = await goTo(href);
    if (resolved) {
      handleClose();
    } else {
      setUnavailable(true);
    }
  };

  return (
    <ResponsiveOverlay
      opened={opened}
      onClose={handleClose}
      title={t("toc.title")}
      returnFocusRef={returnFocusRef}
    >
      {unavailable && (
        <Text c="red" role="alert" mb="sm">
          {t("toc.unavailable")}
        </Text>
      )}
      {toc.length === 0 ? (
        <Text c="dimmed">{t("toc.empty")}</Text>
      ) : (
        <TocEntries entries={toc} onSelect={handleSelect} />
      )}
    </ResponsiveOverlay>
  );
}
