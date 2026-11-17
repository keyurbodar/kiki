import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import type { ThreadListItem } from "@/features/threads/threads-page/model";
import { MobileThreadList } from "./mobile-thread-list";

let narrow = true;

beforeAll(() => {
  document.documentElement.style.setProperty("--breakpoint-md", "48rem");
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    get matches() {
      return narrow;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  cleanup();
  narrow = true;
});

const thread = (id: string, title: string): ThreadListItem => ({
  id,
  title,
  status: "idle",
  archived: false,
  archivedIdleDays: null,
  threadNumber: 1,
  userId: "user_a",
  participated: true,
  origin: "web",
  projectId: null,
  pinned: false,
  needsYou: false,
  hasUnreads: false,
  personal: false,
  lastModelId: null,
  pulls: [],
  createdAt: new Date("2026-01-01T00:00:00Z"),
  sortActivityAt: new Date("2026-01-01T00:00:00Z"),
  lastActivityAt: new Date("2026-01-01T00:00:00Z"),
  settledAt: null,
  automationName: null,
  automationId: null,
  captain: null,
});

const sections = [
  {
    id: "pinned",
    label: "Pinned",
    members: [thread("t1", "Sample thread")],
    showCount: true,
  },
  {
    id: "closed:older",
    label: "Older",
    members: [thread("t2", "Second sample")],
    showCount: true,
  },
];

const renderList = async (
  props: Partial<Parameters<typeof MobileThreadList>[0]> = {},
) => {
  const root = createRootRoute({
    component: () => (
      <MobileThreadList
        sections={sections}
        projects={new Map()}
        modelName={() => undefined}
        groupedByProject={false}
        now={Date.now()}
        loading={false}
        emptyText="No threads yet"
        checked={new Set()}
        onCheckedChange={() => {}}
        {...props}
      />
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/threads"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByRole("button", { name: /Pinned/ });
};

it("draws collapsible sections with their rows on phones", async () => {
  await renderList();
  const pinned = screen.getByRole("button", { name: /Pinned/ });
  expect(pinned.getAttribute("data-slot")).toBe("collapsible-trigger");
  expect(screen.getByText("Sample thread")).toBeTruthy();
  expect(
    screen.getByText("Sample thread").closest("[data-thread-row]"),
  ).not.toBeNull();
});

it("keeps sections whose id marks them closed collapsed", async () => {
  await renderList();
  const older = screen.getByRole("button", { name: /Older/ });
  expect(older.getAttribute("data-panel-open")).toBeNull();
  expect(screen.queryByText("Second sample")).toBeNull();
});

it("writes the empty line when there are no sections", async () => {
  const root = createRootRoute({
    component: () => (
      <MobileThreadList
        sections={[]}
        projects={new Map()}
        modelName={() => undefined}
        groupedByProject={false}
        now={Date.now()}
        loading={false}
        emptyText="No threads match these filters"
        checked={new Set()}
        onCheckedChange={() => {}}
      />
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/threads"] }),
  });
  render(<RouterProvider router={router} />);
  expect(
    await screen.findByText("No threads match these filters"),
  ).toBeTruthy();
});

it("renders nothing above the narrow breakpoint", async () => {
  narrow = false;
  const root = createRootRoute({
    component: () => (
      <>
        <p>page body</p>
        <MobileThreadList
          sections={sections}
          projects={new Map()}
          modelName={() => undefined}
          groupedByProject={false}
          now={Date.now()}
          loading={false}
          emptyText="No threads yet"
          checked={new Set()}
          onCheckedChange={() => {}}
        />
      </>
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/threads"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByText("page body");
  expect(screen.queryByText("Sample thread")).toBeNull();
  expect(screen.queryByText("Pinned")).toBeNull();
});
