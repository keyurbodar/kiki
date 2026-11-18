import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { SidebarThread } from "@/components/sidebar-threads";
import { SidebarThreadRow } from "./sidebar-thread-row";

const thread: SidebarThread = {
  id: "thread_specimen_1",
  title: "Capy retry backoff",
  status: "idle",
  needsYou: false,
  ask: null,
  hasUnreads: false,
  age: "2m",
  projectId: null,
  machine: null,
  settled: false,
  pinned: false,
  archived: false,
  owner: true,
};

afterEach(() => {
  cleanup();
});

/** The row is a router `Link`, so it needs a router above it. */
const renderRow = async (node: ReactNode) => {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  await router.load();
};

describe("SidebarThreadRow", () => {
  it("draws a row without a link when it is decoration for a specimen", () => {
    const { container } = render(
      <SidebarThreadRow thread={thread} decorative />,
    );
    const row = container.querySelector('[data-slot="sidebar-thread-row"]');
    expect(row?.tagName).toBe("SPAN");
    expect(container.querySelector("a")).toBeNull();
  });

  it("renders no action cluster for a row that is given no actions", async () => {
    await renderRow(<SidebarThreadRow thread={thread} />);
    expect(screen.queryByLabelText("Settle")).toBeNull();
    expect(screen.queryByLabelText("Thread actions")).toBeNull();
  });
});

describe("SidebarThreadRow actions", () => {
  const withActions = (patch: Partial<SidebarThread> = {}, actions = {}) =>
    renderRow(
      <SidebarThreadRow
        thread={{ ...thread, ...patch }}
        actions={{
          onSettle: () => undefined,
          onArchive: () => undefined,
          menu: <span>menu items</span>,
          ...actions,
        }}
      />,
    );

  it("mounts Capy's hover cluster with settle, archive and the row menu", async () => {
    await withActions();
    expect(screen.getByLabelText("Settle")).toBeTruthy();
    expect(screen.getByLabelText("Archive thread")).toBeTruthy();
    expect(screen.getByLabelText("Thread actions")).toBeTruthy();
  });

  it("keeps the cluster hidden until hover but reachable from the keyboard", async () => {
    await withActions();
    const cluster = screen.getByLabelText("Settle").closest("span.mask-fade-l");
    expect(cluster?.className).toContain("opacity-0");
    expect(cluster?.className).toContain("group-hover/thread:opacity-100");
    expect(cluster?.className).toContain("focus-within:opacity-100");
    const buttons = cluster?.querySelector("span.pointer-events-none");
    expect(buttons?.className).toContain("group-hover/thread:[&_button]:");
    expect(buttons?.className).toContain(
      "focus-within:[&_button]:pointer-events-auto",
    );
  });

  it("offers un-settle instead of settle for a settled row", async () => {
    await renderRow(
      <SidebarThreadRow
        thread={{ ...thread, settled: true }}
        actions={{ onUnsettle: () => undefined }}
      />,
    );
    expect(screen.queryByLabelText("Settle")).toBeNull();
    expect(screen.getByLabelText("Un-settle")).toBeTruthy();
  });

  it("swaps the title for an input while renaming and commits on Enter", async () => {
    const commits: string[] = [];
    await withActions(
      {},
      {
        renaming: true,
        onRename: (title: string) => commits.push(title),
        onRenameCancel: () => undefined,
      },
    );
    const input = screen.getByLabelText("Thread title") as HTMLInputElement;
    expect(input.value).toBe(thread.title);
    fireEvent.change(input, { target: { value: "Renamed in the sidebar" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(commits).toEqual(["Renamed in the sidebar"]);
  });

  it("starts a rename from a double-click on an owned row's title", async () => {
    const starts: string[] = [];
    await withActions({}, { onRenameStart: () => starts.push(thread.id) });
    fireEvent.doubleClick(screen.getByText(thread.title ?? ""));
    expect(starts).toEqual([thread.id]);
  });
});
