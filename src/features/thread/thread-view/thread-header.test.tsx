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
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ThreadCostBadgeControl,
  type ThreadUsage,
} from "@/features/thread/cost-badge";
import { isRetiredPane } from "@/features/thread-panes/thread-pane";
import { searchParams } from "@/lib/search-params";
import { ThreadScreen } from "@/routes/_app/thread/$threadId";
import { ThreadHeader } from "./thread-header";
import { paneTabs } from "./thread-tabs";

const usage: ThreadUsage = {
  members: [
    {
      jamId: "jam_sample_0001",
      familyId: "jam_sample_0001",
      usage: { totalCredits: 120, vmCredits: 0 },
      keyCredits: 0,
      models: [],
      images: [],
    },
  ],
  crew: [],
};

vi.mock("@/features/thread/cost-badge", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/thread/cost-badge")>();
  return {
    ...actual,
    ThreadCostBadge: () => (
      <actual.ThreadCostBadgeControl threadId="jam_sample_0001" usage={usage} />
    ),
  };
});

afterEach(cleanup);

const renderHeader = (
  overrides: Partial<Parameters<typeof ThreadHeader>[0]>,
) => {
  const props = {
    threadId: "jam_sample_0001",
    title: "Fix flaky checkout test",
    tabs: paneTabs(),
    activeId: "chat",
    cost: <ThreadCostBadgeControl threadId="jam_sample_0001" usage={usage} />,
    onSelectChat: () => undefined,
    onSelectTab: () => undefined,
    onCloseTab: () => undefined,
    ...overrides,
  };
  return render(<ThreadHeader {...props} />);
};

const tabButton = (label: string) => {
  const button = screen.getByText(label).closest("button");
  if (button === null) throw new Error(`No tab button for ${label}`);
  return button;
};

describe("ThreadHeader", () => {
  it("carries the header's progress edge, sweeping only while the thread works", () => {
    const { container, unmount } = renderHeader({});
    const edge = container.querySelector('[data-slot="progress-edge"]');
    expect(edge).not.toBeNull();
    expect(edge?.getAttribute("data-active")).toBe("false");
    expect(edge?.className).toContain("absolute inset-x-0 top-0");
    unmount();
    const working = renderHeader({ working: true });
    expect(
      working.container
        .querySelector('[data-slot="progress-edge"]')
        ?.getAttribute("data-active"),
    ).toBe("true");
  });

  it("shows the thread title in the chat tab beside the cost chip", () => {
    const { container } = renderHeader({});
    expect(screen.getByText("Fix flaky checkout test")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Thread cost $0.12" }),
    ).toBeTruthy();
    const chat = container.querySelector('[data-pane-tab="chat"]');
    expect(chat?.querySelector("[data-selected]")).not.toBeNull();
    expect(container.querySelector("header")?.className).toContain("min-h-11");
  });

  it("puts the thread's avatar before its name in the chat tab", () => {
    const { container } = renderHeader({});
    const chat = container.querySelector('[data-pane-tab="chat"]');
    expect(chat?.querySelector('[data-slot="chat-identity"]')).not.toBeNull();
    expect(chat?.textContent).toContain("Fix flaky checkout test");
  });

  it("sizes the thread actions like Capy's 28×28 header controls", () => {
    renderHeader({});
    for (const name of ["Open a tab", "Thread options", "Expand pane"]) {
      expect(screen.getByRole("button", { name }).className).toContain(
        "size-(--h-control-sm)",
      );
    }
  });

  it("lists the registered pane tabs with a close button each", () => {
    renderHeader({});
    expect(tabButton("Files")).toBeTruthy();
    expect(tabButton("Issues")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close Files" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open a tab" })).toBeTruthy();
  });

  it("selects a pane tab and highlights it when it is the active one", () => {
    const onSelectTab = vi.fn();
    const { container } = renderHeader({
      activeId: "files",
      onSelectTab,
    });
    const files = container.querySelector('[data-pane-tab="files"]');
    expect(files?.querySelector("[data-selected]")).not.toBeNull();
    expect(
      container
        .querySelector('[data-pane-tab="chat"]')
        ?.querySelector("[data-selected]"),
    ).toBeNull();
    fireEvent.click(tabButton("Issues"));
    expect(onSelectTab).toHaveBeenCalledWith("captain_issues");
  });

  it("toggles the pane expansion from the trailing action", () => {
    const onToggleExpand = vi.fn();
    renderHeader({ onToggleExpand });
    fireEvent.click(screen.getByRole("button", { name: "Expand pane" }));
    expect(onToggleExpand).toHaveBeenCalledOnce();
    cleanup();
    renderHeader({ expanded: true, onToggleExpand });
    const collapse = screen.getByRole("button", { name: "Collapse pane" });
    expect(collapse.getAttribute("aria-pressed")).toBe("true");
  });

  it("copies the selected tab's link from the thread options menu", async () => {
    const onCopyLink = vi.fn();
    renderHeader({ activeId: "files", onCopyLink });
    fireEvent.click(screen.getByRole("button", { name: "Thread options" }));
    fireEvent.click(await screen.findByText("Copy link"));
    expect(onCopyLink).toHaveBeenCalledWith(
      "/thread/jam_sample_0001?pane=files",
    );
  });
});

const paneTab = (id: string) =>
  document.querySelector(`[data-pane-tab="${id}"]`) ?? undefined;

/** The strip mounts once the thread atoms resolve. */
const waitForStrip = () =>
  waitFor(() => expect(paneTab("chat")).toBeDefined(), { timeout: 3000 });

describe("thread route header", () => {
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

  it("renders the header with the thread title and the cost chip", async () => {
    await renderRoute("/thread/jam_sample_0001");
    expect(
      await screen.findByText("Fix flaky checkout test", undefined, {
        timeout: 3000,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Thread cost $0.12" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open a tab" })).toBeTruthy();
  });

  it("opens a pane from the tab strip and keeps the URL in step", async () => {
    const router = await renderRoute("/thread/jam_sample_0001");
    fireEvent.click(await screen.findByLabelText("Open a tab"));
    fireEvent.click(await screen.findByText("Files"));
    await waitFor(() => {
      expect(
        document
          .querySelector('[data-pane-tab="files"]')
          ?.querySelector("[data-selected]"),
      ).not.toBeNull();
    });
    expect(router.state.location.search).toEqual({});
    const [openTab] = screen.getAllByLabelText("Open a tab");
    if (openTab === undefined) throw new Error("No open-a-tab control");
    fireEvent.click(openTab);
    fireEvent.click(await screen.findByText("Diffs"));
    await waitFor(() => {
      expect(
        document
          .querySelector('[data-pane-tab="diffs"]')
          ?.querySelector("[data-selected]"),
      ).not.toBeNull();
    });
    expect(router.state.location.search).toEqual({ pane: "diffs" });
    fireEvent.click(screen.getByText("Fix flaky checkout test"));
    await waitFor(() => {
      expect(
        document
          .querySelector('[data-pane-tab="chat"]')
          ?.querySelector("[data-selected]"),
      ).not.toBeNull();
    });
    expect(router.state.location.search).toEqual({});
  });

  it("keeps the pane params Capy writes across a reload", async () => {
    for (const param of ["overview", "diffs", "captain_issues"]) {
      const router = await renderRoute(`/thread/jam_sample_0001?pane=${param}`);
      await waitFor(() => {
        expect(paneTab(param)?.querySelector("[data-selected]")).not.toBeNull();
      });
      expect(router.state.location.search).toEqual({ pane: param });
      cleanup();
    }
  });

  it("opens Files from its param and lands on a param-free URL", async () => {
    const router = await renderRoute("/thread/jam_sample_0001?pane=files");
    await waitFor(() => {
      expect(paneTab("files")?.querySelector("[data-selected]")).not.toBeNull();
    });
    expect(router.state.location.search).toEqual({});
  });

  it("keeps a parameterised pane key it cannot open yet", async () => {
    for (const param of ["browser:machine_01"]) {
      const router = await renderRoute(`/thread/jam_sample_0001?pane=${param}`);
      await waitForStrip();
      expect(paneTab("chat")?.querySelector("[data-selected]")).not.toBeNull();
      expect(router.state.location.search).toEqual({ pane: param });
      cleanup();
    }
  });

  it("opens the pane the URL names when Capy honours that param", async () => {
    for (const param of ["overview", "setup"]) {
      await renderRoute(`/thread/jam_sample_0001?pane=${param}`);
      await waitForStrip();
      expect(paneTab(param)?.querySelector("[data-selected]")).not.toBeNull();
      cleanup();
    }
  });

  it("lists the open pane, not the registry's catalogue", async () => {
    await renderRoute("/thread/jam_sample_0001");
    await waitForStrip();
    for (const id of ["setup", "files", "issues", "overview", "diffs"])
      expect(paneTab(id)).toBeUndefined();
  });

  it("adds exactly the tab a pane opens", async () => {
    await renderRoute("/thread/jam_sample_0001");
    fireEvent.click(await screen.findByLabelText("Open a tab"));
    fireEvent.click(await screen.findByText("Files"));
    await waitFor(() => expect(paneTab("files")).toBeDefined());
    const tabs = [...document.querySelectorAll("[data-pane-tab]")].map((el) =>
      el.getAttribute("data-pane-tab"),
    );
    expect(tabs).toEqual(["chat", "files"]);
  });

  it("drops the pane the strip closes", async () => {
    const router = await renderRoute("/thread/jam_sample_0001?pane=overview");
    await waitFor(() => {
      expect(
        paneTab("overview")?.querySelector("[data-selected]"),
      ).not.toBeNull();
    });
    fireEvent.click(screen.getByRole("button", { name: "Close Overview" }));
    await waitFor(() => expect(paneTab("overview")).toBeUndefined());
    expect(router.state.location.search).toEqual({});
  });

  it("opens a browser pane from the strip's menu", async () => {
    await renderRoute("/thread/jam_sample_0001");
    fireEvent.click(await screen.findByLabelText("Open a tab"));
    fireEvent.click(await screen.findByText("Browser"));
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="browser-pane"]'),
      ).not.toBeNull(),
    );
    expect(paneTab("chat")?.querySelector("[data-selected]")).toBeNull();
  });

  it("renders one header bar, not a bar inside a bar", async () => {
    await renderRoute("/thread/jam_sample_0001");
    await waitForStrip();
    expect(document.querySelectorAll("header").length).toBe(1);
  });

  it("drops the pane params Capy does not keep", async () => {
    for (const param of [
      "threads",
      "all-threads",
      "pull-requests",
      "bogus",
      "whatever:junk",
    ]) {
      const router = await renderRoute(`/thread/jam_sample_0001?pane=${param}`);
      await waitForStrip();
      expect(paneTab("chat")?.querySelector("[data-selected]")).not.toBeNull();
      expect(router.state.location.search).toEqual({});
      cleanup();
    }
  });

  it("rewrites a retired pane id off the URL", async () => {
    const router = await renderRoute("/thread/jam_sample_0001?pane=threads");
    await waitForStrip();
    expect(paneTab("chat")?.querySelector("[data-selected]")).not.toBeNull();
    expect(router.state.location.search).toEqual({});
  });

  it("reseeds the pane from the URL when the thread is entered again", async () => {
    const router = await renderRoute("/thread/jam_sample_0001");
    fireEvent.click(await screen.findByLabelText("Open a tab"));
    fireEvent.click(await screen.findByText("Files"));
    await waitFor(() => {
      expect(paneTab("files")?.querySelector("[data-selected]")).not.toBeNull();
    });
    await act(async () => {
      await router.navigate({
        to: "/thread/$threadId",
        params: { threadId: "jam_sample_0002" },
      });
    });
    await act(async () => {
      await router.navigate({
        to: "/thread/$threadId",
        params: { threadId: "jam_sample_0001" },
      });
    });
    await waitFor(() => {
      expect(paneTab("chat")?.querySelector("[data-selected]")).not.toBeNull();
    });
    expect(
      paneTab("files")?.querySelector("[data-selected]") ?? null,
    ).toBeNull();
  });

  it("retires exactly the pane ids Capy has no pane for", () => {
    for (const id of ["threads", "all-threads", "pull-requests"]) {
      expect(isRetiredPane(id)).toBe(true);
    }
    for (const id of ["overview", "diffs", "files", "captain_issues"]) {
      expect(isRetiredPane(id)).toBe(false);
    }
    expect(isRetiredPane(undefined)).toBe(false);
  });
});
