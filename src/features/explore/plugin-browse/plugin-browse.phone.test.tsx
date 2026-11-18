import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderInRouter } from "../setup-panel/test-router";
import { PluginCategories } from "./plugin-browse";

beforeEach(() => {
  document.documentElement.style.setProperty("--breakpoint-md", "48rem");
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.style.removeProperty("--breakpoint-md");
});

it("keeps the category control a menu on a phone instead of a drawer trigger", async () => {
  const { container } = await renderInRouter(() => (
    <div data-testid="ready">
      <PluginCategories onSearch={() => {}} />
    </div>
  ));
  const trigger = container.querySelector('[data-slot="menu-trigger"]');
  expect(trigger?.textContent).toContain("Categories");
});
