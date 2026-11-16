// Component tests for TocPanel.
// Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6
import { useRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";

import TocPanel from "../TocPanel";
import type { TocEntry } from "../../lib/toc";
import i18n from "../../i18n";
import uiEn from "../../locales/ui.en.json";

// The never-matching matchMedia polyfill (src/test-setup.ts) makes
// useMediaQuery return false, so ResponsiveOverlay renders its Modal path.

const strings = uiEn.toc;
const closeLabel = uiEn.common.close;

const sampleToc: TocEntry[] = [
  {
    label: "Act I",
    href: "a1",
    subitems: [{ label: "Scene 1", href: "a1s1", subitems: [] }],
  },
  { label: "Act II", href: "a2", subitems: [] },
];

function renderPanel(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider>{ui}</MantineProvider>
    </I18nextProvider>,
  );
}

describe("TocPanel", () => {
  test("renders entries in order with the nested subitem present", () => {
    renderPanel(
      <TocPanel
        opened
        onClose={() => {}}
        toc={sampleToc}
        goTo={vi.fn().mockResolvedValue(true)}
      />,
    );

    const actOne = screen.getByText("Act I");
    const scene = screen.getByText("Scene 1");
    const actTwo = screen.getByText("Act II");

    // Reading order is preserved (Req 3.1): Act I before its subitem Scene 1
    // before the sibling Act II.
    expect(actOne.compareDocumentPosition(scene)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(scene.compareDocumentPosition(actTwo)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    // The nested Scene 1 lives in the collapsible region the Act I NavLink
    // controls (Mantine renders children in an aria-controls region, not inside
    // the link's own <a> root), proving it's nested under its parent (Req 3.3).
    const actOneLink = actOne.closest("[aria-controls]");
    expect(actOneLink).not.toBeNull();
    const regionId = actOneLink?.getAttribute("aria-controls");
    expect(regionId).toBeTruthy();
    expect(document.getElementById(regionId!)).toContainElement(scene);
  });

  test("selecting a resolvable entry navigates and stays open", async () => {
    const user = userEvent.setup();
    const goTo = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    renderPanel(
      <TocPanel opened onClose={onClose} toc={sampleToc} goTo={goTo} />,
    );

    await user.click(screen.getByText("Act II"));

    await waitFor(() => expect(goTo).toHaveBeenCalledWith("a2"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("an unresolvable destination stays open and shows a message", async () => {
    const user = userEvent.setup();
    const goTo = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();
    renderPanel(
      <TocPanel opened onClose={onClose} toc={sampleToc} goTo={goTo} />,
    );

    await user.click(screen.getByText("Act II"));

    await waitFor(() =>
      expect(screen.getByText(strings.unavailable)).toBeInTheDocument(),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  test("an empty TOC shows the empty message and a reachable close button", () => {
    renderPanel(
      <TocPanel
        opened
        onClose={() => {}}
        toc={[]}
        goTo={vi.fn().mockResolvedValue(true)}
      />,
    );

    expect(screen.getByText(strings.empty)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: closeLabel }),
    ).toBeInTheDocument();
  });

  test("closing after a resolvable select returns focus to the trigger", async () => {
    const user = userEvent.setup();

    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      const [opened, setOpened] = useState(true);

      return (
        <>
          <button ref={triggerRef} type="button">
            trigger
          </button>
          <TocPanel
            opened={opened}
            onClose={() => setOpened(false)}
            toc={sampleToc}
            goTo={vi.fn().mockResolvedValue(true)}
            returnFocusRef={triggerRef}
          />
        </>
      );
    }

    renderPanel(<Harness />);
    const trigger = screen.getByRole("button", { name: "trigger" });

    await user.click(screen.getByRole("button", { name: closeLabel }));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
