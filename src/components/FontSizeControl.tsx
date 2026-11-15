// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// A controlled font-size picker: a Mantine SegmentedControl of the discrete
// FONT_SIZE_OPTIONS. It owns no apply/persist logic — useReaderSettings'
// setFontSize (passed as onChange) already normalizes -> applies -> persists,
// so this component only maps numbers to/from the strings SegmentedControl
// requires and labels the control for accessibility (Req 4.1–4.4, 4.6).

import { Input, SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { FONT_SIZE_OPTIONS } from "../lib/fontSize";

interface FontSizeControlProps {
  /** Current font size, from useReaderSettings. */
  value: number;
  /** useReaderSettings.setFontSize — normalizes, applies, and persists. */
  onChange: (value: number) => void;
}

// SegmentedControl data must be strings; map the numeric options once.
const DATA = FONT_SIZE_OPTIONS.map((n) => String(n));

export default function FontSizeControl({ value, onChange }: FontSizeControlProps) {
  const { t } = useTranslation("ui");
  const label = t("settings.fontSize");

  return (
    <Input.Wrapper label={label}>
      {/* SegmentedControl is a radiogroup, not a single labelable control, so
          the Input.Wrapper <label> won't associate via `for` — name it
          directly so the control always has an accessible name. */}
      <SegmentedControl
        fullWidth
        data={DATA}
        value={String(value)}
        onChange={(v) => onChange(Number(v))}
        aria-label={label}
      />
    </Input.Wrapper>
  );
}
