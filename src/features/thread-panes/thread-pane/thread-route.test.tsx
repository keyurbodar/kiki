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

async function renderThread(search?: string) {
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
        search === undefined
          ? "/thread/jam_sample_0001"
          : `/thread/jam_sample_0001?${search}`,
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
  for (const pane of ["overview", "files", "setup"]) {
    it(`mounts the ${pane} pane without the error boundary`, async () => {
      await renderThread(`pane=${pane}`);
      expect(screen.queryByText("Something went wrong")).toBeNull();
    });
  }

  for (const pane of ["threads", "all-threads", "pull-requests"]) {
    it(`drops the retired ${pane} id from the URL and renders the chat`, async () => {
      const router = await renderThread(`pane=${pane}`);
      expect(screen.queryByText("Something went wrong")).toBeNull();
      await waitFor(() => expect(router.state.location.search).toEqual({}));
      expect(router.state.location.pathname).toBe("/thread/jam_sample_0001");
      expect(screen.queryByPlaceholderText("Search side threads")).toBeNull();
    });
  }

  it("keeps a pane target Capy opens by tab key, such as a service preview", async () => {
    const router = await renderThread("pane=service-preview%3Am1%3A3000");
    expect(screen.queryByText("Something went wrong")).toBeNull();
    expect(router.state.location.search).toEqual({
      pane: "service-preview:m1:3000",
    });
  });

  it("keeps a registered pane id in the URL", async () => {
    const router = await renderThread("pane=overview");
    expect(router.state.location.search).toEqual({ pane: "overview" });
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
