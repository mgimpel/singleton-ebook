// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// The reader page structure (Req 7.5 app shell). It composes the reader surface
// and its chrome, and owns the single dismissable notice region fed by the
// onSaveError(kind) chain (control -> panel -> AppLayout), matching the
// established pattern. A failed persist of font size (4.6), reading location
// (6.5), any preference (7.5), or UI language (8.8) surfaces here as one
// non-blocking Notification; the session keeps going.
//
// ReaderView owns useBook + the location/settings hooks and lifts a small
// controller object up here via onController. AppLayout holds no reader state
// of its own beyond that captured controller and the overlay open flags — it
// just wires the controller's values and callbacks into the chrome and overlays.

import { useCallback, useRef, useState } from "react";
import { Box, Group, Notification } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { SaveErrorKind } from "../lib/persistenceManager";
import ReaderView, { type ReaderController } from "./ReaderView";
import ReaderControls from "./ReaderControls";
import ProgressIndicator from "./ProgressIndicator";
import TocPanel from "./TocPanel";
import SettingsPanel from "./SettingsPanel";
import AboutPanel from "./AboutPanel";
import classes from "./AppLayout.module.css";

export default function AppLayout() {
  const { t } = useTranslation("ui");

  // The reader controller, null until ReaderView lifts it on first render.
  const [controller, setController] = useState<ReaderController | null>(null);

  // Overlay open flags and the trigger refs the overlays return focus to.
  const [tocOpened, setTocOpened] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [aboutOpened, setAboutOpened] = useState(false);
  const tocButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);

  // One notice at a time: the latest save failure wins. Null = nothing shown.
  const [notice, setNotice] = useState<SaveErrorKind | null>(null);

  // Stable so ReaderView's onController/useReaderSettings deps don't churn.
  const handleSaveError = useCallback((kind: SaveErrorKind) => {
    setNotice(kind);
  }, []);

  const noop = () => {};

  return (
    <div className={classes.layout}>
      <ReaderView onSaveError={handleSaveError} onController={setController} />

      <Box className={classes.bar}>
        <Group gap="sm" wrap="nowrap" align="center">
          <ReaderControls
            onPrev={controller?.prev ?? noop}
            onNext={controller?.next ?? noop}
            onOpenToc={() => setTocOpened(true)}
            onOpenSettings={() => setSettingsOpened(true)}
            onOpenAbout={() => setAboutOpened(true)}
            tocButtonRef={tocButtonRef}
            settingsButtonRef={settingsButtonRef}
            aboutButtonRef={aboutButtonRef}
          />
          <Box flex={1}>
            <ProgressIndicator fraction={controller?.fraction ?? 0} />
          </Box>
        </Group>
      </Box>

      <TocPanel
        opened={tocOpened}
        onClose={() => setTocOpened(false)}
        toc={controller?.toc ?? []}
        goTo={controller?.goTo ?? (async () => false)}
        returnFocusRef={tocButtonRef}
      />

      <SettingsPanel
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
        fontSize={controller?.fontSize ?? 0}
        onFontSizeChange={controller?.setFontSize ?? noop}
        readerScheme={controller?.readerScheme ?? "system"}
        onReaderSchemeChange={controller?.setReaderScheme ?? noop}
        onSaveError={handleSaveError}
        returnFocusRef={settingsButtonRef}
      />

      <AboutPanel
        opened={aboutOpened}
        onClose={() => setAboutOpened(false)}
        returnFocusRef={aboutButtonRef}
      />

      {notice !== null && (
        <Notification
          className={classes.notice}
          color="yellow"
          withBorder
          onClose={() => setNotice(null)}
          aria-label={t("common.dismiss")}
        >
          {t("notice.saveFailed")}
        </Notification>
      )}
    </div>
  );
}
