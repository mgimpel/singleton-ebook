/// <reference types="vite/client" />

// Injected by vite.config.ts `define` — the git commit + date at build time,
// or null when git is unavailable (CI tarball, no repo).
declare const __BUILD_INFO__: { commit: string; date: string } | null;
