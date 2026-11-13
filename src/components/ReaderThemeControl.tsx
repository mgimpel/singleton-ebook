// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// A controlled SegmentedControl for the reader color scheme: exactly the four
// options system/light/dark/sepia (from READER_COLOR_SCHEMES, in that order).
// Apply + persist live in useReaderSettings; this component only drives
// value/onChange. SettingsPanel wires value={readerScheme}
// onChange={setReaderScheme}; the hook normalizes the raw value anyway.

import { Input, SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";

import {
  READER_COLOR_SCHEMES,
  type ReaderColorScheme,
} from "../lib/readerColorScheme";

interface ReaderThemeControlProps {
  value: ReaderColorScheme;
  onChange: (value: ReaderColorScheme) => void;
}

export default function ReaderThemeControl({
  value,
  onChange,
}: ReaderThemeControlProps) {
  const { t } = useTranslation("ui");
  const data = READER_COLOR_SCHEMES.map((scheme) => ({
    value: scheme,
    label: t(`settings.theme.${scheme}`),
  }));
  return (
    <Input.Wrapper label={t("settings.theme.label")}>
      <SegmentedControl
        fullWidth
        data={data}
        value={value}
        onChange={(v) => onChange(v as ReaderColorScheme)}
      />
    </Input.Wrapper>
  );
}
