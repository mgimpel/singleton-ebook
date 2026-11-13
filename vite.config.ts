/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error type error without @types/node package
import process from "node:process";
// @ts-expect-error type error without @types/node package
import { execSync } from "node:child_process";

const host = process.env.TAURI_DEV_HOST;

// Read the current git commit + date at config time so the app can show a
// build line. Returns null when git is unavailable (CI tarball, no repo).
// ponytail: a stale/dirty working tree is not detected — the commit is taken
// as-is. Upgrade path: append a `-dirty` marker from `git status --porcelain`.
function readBuildInfo(): { commit: string; date: string } | null {
  try {
    const commit = execSync("git log -1 --format=%h").toString().trim();
    const date = execSync("git log -1 --format=%cs").toString().trim();
    return { commit, date };
  } catch {
    return null;
  }
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],

  define: {
    __BUILD_INFO__: JSON.stringify(readBuildInfo()),
  },

  test: {
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
    globals: true,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
