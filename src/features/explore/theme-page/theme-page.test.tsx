import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { DateTime } from "effect";
import type { ReactNode } from "react";
import { afterEach, expect, it } from "vitest";
import {
  ExploreCard,
  ExploreListing,
  ExploreVersion,
} from "@/data/api/schemas/explore";
import { ThemeListing, ThemeListingPage } from "./theme-page";

afterEach(cleanup);

if (globalThis.ResizeObserver === undefined)
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;

function renderRoute(ui: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <RegistryProvider>{ui}</RegistryProvider>,
    }),
    history: createMemoryHistory({
      initialEntries: ["/explore/themes/sample"],
    }),
  });
  return render(<RouterProvider router={router} />);
}

const at = (iso: string) => DateTime.makeUnsafe(iso);

const palette = {
  "--bg": "#101010",
  "--panel": "#202020",
  "--fg": "#f5f5f5",
  "--primary": "#7ad0ff",
};

const listing = new ExploreListing({
  card: new ExploreCard({
    kind: "theme",
    source: "catalog",
    slug: "sample-theme",
    displayName: "Sample Theme",
    description: "A calm palette for long sessions.",
    maker: { name: "Acme" },
    accent: null,
    category: null,
    firstListedAt: null,
    featuredRank: null,
    popularRank: null,
    hasIcon: false,
    repository: null,
    stars: null,
    starsCheckedAt: null,
    adds: 2400,
    version: "1.2.0",
    versionId: "ver_sample",
    theme: null,
    builtIn: null,
    createdAt: at("2026-10-01T09:00:00Z"),
    updatedAt: at("2026-11-02T12:00:00Z"),
  }),
  content: {
    kind: "theme",
    theme: {
      light: palette,
      dark: palette,
      wallpaper: { name: "Dunes" },
      appearance: { effect: "grain" },
    },
  },
  setup: null,
  versions: [
    new ExploreVersion({
      id: "ver_sample",
      version: "1.2.0",
      notes: null,
      createdAt: at("2026-11-02T12:00:00Z"),
    }),
  ],
});

it("renders the theme detail surface for a theme listing", async () => {
  renderRoute(<ThemeListing listing={listing} />);
  expect(
    await screen.findByRole("heading", { name: "Sample Theme", level: 1 }),
  ).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Light and dark" })).toBeTruthy();
  expect(
    screen.getByText(
      "Adding it applies these colors with the wallpaper and effect",
    ),
  ).toBeTruthy();
  expect(screen.getByText("Acme")).toBeTruthy();
  expect(screen.getByText("Dunes")).toBeTruthy();
  expect(screen.getByText("Grain")).toBeTruthy();
  expect(screen.getByText("2.4k times")).toBeTruthy();
  expect(screen.getByText("1.2.0, Nov 2")).toBeTruthy();
  expect(screen.getByText("Report")).toBeTruthy();
  expect(
    screen.getByRole("navigation", { name: "Breadcrumb" }).textContent,
  ).toContain("Themes");
});

it("falls back to the shared listing detail without a palette", async () => {
  const plain = new ExploreListing({
    card: listing.card,
    content: { kind: "builtIn" },
    setup: null,
    versions: [],
  });
  renderRoute(<ThemeListing listing={plain} />);
  expect(
    await screen.findByRole("heading", { name: "Sample Theme", level: 1 }),
  ).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Light and dark" })).toBeNull();
});

it("says the theme is not listed when the endpoint has no such slug", async () => {
  renderRoute(<ThemeListingPage slug="no-such-theme" />);
  expect(
    await screen.findByText("This item is not listed in Explore"),
  ).toBeTruthy();
});
