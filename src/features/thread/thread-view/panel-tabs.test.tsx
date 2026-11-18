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
import { ThreadScreen } from "@/features/thread/thread-route/thread-route";
import { searchParams } from "@/lib/search-params";

afterEach(cleanup);

const paneTab = (id: string) =>
  document.querySelector(`[data-pane-tab="${id}"]`) ?? undefined;

const tabIds = () =>
  [...document.querySelectorAll("[data-pane-tab]")].map((el) =>
    el.getAttribute("data-pane-tab"),
  );

const waitForStrip = () =>
  waitFor(() => expect(paneTab("chat")).toBeDefined(), { timeout: 3000 });

async function renderRoute(path: string) {
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
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
  return router;
}

/** The panel's own menu: the chat strip carries a second "Open a tab". */
async function openFromMenu(label: string) {
  const dock =
    document.querySelector<HTMLElement>('[data-slot="thread-dock-header"]') ??
    document.body;
  const trigger = dock.querySelector('[aria-label="Open a tab"]');
  if (trigger === null) throw new Error("No panel tab menu");
  fireEvent.click(trigger);
  fireEvent.click(await screen.findByRole("menuitem", { name: label }));
}

describe("thread panel tabs", () => {
  it("keeps a second pane open beside the first", async () => {
    await renderRoute("/thread/jam_sample_0001");
    await waitForStrip();
    await openFromMenu("Overview");
    await waitFor(() => expect(paneTab("overview")).toBeDefined());
    await openFromMenu("Files");
    await waitFor(() => expect(paneTab("files")).toBeDefined());
    expect(tabIds()).toEqual(["chat", "overview", "files"]);
  });

  it("names the tab on screen in the URL and leaves the other open", async () => {
    const router = await renderRoute("/thread/jam_sample_0001");
    await waitForStrip();
    await openFromMenu("Overview");
    await waitFor(() => expect(paneTab("overview")).toBeDefined());
    await openFromMenu("Files");
    await waitFor(() => expect(paneTab("files")).toBeDefined());
    // Capy reads `files` from the URL but never writes it, so the panel keeps
    // the param its last written tab left behind.
    expect(router.state.location.search).toEqual({});
    const dock = document.querySelector('[data-slot="thread-dock-header"]');
    const overviewTab = [...(dock?.querySelectorAll("[data-pane-tab]") ?? [])]
      .find((el) => el.getAttribute("data-pane-tab") === "overview")
      ?.querySelector("button");
    if (overviewTab === undefined || overviewTab === null)
      throw new Error("No overview tab in the panel");
    fireEvent.click(overviewTab);
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ pane: "overview" }),
    );
    expect(tabIds()).toEqual(["chat", "overview", "files"]);
  });

  it("closes one tab and leaves the rest of the strip alone", async () => {
    await renderRoute("/thread/jam_sample_0001");
    await waitForStrip();
    await openFromMenu("Overview");
    await waitFor(() => expect(paneTab("overview")).toBeDefined());
    await openFromMenu("Files");
    await waitFor(() => expect(paneTab("files")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Close Overview" }));
    await waitFor(() => expect(paneTab("overview")).toBeUndefined());
    expect(tabIds()).toEqual(["chat", "files"]);
  });
});
