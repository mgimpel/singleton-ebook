import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// jsdom doesn't implement these browser APIs that Mantine, foliate-js, and the
// reader hooks rely on. Polyfill the minimum surface the components touch.

// matchMedia — used by Mantine's color-scheme system and useReaderSettings'
// prefers-color-scheme watch. Returns a never-matching, no-op MediaQueryList.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// ResizeObserver — used by Mantine layout primitives.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

// scrollIntoView — called by Mantine (e.g. Select) and TOC navigation; jsdom
// leaves it undefined.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Reset persisted state between tests so one test's writes can't leak into the
// next. Call resetLocalStorage() inside a test for mid-test resets.
export function resetLocalStorage(): void {
  window.localStorage.clear();
}

afterEach(() => {
  resetLocalStorage();
});
