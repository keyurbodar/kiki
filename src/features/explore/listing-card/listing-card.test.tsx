import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { listingAdds, listingByline, listingStarsTitle } from "./format";
import { type ListingCard, ListingRow } from "./listing-card";

afterEach(cleanup);

const card: ListingCard = {
  kind: "skill",
  source: "catalog",
  slug: "plan-review",
  displayName: "Plan Review",
  description: "Stress-test a plan.",
  maker: { name: "Acme Labs" },
  builtIn: null,
  repository: "acme-labs/skills",
  stars: 1200,
  starsCheckedAt: new Date("2026-03-01T12:00:00.000Z"),
  adds: 3,
  theme: null,
};

const renderInRouter = (ui: () => React.ReactNode) => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <div data-testid="ready">{ui()}</div>,
    }),
    history: createMemoryHistory({ initialEntries: ["/explore/skills"] }),
  });
  return render(<RouterProvider router={router} />);
};

it("names the maker, or Built in for a built-in listing", () => {
  expect(listingByline(card)).toBe("Acme Labs");
  expect(
    listingByline({ ...card, builtIn: { settingsPath: "/settings/x" } }),
  ).toBe("Built in");
  expect(listingByline({ ...card, maker: null })).toBeUndefined();
  expect(listingByline({ ...card, kind: "theme", maker: null })).toBe("Capy");
});

it("formats adds and the star tooltip", () => {
  expect(listingAdds(1)).toBe("1 add");
  expect(listingAdds(1200)).toBe("1.2k adds");
  expect(listingStarsTitle(null)).toBe("GitHub stars");
  expect(listingStarsTitle(new Date("2026-03-01T12:00:00.000Z"))).toBe(
    "GitHub stars, checked Mar 1",
  );
});

it("renders the row with its name, description and metadata", async () => {
  renderInRouter(() => <ListingRow card={card} />);
  await screen.findByTestId("ready");
  expect(screen.getByText("Plan Review")).toBeTruthy();
  expect(screen.getByText("Stress-test a plan")).toBeTruthy();
  expect(screen.getByText("1.2k")).toBeTruthy();
  expect(screen.getByText("3 adds")).toBeTruthy();
  expect(screen.getByText("Acme Labs")).toBeTruthy();
});

it("drops the metadata column in identity mode", async () => {
  renderInRouter(() => <ListingRow card={card} metadata="identity" />);
  await screen.findByTestId("ready");
  expect(screen.queryByText("3 adds")).toBeNull();
});

it("marks a catalog listing as verified by Capy and leaves a user listing unmarked", async () => {
  const { container, unmount } = renderInRouter(() => (
    <ListingRow card={card} />
  ));
  await screen.findByTestId("ready");
  expect(
    container.querySelector('[aria-label="Verified by Capy"]'),
  ).not.toBeNull();
  unmount();
  const { container: userContainer } = renderInRouter(() => (
    <ListingRow card={{ ...card, source: "user" }} />
  ));
  await screen.findByTestId("ready");
  expect(
    userContainer.querySelector('[aria-label="Verified by Capy"]'),
  ).toBeNull();
});
