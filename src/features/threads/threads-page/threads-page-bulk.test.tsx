import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { defaultThreadsPageState, type ThreadListItem } from "./model";
import { ThreadsPageView } from "./threads-page";

afterEach(cleanup);

const thread = (id: string, title: string): ThreadListItem => ({
  id,
  title,
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

async function mount(state = defaultThreadsPageState) {
  const rootRoute = createRootRoute({
    component: () => (
      <ThreadsPageView
        threads={[thread("a", "First thread"), thread("b", "Second thread")]}
        captains={[]}
        projects={[]}
        folders={[]}
        viewerId="user_me"
        loading={false}
        failed={false}
        state={state}
        onStateChange={() => {}}
        now={new Date(2026, 10, 17).getTime()}
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/threads"] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

const selectFirst = () =>
  fireEvent.click(
    document.querySelector('[data-thread-row="a"] button') as Element,
  );

describe("threads page bulk bar", () => {
  it("counts the selection like Capy and offers its actions", async () => {
    await mount();
    expect(screen.queryByText("1 selected")).toBeNull();
    selectFirst();
    expect(screen.getByText("1 selected")).toBeTruthy();
    for (const label of [
      "Folder",
      "Pin",
      "Archive",
      "Delete",
      "Clear selection",
    ])
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
  });

  it("confirms a delete with Capy's copy before running it", async () => {
    let deleted: ReadonlyArray<string> = [];
    await mountWithDelete((ids) => {
      deleted = ids;
    });
    selectFirst();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete threads")).toBeTruthy();
    expect(screen.getAllByText("1 selected").length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Delete" }).at(-1) as Element,
    );
    expect(deleted).toEqual(["a"]);
  });
});

function mountWithDelete(onDelete: (ids: ReadonlyArray<string>) => void) {
  const rootRoute = createRootRoute({
    component: () => (
      <ThreadsPageView
        threads={[thread("a", "First thread"), thread("b", "Second thread")]}
        captains={[]}
        projects={[]}
        folders={[]}
        viewerId="user_me"
        loading={false}
        failed={false}
        onDelete={onDelete}
        state={defaultThreadsPageState}
        onStateChange={() => {}}
        now={new Date(2026, 10, 17).getTime()}
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/threads"] }),
  });
  return router.load().then(() => render(<RouterProvider router={router} />));
}
