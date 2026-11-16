// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// About overlay, shown in the shared ResponsiveOverlay (Drawer on mobile, Modal
// on desktop). ResponsiveOverlay supplies the single labelled close button, the
// accessible name (the title) and the return of focus to the trigger on close.

import { Anchor, Group, Image, Stack, Text, Title } from "@mantine/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import ResponsiveOverlay from "./ResponsiveOverlay";
// Single-source the version from package.json (resolveJsonModule is enabled).
import pkg from "../../package.json";

const REPO_URL = "https://github.com/mgimpel/singleton-ebook";
const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

interface AboutPanelProps {
  opened: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}

// Link that opens in the OS default browser. In the Tauri webview a plain
// anchor would navigate the app window away, so the click goes to the opener
// plugin; if that rejects (plain browser dev, no Rust backend) fall back to
// window.open.
function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openUrl(href).catch(() => {
      window.open(href, "_blank", "noreferrer");
    });
  };

  return (
    <Anchor href={href} target="_blank" rel="noreferrer" onClick={onClick}>
      {children}
    </Anchor>
  );
}

export default function AboutPanel({ opened, onClose, returnFocusRef }: AboutPanelProps) {
  const { t } = useTranslation("ui");

  return (
    <ResponsiveOverlay
      opened={opened}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title={t("about.title")}
    >
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap">
          <Image src="/icon.svg" alt="" w={40} h={40} />
          <Title order={2} size="h4">
            {t("app.title")}
          </Title>
        </Group>
        <Stack gap={2}>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm">{t("about.version", { version: pkg.version })}</Text>
            {/* Separator and build line only when git info was available. */}
            {__BUILD_INFO__ && (
              <>
                <Text size="sm">{"-"}</Text>
                <Text size="sm" c="dimmed">
                  {t("about.buildDetails", {
                    commit: __BUILD_INFO__.commit,
                    date: __BUILD_INFO__.date,
                  })}
                </Text>
              </>
            )}
          </Group>
          <Text size="sm" lh={1.2}>{t("about.copyright")}</Text>
          <Text size="sm" lh={1.2}>
            {t("about.licensePrefix")}{" "}
            <ExternalLink href={LICENSE_URL}>{t("about.license")}</ExternalLink>
          </Text>
          <Text size="sm" lh={1.2}>
            {t("about.homepage")}{" "}
            <ExternalLink href={REPO_URL}>{REPO_URL}</ExternalLink>
          </Text>
          <Title order={2} size="h5">
            {t("about.thanksHeading")}
          </Title>
          <Text size="sm" lh={1.2} style={{ whiteSpace: "pre-line" }}>
            {t("about.thanksBody")}
          </Text>
        </Stack>
      </Stack>
    </ResponsiveOverlay>
  );
}
