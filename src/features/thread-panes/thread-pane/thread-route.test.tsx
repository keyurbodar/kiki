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
import { searchParams } from "@/lib/search-params";
import { ThreadScreen } from "@/routes/_app/thread/$threadId";

afterEach(cleanup);

async function renderThread(pane?: string) {
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
      initialEntries: [
        pane === undefined
          ? "/thread/jam_sample_0001"
          : `/thread/jam_sample_0001?pane=${pane}`,
      ],
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
  for (const pane of ["overview", "files"]) {
    it(`mounts the ${pane} pane without the error boundary`, async () => {
      await renderThread(pane);
      expect(screen.queryByText("Something went wrong")).toBeNull();
    });
  }

  it("drops a pane id no entry defines, the way Capy drops an unknown pane", async () => {
    const router = await renderThread("threads");
    expect(screen.queryByText("Something went wrong")).toBeNull();
    await waitFor(() => expect(router.state.location.search).toEqual({}));
    expect(router.state.location.pathname).toBe("/thread/jam_sample_0001");
    expect(screen.queryByPlaceholderText("Search side threads")).toBeNull();
  });
});

describe("side threads in the open-a-tab menu", () => {
  it("lists them in place of the menu's items, not in the right pane", async () => {
    await renderThread();
    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: "Open a tab" },
        { timeout: 3000 },
      ),
    );
    fireEvent.click(await screen.findByText("Side threads"));

    const page = document.querySelector<HTMLElement>(
      '[data-slot="responsive-menu-level"][data-nav="push"]',
    );
    expect(page).not.toBeNull();
    expect(
      page?.contains(screen.getByPlaceholderText("Search side threads")),
    ).toBe(true);
    expect(
      await screen.findByText("Stub the payment gateway in CI", undefined, {
        timeout: 3000,
      }),
    ).toBeTruthy();
    expect(page?.textContent).toContain("Stub the payment gateway in CI");
  });
});
