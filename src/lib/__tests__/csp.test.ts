// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Singleton Ebook project
// (https://github.com/mgimpel/singleton-ebook).
// SPDX-License-Identifier: BSD-3-Clause

// Feature: epub-reader, Requirement 1.8: the CSP blocks all scripts except the
// application origin. The policy is declared in two places that must stay in
// sync: index.html's <meta> CSP and tauri.conf.json's app.security.csp. This is
// a config-assertion test with no matching lib source — it lives in
// src/lib/__tests__/ per the documented exception (like tauriWindowConfig).
import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Vitest runs from the project root, so cwd is a reliable base for the two
// config files (import.meta.url is not a file: URL under the jsdom environment).
const projectRoot = process.cwd();

function readIndexHtmlCsp(): string {
  const html = readFileSync(join(projectRoot, "index.html"), "utf8");

  // The meta tag spans multiple lines; [\s\S] matches across newlines.
  // The CSP value contains single quotes ('self'), so match a double-quoted
  // content attribute and capture everything up to the closing double quote.
  const match = html.match(
    /http-equiv="Content-Security-Policy"[\s\S]*?content="([^"]+)"/i,
  );

  return match?.[1]?.trim() ?? "";
}

function readTauriConfCsp(): string {
  const raw = readFileSync(join(projectRoot, "src-tauri", "tauri.conf.json"), "utf8");
  // SAFETY: a checked-in config file with this documented schema; optional
  // chaining below tolerates any missing key.
  const conf = JSON.parse(raw) as { app?: { security?: { csp?: string } } };

  return conf.app?.security?.csp?.trim() ?? "";
}

// Pull the value of the script-src directive out of a CSP string.
function scriptSrc(csp: string): string {
  const directive = csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.toLowerCase().startsWith("script-src"));

  return directive ? directive.slice("script-src".length).trim() : "";
}

describe("Content Security Policy (Requirement 1.8)", () => {
  const indexCsp = readIndexHtmlCsp();
  const tauriCsp = readTauriConfCsp();

  test("both CSP strings exist and are non-empty", () => {
    expect(indexCsp.length).toBeGreaterThan(0);
    expect(tauriCsp.length).toBeGreaterThan(0);
  });

  test.each([
    ["index.html", indexCsp],
    ["tauri.conf.json", tauriCsp],
  ])("%s script-src is exactly 'self' with no unsafe tokens", (_name, csp) => {
    const value = scriptSrc(csp);
    expect(value).toBe("'self'");
    expect(value).not.toMatch(/unsafe-inline/i);
    expect(value).not.toMatch(/unsafe-eval/i);
  });

  test("the two policies are kept in sync", () => {
    expect(indexCsp).toBe(tauriCsp);
  });
});
