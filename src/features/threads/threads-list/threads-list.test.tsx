import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ThreadListItem } from "../threads-page/model";
import { ThreadsList } from "./threads-list";

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

type Sections = Parameters<typeof ThreadsList>[0]["sections"];

async function mount(sections: Sections) {
  const rootRoute = createRootRoute({
    component: () => (
      <ThreadsList
        sections={sections}
        projects={new Map()}
        modelName={() => undefined}
        groupedByProject={false}
        now={new Date(2026, 10, 17).getTime()}
        loading={false}
        emptyText="No threads yet"
        checked={new Set()}
        onCheckedChange={() => {}}
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

const rows = () => document.querySelectorAll("[data-thread-row]").length;

describe("threads list sections", () => {
  it("draws one row per member of an open section", async () => {
    await mount([
      {
        id: "all",
        label: "Active",
        members: [thread("a"), thread("b"), thread("c")],
        showCount: true,
      },
    ]);
    expect(rows()).toBe(3);
  });

  it("draws a closed section's rows once it is expanded", async () => {
    await mount([
      { id: "all", label: "Active", members: [thread("a")], showCount: true },
      {
        id: "closed:shelf:settled",
        label: "Settled",
        members: [thread("b"), thread("c")],
        showCount: true,
      },
    ]);
    expect(rows()).toBe(1);
    fireEvent.click(screen.getByText("Settled"));
    expect(rows()).toBe(3);
  });
});
