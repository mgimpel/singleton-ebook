// Component tests for ResponsiveOverlay.
// Validates: Requirements 3.4
import { useRef } from "react";
import { describe, expect, test } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";

import ResponsiveOverlay from "../ResponsiveOverlay";
import i18n from "../../i18n";
import uiEn from "../../locales/ui.en.json";

// The never-matching matchMedia polyfill (src/test-setup.ts) makes
// useMediaQuery return false, so the Modal path renders — fine for these
// assertions, which only care about the shared close control and focus return.

const closeLabel = uiEn.common.close;

function renderOverlay(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider>{ui}</MantineProvider>
    </I18nextProvider>,
  );
}

describe("ResponsiveOverlay", () => {
  test("renders a close control with the accessible name from common.close", () => {
    renderOverlay(
      <ResponsiveOverlay opened onClose={() => {}} title="A title">
        <p>body</p>
      </ResponsiveOverlay>,
    );

    expect(
      screen.getByRole("button", { name: closeLabel }),
    ).toBeInTheDocument();
  });

  test("close returns focus to returnFocusRef", async () => {
    function Harness({ opened }: { opened: boolean }) {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={triggerRef} type="button">
            trigger
          </button>
          <ResponsiveOverlay
            opened={opened}
            onClose={() => {}}
            title="A title"
            returnFocusRef={triggerRef}
          >
            <p>body</p>
          </ResponsiveOverlay>
        </>
      );
    }

    const { rerender } = renderOverlay(<Harness opened />);
    const trigger = screen.getByRole("button", { name: "trigger" });

    // Flip opened -> false: the open->close transition should focus the trigger.
    rerender(
      <I18nextProvider i18n={i18n}>
        <MantineProvider>
          <Harness opened={false} />
        </MantineProvider>
      </I18nextProvider>,
    );

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  test("withCloseButton={false} renders no close button", () => {
    renderOverlay(
      <ResponsiveOverlay
        opened
        onClose={() => {}}
        title="A title"
        withCloseButton={false}
      >
        <p>body</p>
      </ResponsiveOverlay>,
    );

    expect(
      screen.queryByRole("button", { name: closeLabel }),
    ).not.toBeInTheDocument();
  });
});
