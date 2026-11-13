// Component tests for ReaderView.
// Validates: Requirements 1.5, 1.6, 2.1, 2.2, 2.3, 2.5
import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";

import ReaderView from "../ReaderView";
import type { ReaderController } from "../ReaderView";
import type { UseBookResult, FoliateView } from "../../hooks/useBook";
import { useBook } from "../../hooks/useBook";
import i18n from "../../i18n";
import uiEn from "../../locales/ui.en.json";

// Isolate ReaderView: mock useBook (we drive status/view/next/prev) and the
// three wiring hooks (they touch a live foliate view we don't have here).
vi.mock("../../hooks/useBook", () => ({ useBook: vi.fn() }));
vi.mock("../../hooks/useReaderLocation", () => ({
  useReaderLocation: () => ({ fraction: 0, cfi: null }),
}));
vi.mock("../../hooks/useReaderSettings", () => ({
  // ReaderView now captures this return to lift the settings controller; give
  // it a valid shape so the destructure succeeds.
  useReaderSettings: () => ({
    fontSize: 16,
    readerScheme: "system",
    setFontSize: vi.fn(),
    setReaderScheme: vi.fn(),
  }),
}));
vi.mock("../../hooks/useSwipeNavigation", () => ({
  useSwipeNavigation: () => undefined,
}));

const mockedUseBook = vi.mocked(useBook);

const loadingLabel = uiEn.reader.loading;
const openErrorText = uiEn.reader.openError;

/** Build a useBook return value, overriding the fields a test cares about. */
function bookResult(overrides: Partial<UseBookResult>): UseBookResult {
  return {
    status: "loading",
    view: null,
    toc: [],
    next: vi.fn(),
    prev: vi.fn(),
    goTo: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

/**
 * A real element standing in for <foliate-view>, with a spy renderer. Returns
 * the setAttribute spy alongside so tests assert on a bound reference (reading
 * `view.renderer.setAttribute` directly trips oxlint's unbound-method rule).
 */
function fakeView(): { view: FoliateView; setAttribute: ReturnType<typeof vi.fn> } {
  const el = document.createElement("div");
  const setAttribute = vi.fn();
  (el as unknown as { renderer: unknown }).renderer = {
    setStyles: vi.fn(),
    setAttribute,
  };
  return { view: el as unknown as FoliateView, setAttribute };
}

function renderReader(onController?: (c: ReaderController) => void) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider>
        <ReaderView onSaveError={() => {}} onController={onController} />
      </MantineProvider>
    </I18nextProvider>,
  );
}

describe("ReaderView", () => {
  beforeEach(() => {
    mockedUseBook.mockReset();
  });

  test("loading shows the loading indicator (Req 1.5)", () => {
    mockedUseBook.mockReturnValue(bookResult({ status: "loading" }));

    renderReader();

    expect(screen.getByLabelText(loadingLabel)).toBeInTheDocument();
  });

  test("ready removes the loading indicator and hands useBook the live surface (Req 2.1)", () => {
    const { view } = fakeView();
    mockedUseBook.mockReturnValue(bookResult({ status: "ready", view }));

    renderReader();

    // The spinner is gone once the book is ready.
    expect(screen.queryByLabelText(loadingLabel)).not.toBeInTheDocument();
    // Mounting the <foliate-view> and setting paginated flow now lives in
    // useBook (so foliate-js lays out against a sized box); ReaderView's job is
    // to give useBook the live surface element to mount into. The last call
    // (after the surface ref resolves) must receive that element, not null.
    const lastArg = mockedUseBook.mock.calls.at(-1)?.[0];
    expect(lastArg).toBeInstanceOf(HTMLElement);
  });

  test("error renders the open-error message (Req 1.6)", () => {
    mockedUseBook.mockReturnValue(bookResult({ status: "error" }));

    renderReader();

    expect(screen.getByText(openErrorText)).toBeInTheDocument();
  });

  test("ArrowRight calls next and ArrowLeft calls prev (Req 2.2, 2.3, 2.5)", () => {
    const next = vi.fn();
    const prev = vi.fn();
    mockedUseBook.mockReturnValue(
      bookResult({ status: "ready", view: fakeView().view, next, prev }),
    );

    renderReader();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(prev).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(prev).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
