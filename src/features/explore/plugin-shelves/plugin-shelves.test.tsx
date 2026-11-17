import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DateTime } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { afterEach, expect, it, vi } from "vitest";
import type { ExploreCard, ExploreIndex } from "@/data/api/schemas/explore";
import { ExplorePage } from "../explore-page";
import { renderInRouter } from "../setup-panel/test-router";
import {
  PluginCategoryControl,
  PluginShelves,
  toPluginRow,
} from "./plugin-shelves";

const daysAgo = (days: number) =>
  DateTime.subtract(DateTime.nowUnsafe(), { days });

const plugin = (fields: {
  slug: string;
  category?: ExploreCard["category"];
  featuredRank?: number | null;
  firstListedAt?: ExploreCard["firstListedAt"];
  builtIn?: ExploreCard["builtIn"];
}): ExploreCard =>
  ({
    kind: "plugin",
    source: "catalog",
    slug: fields.slug,
    displayName: fields.slug,
    description: `${fields.slug} description`,
    maker: null,
    accent: null,
    category: fields.category ?? null,
    firstListedAt: fields.firstListedAt ?? daysAgo(3),
    featuredRank: fields.featuredRank ?? null,
    hasIcon: false,
    repository: null,
    stars: null,
    starsCheckedAt: null,
    adds: null,
    version: null,
    versionId: null,
    theme: null,
    builtIn: fields.builtIn ?? null,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  }) as unknown as ExploreCard;

const cards = [
  plugin({ slug: "alpha", category: "monitoring", featuredRank: 2 }),
  plugin({ slug: "bravo", category: "deployment", featuredRank: 1 }),
  plugin({
    slug: "charlie",
    category: "monitoring",
    firstListedAt: daysAgo(1),
  }),
  plugin({ slug: "delta", category: "docs", firstListedAt: daysAgo(2) }),
];

const index = { added: [], cards } as unknown as ExploreIndex;

vi.mock("@/data/atoms/explore", () => ({
  orgListingsAtom: () => Atom.make(AsyncResult.success(index)),
}));

vi.mock("@/features/explore/listing-detail/explore-session", () => ({
  useOrgId: () => "org_test",
}));

const renderRow = (card: ExploreCard) => (
  <span key={card.slug} data-testid={`row-${card.slug}`}>
    {card.displayName}
  </span>
);

afterEach(cleanup);

it("maps a listing onto the plugin shelf card", () => {
  const row = toPluginRow(
    plugin({
      slug: "delta",
      category: null,
      firstListedAt: daysAgo(2),
      builtIn: { settingsPath: "/settings/integrations" },
    }),
  );
  expect(row.category).toBe("other");
  expect(row.builtIn).toBe("/settings/integrations");
  expect(row.firstListedAt).toBeInstanceOf(Date);
  expect(row.card.slug).toBe("delta");
});

it("renders a shelf per group with an icon button on each View all", async () => {
  const { container } = await renderInRouter(() => (
    <div data-testid="ready">
      <PluginShelves
        cards={cards}
        search={{}}
        onSearch={() => {}}
        renderCard={renderRow}
      />
    </div>
  ));
  expect(screen.getByRole("heading", { name: "Featured" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Recently added" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Monitoring" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Deployment" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Docs" })).toBeTruthy();
  expect(screen.getAllByTestId("row-charlie")).toHaveLength(2);
  expect(screen.getAllByTestId("row-delta")).toHaveLength(2);

  const icons = [...container.querySelectorAll('[data-slot="button-icon"]')];
  const viewAll = screen.getAllByRole("button", { name: /^View all/u });
  expect(icons.length).toBe(viewAll.length);
  for (const icon of icons) expect(icon.closest("button")).not.toBeNull();
});

it("opens a shelf by its section", async () => {
  const onSearch = vi.fn();
  await renderInRouter(() => (
    <div data-testid="ready">
      <PluginShelves
        cards={cards}
        search={{}}
        onSearch={onSearch}
        renderCard={renderRow}
      />
    </div>
  ));
  fireEvent.click(screen.getByRole("button", { name: "View all featured" }));
  expect(onSearch).toHaveBeenCalledWith({
    tab: undefined,
    q: undefined,
    section: "featured",
    category: undefined,
    page: undefined,
  });
});

it("narrows to a category and clears back to all plugins", async () => {
  const onSearch = vi.fn();
  await renderInRouter(() => (
    <div data-testid="ready">
      <PluginShelves
        cards={cards}
        search={{ category: "monitoring" }}
        onSearch={onSearch}
        renderCard={renderRow}
      />
    </div>
  ));
  expect(screen.getByRole("heading", { name: "Monitoring" })).toBeTruthy();
  expect(screen.getByTestId("row-alpha")).toBeTruthy();
  expect(screen.queryByTestId("row-bravo")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "All plugins" }));
  expect(onSearch).toHaveBeenCalledWith({
    tab: undefined,
    q: undefined,
    section: undefined,
    category: undefined,
    page: undefined,
  });
});

it("picks a category from the Categories control", async () => {
  const onSearch = vi.fn();
  await renderInRouter(() => (
    <div data-testid="ready">
      <PluginCategoryControl search={{ q: "edge" }} onSearch={onSearch} />
    </div>
  ));
  const trigger = screen.getByRole("button", { name: "Categories" });
  expect(trigger.querySelector('[data-slot="button-icon"]')).not.toBeNull();
  fireEvent.click(trigger);
  fireEvent.click(await screen.findByText("Monitoring"));
  expect(onSearch).toHaveBeenCalledWith({
    tab: undefined,
    q: undefined,
    section: undefined,
    category: "monitoring",
    page: undefined,
  });
});

it("mounts the shelves and the Categories control on the plugin kind view", async () => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <div data-testid="ready">
          <ExplorePage kind="plugin" search={{}} onSearch={() => {}} />
        </div>
      ),
    }),
    history: createMemoryHistory({ initialEntries: ["/explore"] }),
  });
  const { container } = render(<RouterProvider router={router} />);
  expect(
    await screen.findByRole("heading", { name: "Recently added" }),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Categories" })).toBeTruthy();
  const buttons = [...container.querySelectorAll('[data-slot="button"]')];
  const icons = [...container.querySelectorAll('[data-slot="button-icon"]')];
  expect(icons.length).toBeGreaterThan(0);
  for (const icon of icons)
    expect(buttons.some((button) => button.contains(icon))).toBe(true);
});
