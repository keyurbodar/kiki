import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { AsyncResult, Atom } from "effect/reactivity";
import { afterEach, expect, it, vi } from "vitest";
import type { ExploreIndex } from "@/data/api/schemas/explore";
import { ExplorePage, ExploreSearchField } from "./explore-page";

const index = {
  added: [],
  cards: [
    {
      kind: "plugin",
      source: "catalog",
      slug: "edge-platform",
      displayName: "Edge Platform",
      description: "Manage workers, zones, and edge configuration",
      maker: null,
      accent: null,
      category: null,
      firstListedAt: null,
      featuredRank: null,
      hasIcon: false,
      repository: null,
      stars: null,
      starsCheckedAt: null,
      adds: null,
      version: null,
      versionId: null,
      theme: null,
      builtIn: null,
      createdAt: null,
      updatedAt: null,
    },
  ],
} as unknown as ExploreIndex;

vi.mock("@/data/atoms/explore", () => ({
  orgListingsAtom: () => Atom.make(AsyncResult.success(index)),
}));

vi.mock("@/features/explore/listing-detail/explore-session", () => ({
  useOrgId: () => "org_test",
}));

afterEach(cleanup);

const renderInRouter = (ui: () => React.ReactNode) => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <div data-testid="ready">{ui()}</div>,
    }),
    history: createMemoryHistory({ initialEntries: ["/explore"] }),
  });
  return render(<RouterProvider router={router} />);
};

it("mounts the search field inside an input group", async () => {
  render(<ExploreSearchField search={{}} onSearch={() => {}} kind="plugin" />);
  const input = await screen.findByRole("searchbox");
  const group = input.parentElement;
  expect(group?.getAttribute("data-slot")).toBe("input-group");
  expect(group?.querySelector('[data-slot="icon"]')).not.toBeNull();
});

it("scrolls the listing grid inside its own scroll area, below the header", async () => {
  const { container } = renderInRouter(() => (
    <ExplorePage kind="plugin" search={{}} onSearch={() => {}} />
  ));
  const row = await screen.findByText("Edge Platform");
  const scrollArea = container.querySelector('[data-slot="scroll-area"]');
  const viewport = container.querySelector(
    '[data-slot="scroll-area-viewport"]',
  );
  expect(scrollArea).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(scrollArea?.contains(viewport)).toBe(true);
  expect(viewport?.contains(row)).toBe(true);
  const header = container.querySelector("header") as Node;
  expect(viewport?.contains(header)).toBe(false);
  expect(
    (scrollArea as Node).compareDocumentPosition(header) &
      Node.DOCUMENT_POSITION_PRECEDING,
  ).toBeTruthy();
  expect(
    screen.getByRole("searchbox").closest('[data-slot="input-group"]'),
  ).not.toBeNull();
});
