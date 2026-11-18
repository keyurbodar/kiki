import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ThreadListItem, ThreadSection } from "../threads-page/model";
import { ThreadRow, threadsListItems } from "./threads-list";

afterEach(cleanup);

const thread = (id: string): ThreadListItem => ({
  id,
  title: id,
  status: "idle",
  archived: false,
  archivedIdleDays: null,
  threadNumber: 1,
  userId: "user_me",
  participated: true,
  origin: "web",
  projectId: null,
  pinned: false,
  needsYou: false,
  hasUnreads: false,
  personal: false,
  lastModelId: null,
  pulls: [],
  createdAt: new Date(2026, 10, 17),
  sortActivityAt: new Date(2026, 10, 17),
  lastActivityAt: new Date(2026, 10, 17),
  settledAt: null,
  automationName: null,
  automationId: null,
  captain: null,
});

const section = (id: string, ids: ReadonlyArray<string>): ThreadSection => ({
  id,
  label: id,
  members: ids.map(thread),
  showCount: ids.length > 0,
});

async function mount(children: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => children });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/threads"] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

const row = (threadId: string) => (
  <ThreadRow
    thread={thread(threadId)}
    projects={new Map()}
    modelName={() => undefined}
    groupedByProject={false}
    now={new Date(2026, 10, 17).getTime()}
    checked={false}
    selectionMode={false}
    onCheck={() => {}}
  />
);

describe("threads list items", () => {
  it("puts an open section's rows after its head, in order", () => {
    const items = threadsListItems([section("all", ["a", "b"])], () => true);
    expect(items.map((item) => item.kind)).toEqual(["section", "row", "row"]);
    expect(
      items.flatMap((item) => (item.kind === "row" ? item.thread.id : [])),
    ).toEqual(["a", "b"]);
  });

  it("keeps a closed section's rows out of the window", () => {
    const items = threadsListItems(
      [section("open", ["a"]), section("closed", ["b", "c"])],
      (id) => id === "open",
    );
    expect(items.map((item) => item.kind)).toEqual([
      "section",
      "row",
      "section",
    ]);
    expect(items.at(-1)).toMatchObject({ kind: "section", open: false });
  });
});

describe("thread row preview card", () => {
  it("opens Capy's preview card when the row takes focus", async () => {
    await mount(row("row-a"));
    const link = document.querySelector("[data-thread-row='row-a']");
    if (link === null) throw new Error("no row");
    expect(
      document.querySelector("[data-slot='preview-card-content']"),
    ).toBeNull();
    fireEvent.focus(link);
    await new Promise((resolve) => setTimeout(resolve, 420));
    expect(
      document.querySelector("[data-slot='preview-card-content']"),
    ).not.toBeNull();
  });

  it("keeps the row's context menu wired", async () => {
    await mount(row("row-b"));
    const link = document.querySelector("[data-thread-row='row-b']");
    if (link === null) throw new Error("no row");
    fireEvent.contextMenu(link);
    expect(await screen.findByText("Rename")).toBeTruthy();
  });

  it("offers Pin on a row and reports the direction the press asked for", async () => {
    const presses: Array<[string, boolean]> = [];
    await mount(
      <ThreadRow
        thread={thread("row-c")}
        projects={new Map()}
        modelName={() => undefined}
        groupedByProject={false}
        now={new Date(2026, 10, 17).getTime()}
        checked={false}
        selectionMode={false}
        onCheck={() => {}}
        onPin={(id, pinned) => presses.push([id, pinned])}
      />,
    );
    const link = document.querySelector("[data-thread-row='row-c']");
    if (link === null) throw new Error("no row");
    fireEvent.contextMenu(link);
    fireEvent.click(await screen.findByText("Pin"));
    expect(presses).toEqual([["row-c", true]]);
  });

  it("offers Move to and Tags only when the caller can fill them", async () => {
    const moved: Array<[string, string]> = [];
    await mount(
      <ThreadRow
        thread={thread("row-e")}
        projects={new Map()}
        modelName={() => undefined}
        groupedByProject={false}
        now={new Date(2026, 10, 17).getTime()}
        checked={false}
        selectionMode={false}
        onCheck={() => {}}
        menu={{
          orgId: "org_sample_acme",
          folders: [{ id: "folder_1", name: "Release" }],
          moveTo: (id, folderId) => moved.push([id, folderId]),
          tags: [{ id: "tag_1", name: "frontend" }],
          toggleTag: () => {},
          createTag: () => {},
        }}
      />,
    );
    const link = document.querySelector("[data-thread-row='row-e']");
    if (link === null) throw new Error("no row");
    fireEvent.contextMenu(link);
    expect(await screen.findByText("Move to")).toBeTruthy();
    expect(screen.getByText("Tags")).toBeTruthy();
  });

  it("leaves the folder and tag rows out when it has no sources", async () => {
    await mount(row("row-f"));
    const link = document.querySelector("[data-thread-row='row-f']");
    if (link === null) throw new Error("no row");
    fireEvent.contextMenu(link);
    await screen.findByText("Rename");
    expect(screen.queryByText("Move to")).toBeNull();
    expect(screen.queryByText("Tags")).toBeNull();
  });

  it("reads Unpin on a row that is already pinned", async () => {
    await mount(
      <ThreadRow
        thread={{ ...thread("row-d"), pinned: true }}
        projects={new Map()}
        modelName={() => undefined}
        groupedByProject={false}
        now={new Date(2026, 10, 17).getTime()}
        checked={false}
        selectionMode={false}
        onCheck={() => {}}
        onPin={() => {}}
      />,
    );
    const link = document.querySelector("[data-thread-row='row-d']");
    if (link === null) throw new Error("no row");
    fireEvent.contextMenu(link);
    expect(await screen.findByText("Unpin")).toBeTruthy();
    expect(screen.queryByText("Pin")).toBeNull();
  });
});
