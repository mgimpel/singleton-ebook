// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// The reader surface. Owns useBook (load + parse the bundled EPUB) and renders
// one of three states into a full-bleed surface: a loading Loader (Req 1.5), a
// centered error message (Req 1.6/1.7), or the live <foliate-view> (Req 2.1).
//
// It mounts the <foliate-view> element useBook builds into the DOM, sets the
// paginator to paginated flow (Req 2.1), and wires the location/settings/swipe
// hooks plus a keydown listener for Left/Right arrows (Req 2.5). next/prev come
// from useBook, which delegates to foliate-js — the engine clamps at the first
// and last page, so Req 2.6/2.7 need no extra bounds logic here.
//
// Navigation is thin imperative glue, not a standalone tree. AppLayout (task
// 12.6) composes ReaderControls, ProgressIndicator, and the overlays, so it
// needs next/prev/goTo/toc/status/fraction. Rather than duplicate useBook up
// there, ReaderView surfaces a small typed controller through an optional
// onController callback whenever those values change.

import { useEffect, useState } from "react";
import { Loader, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { useBook, type BookStatus } from "../hooks/useBook";
import { useReaderLocation } from "../hooks/useReaderLocation";
import { useReaderSettings } from "../hooks/useReaderSettings";
import { useSwipeNavigation } from "../hooks/useSwipeNavigation";
import type { SaveErrorKind } from "../lib/persistenceManager";
import type { ReaderColorScheme } from "../lib/readerColorScheme";
import type { TocEntry } from "../lib/toc";
import classes from "./ReaderView.module.css";

/**
 * The imperative reader controller ReaderView lifts to its parent. AppLayout
 * feeds `next`/`prev`/`goTo`/`toc` to ReaderControls and TocPanel, `status` to
 * decide what chrome to show, and `fraction` to ProgressIndicator. The settings
 * controller (`fontSize`/`readerScheme` + setters) is surfaced here too so
 * AppLayout can pass it to SettingsPanel without re-running useBook/useReaderSettings.
 */
export interface ReaderController {
  status: BookStatus;
  toc: TocEntry[];
  next: () => void;
  prev: () => void;
  goTo: (target: string | number) => Promise<boolean>;
  fraction: number;
  fontSize: number;
  readerScheme: ReaderColorScheme;
  setFontSize: (value: number) => void;
  setReaderScheme: (value: ReaderColorScheme) => void;
}

interface ReaderViewProps {
  onSaveError: (kind: SaveErrorKind) => void;
  /** Called whenever the lifted controller changes (optional; AppLayout uses it). */
  onController?: (controller: ReaderController) => void;
}

export default function ReaderView({ onSaveError, onController }: ReaderViewProps) {
  const { t } = useTranslation("ui");

  // Hold the surface node in state (not a plain ref) so useBook, the effects,
  // and the swipe hook re-run once it mounts — a ref's `.current` filling in
  // doesn't trigger a render.
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);

  // useBook mounts the <foliate-view> into this surface before opening the book
  // so foliate-js lays out against a real, sized box (a detached element
  // renders zero pages — the book text never paints). It owns mount + cleanup.
  const { status, view, toc, next, prev, goTo } = useBook(surface);

  const { fraction } = useReaderLocation(view, onSaveError);
  // Capture the settings controller (previously discarded) so it can be lifted
  // to AppLayout for SettingsPanel to consume.
  const { fontSize, readerScheme, setFontSize, setReaderScheme } =
    useReaderSettings(view, onSaveError);

  useSwipeNavigation(surface, { next, prev });

  // Left/Right arrows turn the page (Req 2.5). Bound to the window so the keys
  // work regardless of which element holds focus. next/prev read the latest
  // view via useBook's stable callbacks.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev]);

  // Lift the controller to the parent whenever any part of it changes.
  useEffect(() => {
    onController?.({
      status,
      toc,
      next,
      prev,
      goTo,
      fraction,
      fontSize,
      readerScheme,
      setFontSize,
      setReaderScheme,
    });
  }, [
    onController,
    status,
    toc,
    next,
    prev,
    goTo,
    fraction,
    fontSize,
    readerScheme,
    setFontSize,
    setReaderScheme,
  ]);

  return (
    <div ref={setSurface} className={classes.surface}>
      {status === "loading" && (
        <div className={classes.center}>
          <Loader aria-label={t("reader.loading")} />
        </div>
      )}
      {status === "error" && (
        <div className={classes.center}>
          <Text c="dimmed">{t("reader.openError")}</Text>
        </div>
      )}
    </div>
  );
}
