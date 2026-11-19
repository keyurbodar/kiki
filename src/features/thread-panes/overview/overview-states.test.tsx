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

/** The thread route with a dock pane open, reading through the real mock client. */
async function renderPane(pane: string, threadId = "jam_sample_0001") {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const threadRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/thread/$threadId",
    validateSearch: searchParams(["pane"]),
    component: () => {
      const { threadId: id } = threadRoute.useParams();
      const { pane: open } = threadRoute.useSearch();
      return <ThreadScreen threadId={id} pane={open} />;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([threadRoute]),
    history: createMemoryHistory({
      initialEntries: [`/thread/${threadId}?pane=${pane}`],
    }),
  });
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
}

describe("the overview pane's three states", () => {
  it("renders the overview once its reads land", async () => {
    await renderPane("overview");
    await waitFor(
      () =>
        expect(
          document.querySelector("[data-slot=right-panel]"),
        ).not.toBeNull(),
      { timeout: 4000 },
    );
    expect(
      document.querySelector("[data-slot=overview-load-failed]"),
    ).toBeNull();
  });

  it("says the overview did not load instead of drawing it empty", async () => {
    failMockRequests(/\/jams\/jam_sample_0001\/children$/);
    await renderPane("overview");
    expect(
      await screen.findByText("Couldn't load the overview", undefined, {
        timeout: 4000,
      }),
    ).toBeTruthy();
    // The empty overview would claim there is nothing here; a failed read may
    // not say that.
    expect(screen.queryByAltText("Overview is empty")).toBeNull();
    expect(
      document.querySelector("[data-slot=overview-load-failed]"),
    ).not.toBeNull();
  });

  it("draws a Captain's crew and drive in the overview of its own thread", async () => {
    await renderPane("overview", "jam_sample_cap1");
    await waitFor(
      () =>
        expect(
          document.querySelector("[data-slot=captain-overview]"),
        ).not.toBeNull(),
      { timeout: 4000 },
    );
    // A Captain with no crew and no files gets its own empty page, with the two
    // ways out of it, instead of a thread overview it does not have.
    expect(screen.getByText("Issues")).toBeTruthy();
    expect(screen.getByText("Drive")).toBeTruthy();
    expect(document.querySelector('img[alt="Overview is empty"]')).toBeNull();
  });
});
