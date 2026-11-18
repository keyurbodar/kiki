import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { failMockRequests } from "@/data/mocks/failure";
import { ThreadScreen } from "@/features/thread/thread-route/thread-route";
import { searchParams } from "@/lib/search-params";

afterEach(() => {
  failMockRequests(null);
  cleanup();
});

/**
 * The thread route with the Setup pane open. Reads go through the real mock
 * client, so `failMockRequests` makes them fail the way a broken backend would.
 */
async function renderSetup(threadId: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const threadRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/thread/$threadId",
    validateSearch: searchParams(["pane"]),
    component: () => {
      const { threadId: id } = threadRoute.useParams();
      const { pane } = threadRoute.useSearch();
      return <ThreadScreen threadId={id} pane={pane} />;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([threadRoute]),
    history: createMemoryHistory({
      initialEntries: [`/thread/${threadId}?pane=setup`],
    }),
  });
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
}

describe("the Setup pane's three states", () => {
  it("renders the project's Setup once it loads", async () => {
    await renderSetup("jam_sample_0001");
    await waitFor(
      () =>
        expect(document.querySelector("[data-slot=setup-view]")).not.toBeNull(),
      { timeout: 4000 },
    );
    expect(document.querySelector("[data-slot=setup-load-failed]")).toBeNull();
  });

  it("says the thread's project did not load when that read fails", async () => {
    failMockRequests(/\/jams\/jam_sample_0001$/);
    await renderSetup("jam_sample_0001");
    expect(
      await screen.findByText("Couldn't load Setup", undefined, {
        timeout: 4000,
      }),
    ).toBeTruthy();
    // Not the empty state: a thread whose project failed to load is not a
    // thread without a project.
    expect(screen.queryByText(/This thread has no project/)).toBeNull();
    expect(
      document.querySelector("[data-slot=setup-load-failed]"),
    ).not.toBeNull();
  });

  it("says the project's Setup did not load when that read fails", async () => {
    failMockRequests(/\/projects\/[^/]+\/setup/);
    await renderSetup("jam_sample_0001");
    expect(
      await screen.findByText("Couldn't load this project's Setup", undefined, {
        timeout: 4000,
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/No commands yet/)).toBeNull();
  });
});
