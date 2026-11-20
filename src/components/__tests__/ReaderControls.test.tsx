// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for ReaderControls.
// Validates: Requirements 2.2, 2.3, 3.1
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";

import ReaderControls from "../ReaderControls";
import i18n from "../../i18n";
import uiEn from "../../locales/ui.en.json";

const labels = uiEn.nav;

function renderControls(
  props: Partial<React.ComponentProps<typeof ReaderControls>> = {},
) {
  const handlers = {
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onOpenToc: vi.fn(),
    onOpenSettings: vi.fn(),
  };

  render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider>
        <ReaderControls {...handlers} {...props} />
      </MantineProvider>
    </I18nextProvider>,
  );

  return handlers;
}

describe("ReaderControls", () => {
  // Each button carries its i18n aria-label (Req 2.2 next, 2.3 prev, 3.1 toc).
  it("exposes an accessible name for each button", () => {
    renderControls();

    for (const name of [
      labels.previous,
      labels.next,
      labels.openToc,
      labels.openSettings,
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  // Clicking a button fires exactly its own callback (Req 2.3 prev, 2.2 next,
  // 3.1 toc; settings for completeness).
  it.each([
    ["previous", "onPrev"],
    ["next", "onNext"],
    ["openToc", "onOpenToc"],
    ["openSettings", "onOpenSettings"],
  ] as const)("click %s invokes %s once", async (labelKey, handlerKey) => {
    const handlers = renderControls();
    await userEvent.click(
      screen.getByRole("button", { name: labels[labelKey] }),
    );

    expect(handlers[handlerKey]).toHaveBeenCalledTimes(1);

    for (const [key, fn] of Object.entries(handlers)) {
      if (key !== handlerKey) expect(fn).not.toHaveBeenCalled();
    }
  });
});
