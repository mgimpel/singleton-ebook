import { test, expect } from "vitest";

test("view.js imports under jsdom", async () => {
  await import("../../vendor/foliate-js/view.js");
  expect(customElements.get("foliate-view")).toBeDefined();
});
