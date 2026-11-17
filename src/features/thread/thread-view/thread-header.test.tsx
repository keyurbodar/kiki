import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ThreadCostBadgeControl,
  type ThreadUsage,
} from "@/features/thread/cost-badge";
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

  it("sets the pane search param when a tab is clicked", async () => {
    const router = await renderRoute("/thread/jam_sample_0001");
    fireEvent.click(await screen.findByText("Files"));
    expect(router.state.location.search).toEqual({ pane: "files" });
    fireEvent.click(screen.getByText("Fix flaky checkout test"));
    expect(router.state.location.search).toEqual({});
  });
});
