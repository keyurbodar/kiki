import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { failMockRequests } from "@/data/mocks/failure";
import { PullsPage } from "./pulls-page";

afterEach(() => {
  failMockRequests(null);
  cleanup();
});

async function renderPulls() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const pullsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/pulls",
    component: () => <PullsPage />,
  });
  const pullRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/pull/$owner/$repo/$prNumber",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pullsRoute, pullRoute]),
    history: createMemoryHistory({ initialEntries: ["/pulls"] }),
  });
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
  await router.load();
}

const failedPulls = () => failMockRequests(/\/pulls(\?|$)/);

describe("the pulls page's failed read", () => {
  it("says the list did not load, and offers a retry", async () => {
    failedPulls();
    await renderPulls();
    expect(
      await screen.findByText("Couldn't load pull requests", undefined, {
        timeout: 4000,
      }),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-slot="pulls-load-failed"]'),
    ).not.toBeNull();
    expect(screen.getByText("Retry")).toBeTruthy();
    // "Action failed" named nothing and left no way to load the list again.
    expect(screen.queryByText("Action failed")).toBeNull();
  });

  it("renders the list once it loads, with no failed state", async () => {
    await renderPulls();
    await waitFor(
      () => expect(screen.queryByText("No pull requests yet")).toBeNull(),
      { timeout: 4000 },
    );
    expect(screen.queryByText("Couldn't load pull requests")).toBeNull();
    expect(
      document.querySelector('[data-slot="pulls-load-failed"]'),
    ).toBeNull();
    expect(document.body.textContent).toContain("Cursor pagination for orders");
  });

  it("loads the list when the retry lands", async () => {
    failedPulls();
    await renderPulls();
    const retry = await screen.findByText("Retry", undefined, {
      timeout: 4000,
    });
    failMockRequests(null);
    fireEvent.click(retry);
    await waitFor(
      () =>
        expect(screen.queryByText("Couldn't load pull requests")).toBeNull(),
      { timeout: 4000 },
    );
    expect(
      document.querySelector('[data-slot="pulls-load-failed"]'),
    ).toBeNull();
  });
});
