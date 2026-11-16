// Component tests for the three settings controls: FontSizeControl,
// ReaderThemeControl, and LanguageControl.
// Validates: Requirements 4.1, 4.2, 5.1, 5.2, 5.3, 8.1, 8.2, 8.4, 8.6, 8.7, 8.8
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";

import {
  FontSizeControl,
  LanguageControl,
  ReaderThemeControl,
} from "../SettingsPanel";
import { FONT_SIZE_OPTIONS } from "../../lib/fontSize";
import { READER_COLOR_SCHEMES } from "../../lib/readerColorScheme";
import { UI_LANGUAGES, type UI_Language } from "../../lib/language";
import i18n from "../../i18n";
import uiEn from "../../locales/ui.en.json";

const settings = uiEn.settings;

// Endonyms the Select renders (language-agnostic native names), in UI_LANGUAGES order.
const ENDONYMS = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
} satisfies Record<UI_Language, string>;

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider>{ui}</MantineProvider>
    </I18nextProvider>,
  );
}

// LanguageControl mutates the shared i18n singleton; reset it and restore any
// spies/mocks so tests don't leak into each other.
afterEach(async () => {
  vi.restoreAllMocks();
  localStorage.clear();
  await i18n.changeLanguage("en");
});

describe("FontSizeControl", () => {
  // The control offers exactly the discrete FONT_SIZE_OPTIONS and carries an
  // accessible name (Req 4.1).
  it("renders every discrete font-size option under an accessible name", () => {
    renderWithProviders(<FontSizeControl value={18} onChange={vi.fn()} />);

    const group = screen.getByRole("radiogroup", { name: settings.fontSize });
    const options = within(group).getAllByRole("radio");
    expect(options.map((o) => o.getAttribute("value"))).toEqual(
      FONT_SIZE_OPTIONS.map(String),
    );
  });

  // Selecting a size calls onChange with the chosen NUMBER (Req 4.2 — the
  // controlled contract the hook's setFontSize relies on to apply + persist).
  it("calls onChange with the selected size as a number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<FontSizeControl value={18} onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "24" }));

    expect(onChange).toHaveBeenCalledWith(24);
  });
});

describe("ReaderThemeControl", () => {
  // Exactly the four schemes system/light/dark/sepia, labelled from the locale
  // (Req 5.1).
  it("renders exactly the four reader schemes with their localized labels", () => {
    renderWithProviders(
      <ReaderThemeControl value="system" onChange={vi.fn()} />,
    );

    const group = screen.getByRole("radiogroup");
    const options = within(group).getAllByRole("radio");
    expect(options.map((o) => o.getAttribute("value"))).toEqual([
      ...READER_COLOR_SCHEMES,
    ]);

    for (const scheme of READER_COLOR_SCHEMES) {
      expect(
        within(group).getByRole("radio", { name: settings.theme[scheme] }),
      ).toBeInTheDocument();
    }
  });

  // Selecting an option calls onChange with that scheme (Req 5.2/5.3 — apply to
  // the reader view and chrome runs through the hook/App chain off this value).
  it("calls onChange with the selected scheme", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <ReaderThemeControl value="system" onChange={onChange} />,
    );

    await user.click(screen.getByRole("radio", { name: settings.theme.dark }));

    expect(onChange).toHaveBeenCalledWith("dark");
  });
});

describe("LanguageControl", () => {
  // Mantine's Select dropdown renders into a portal that floating-ui keeps at
  // `display: none` in jsdom (no layout), so its options are "hidden" to the
  // a11y tree. Query them with { hidden: true } after opening.
  const openAndGetOptions = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("combobox"));

    return screen.findAllByRole("option", { hidden: true });
  };

  // The Select offers EXACTLY the bundled locales, by endonym, in UI_LANGUAGES
  // order (Req 8.1).
  it("offers exactly the bundled locales by endonym", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageControl onSaveError={vi.fn()} />);

    const options = await openAndGetOptions(user);
    expect(options.map((o) => o.textContent)).toEqual(
      UI_LANGUAGES.map((l) => ENDONYMS[l]),
    );
  });

  // Selecting a language applies it to all chrome without a restart
  // (i18n.changeLanguage, Req 8.2) and persists it (Req 8.3). react-i18next
  // re-renders so the label itself follows — asserted via the re-rendered value.
  it("changes the active language and persists the choice", async () => {
    const user = userEvent.setup();
    const changeLanguage = vi.spyOn(i18n, "changeLanguage");
    renderWithProviders(<LanguageControl onSaveError={vi.fn()} />);

    const options = await openAndGetOptions(user);
    const french = options.find((o) => o.textContent === "Français")!;
    await user.click(french);

    expect(changeLanguage).toHaveBeenCalledWith("fr");
    // Persisted under the language key (Req 8.3).
    expect(localStorage.getItem("ebook:language")).toBe("fr");
    // Chrome re-rendered: the Select now shows the French endonym selected.
    // (Query by role only — the label text is now itself translated.)
    expect(screen.getByRole("combobox")).toHaveValue("Français");
  });

  // The displayed value reflects the active (persisted/resolved) language, so a
  // startup where French is active shows Français selected (Req 8.4).
  it("reflects the active language as the selected value", async () => {
    await i18n.changeLanguage("fr");
    renderWithProviders(<LanguageControl onSaveError={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveValue("Français");
  });

  // An unbundled active language normalizes to the English default for display,
  // so the control never shows an out-of-range value (Req 8.6/8.7).
  it("normalizes an unbundled active language to English for display", async () => {
    await i18n.changeLanguage("zz-ZZ");
    renderWithProviders(<LanguageControl onSaveError={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveValue("English");
  });

  // A throwing storage write surfaces a non-blocking notice via onSaveError and
  // never throws; the language still applies (Req 8.8).
  it("signals onSaveError when the write throws, without breaking", async () => {
    const user = userEvent.setup();
    const onSaveError = vi.fn();
    const changeLanguage = vi.spyOn(i18n, "changeLanguage");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    renderWithProviders(<LanguageControl onSaveError={onSaveError} />);

    const options = await openAndGetOptions(user);
    const french = options.find((o) => o.textContent === "Français")!;
    await user.click(french);

    expect(onSaveError).toHaveBeenCalledWith("language");
    // The language was still applied despite the failed persist.
    expect(changeLanguage).toHaveBeenCalledWith("fr");
  });
});
