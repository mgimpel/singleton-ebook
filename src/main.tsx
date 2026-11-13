// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Side-effect import FIRST: i18next must be initialized with the resolved
// initial language (Req 8.4) before React renders any translated chrome.
import i18next from "./i18n";

import React from "react";
import ReactDOM from "react-dom/client";
import { type } from "@tauri-apps/plugin-os";
import App from "./App";

// Reflect the resolved UI language on the document for assistive tech and CSS.
document.documentElement.lang = i18next.language;

// Best-effort OS tag for platform-conditional styling. plugin-os `type()` only
// resolves inside the Tauri runtime; in a plain browser (dev `pnpm dev`, web
// build) it throws, so we degrade gracefully and simply leave data-os unset.
// ponytail: swallow-and-skip is the known ceiling — no browser UA fallback.
try {
  document.documentElement.dataset.os = type();
} catch {
  // Not running under Tauri; no OS tag.
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
