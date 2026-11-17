import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { searchParams } from "@/lib/search-params";
import { ThreadScreen } from "@/routes/_app/thread/$threadId";

afterEach(cleanup);

async function renderThread(pane: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const threadRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/thread/$threadId",
    validateSearch: searchParams(["pane"]),
    component: () => {
      const { threadId } = threadRoute.useParams();
      const { pane } = threadRoute.useSearch();
      return <ThreadScreen threadId={threadId} pane={pane} />;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([threadRoute]),
    history: createMemoryHistory({
      initialEntries: [`/thread/jam_sample_0001?pane=${pane}`],
    }),
  });
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
  return router;
}

describe("thread route with a pane", () => {
  for (const pane of ["overview", "files", "threads"]) {
    it(`mounts the ${pane} pane without the error boundary`, async () => {
      await renderThread(pane);
      expect(screen.queryByText("Something went wrong")).toBeNull();
    });
  }

  it("renders the threads pane's rows inside a menu root", async () => {
    await renderThread("threads");
    const menu = await screen.findByRole("menu", undefined, {
      timeout: 3000,
    });
    const items = await screen.findAllByRole("menuitem");
    expect(items.every((item) => menu.contains(item))).toBe(true);
    expect(screen.getByPlaceholderText("Search side threads")).toBeTruthy();
    expect(
      await screen.findByText("Stub the payment gateway in CI", undefined, {
        timeout: 3000,
      }),
    ).toBeTruthy();
  });
});
