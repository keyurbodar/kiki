import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderInRouter } from "../setup-panel/test-router";
import type { PluginBrowseCard } from "./catalog";
import { PluginBrowse } from "./plugin-browse";

afterEach(cleanup);

const cards: PluginBrowseCard[] = Array.from({ length: 30 }, (_, index) => ({
  slug: `sample-${index}`,
  displayName: `Sample ${index}`,
  category: "docs",
  builtIn: null,
  featuredRank: null,
  firstListedAt: null,
}));

it("pages narrowed results and goes back to all plugins", async () => {
  const onSearch = vi.fn();
  await renderInRouter(() => (
    <div data-testid="ready">
      <PluginBrowse
        cards={cards}
        search={{ category: "docs" }}
        onSearch={onSearch}
      />
    </div>
  ));
  expect(screen.getByRole("heading", { name: "Docs" })).toBeTruthy();
  expect(screen.getByText("of", { exact: false }).textContent).toBe("1 of 2");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(onSearch).toHaveBeenCalledWith({ category: "docs", page: 2 });
  fireEvent.click(screen.getByRole("button", { name: "All plugins" }));
  expect(onSearch).toHaveBeenLastCalledWith({});
});

it("renders the empty search state with Capy's copy", async () => {
  const onSearch = vi.fn();
  await renderInRouter(() => (
    <div data-testid="ready">
      <PluginBrowse cards={[]} search={{ q: "nothing" }} onSearch={onSearch} />
    </div>
  ));
  expect(screen.getByText("No plugins match that search")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(onSearch).toHaveBeenCalledWith({});
});

it("opens a shelf through View all", async () => {
  const onSearch = vi.fn();
  await renderInRouter(() => (
    <div data-testid="ready">
      <PluginBrowse cards={cards.slice(0, 2)} search={{}} onSearch={onSearch} />
    </div>
  ));
  expect(
    screen.getByText("Newly listed plugins will appear here"),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "View all docs" }));
  expect(onSearch).toHaveBeenCalledWith({ category: "docs" });
});
