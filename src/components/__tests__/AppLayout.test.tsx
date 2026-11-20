// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for AppLayout's notice region.
// Validates: Requirements 4.6, 6.5, 7.5, 8.8
import { useEffect } from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";

import AppLayout from "../AppLayout";
import type { ReaderController } from "../ReaderView";
import type { SaveErrorKind } from "../../lib/persistenceManager";
import i18n from "../../i18n";
import uiEn from "../../locales/ui.en.json";

// Stub ReaderView so the test can drive the onSaveError chain: on mount it lifts
// a minimal controller (so the chrome renders), and it renders a button that
// calls props.onSaveError('fontSize') — the only hook AppLayout gives the test
// to surface a notice. The real ReaderView owns useBook + live foliate wiring
// we don't want here.
vi.mock("../ReaderView", () => ({
  default: ({
    onSaveError,
    onController,
  }: {
    onSaveError: (kind: SaveErrorKind) => void;
    onController?: (controller: ReaderController) => void;
  }) => {
    // Lift the controller once on mount (not during render) so AppLayout's
    // setController doesn't re-render this stub into an infinite loop.
    useEffect(() => {
      onController?.({
        status: "ready",
        toc: [],
        next: vi.fn(),
        prev: vi.fn(),
        goTo: vi.fn().mockResolvedValue(true),
        fraction: 0,
        fontSize: 18,
        readerScheme: "system",
        setFontSize: vi.fn(),
        setReaderScheme: vi.fn(),
      });
    }, [onController]);

    return (
      <button type="button" onClick={() => onSaveError("fontSize")}>
        trigger-save-error
      </button>
    );
  },
}));

const saveFailedText = uiEn.notice.saveFailed;
const dismissLabel = uiEn.common.dismiss;
const nextLabel = uiEn.nav.next;

function renderLayout() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider>
        <AppLayout />
      </MantineProvider>
    </I18nextProvider>,
  );
}

describe("AppLayout notice", () => {
  test("a save error surfaces one non-blocking notice; the reader keeps working (Req 4.6, 6.5, 7.5, 8.8)", async () => {
    const user = userEvent.setup();
    renderLayout();

    // No notice until a save fails.
    expect(screen.queryByText(saveFailedText)).not.toBeInTheDocument();

    await user.click(screen.getByText("trigger-save-error"));

    // The single notice appears...
    expect(screen.getByText(saveFailedText)).toBeInTheDocument();
    // ...and it's non-blocking: the reader chrome is still interactive.
    expect(
      screen.getByRole("button", { name: nextLabel }),
    ).toBeInTheDocument();
  });

  test("the notice is dismissable and the session continues (Req 7.5)", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByText("trigger-save-error"));
    expect(screen.getByText(saveFailedText)).toBeInTheDocument();

    // The notice region carries the dismiss label; its close control is the
    // single button inside it.
    const notice = screen.getByLabelText(dismissLabel);
    const closeButton = within(notice).getByRole("button");
    await user.click(closeButton);

    await waitFor(() =>
      expect(screen.queryByText(saveFailedText)).not.toBeInTheDocument(),
    );
    // Session continues: chrome still present after dismissing.
    expect(
      screen.getByRole("button", { name: nextLabel }),
    ).toBeInTheDocument();
  });

  test("repeated save errors stack to a single notice (latest wins)", async () => {
    const user = userEvent.setup();
    renderLayout();

    const trigger = screen.getByText("trigger-save-error");
    await user.click(trigger);
    await user.click(trigger);

    expect(screen.getAllByText(saveFailedText)).toHaveLength(1);
  });
});
