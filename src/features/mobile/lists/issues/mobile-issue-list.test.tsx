import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { Schema } from "effect";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import type { OrgId } from "@/data/api/schemas/ids";
import type { IssueState, IssueSummary } from "@/data/api/schemas/issue";
import {
  IssueState as IssueStateSchema,
  IssueSummary as IssueSummarySchema,
} from "@/data/api/schemas/issue";
import { MobileIssueList } from "./mobile-issue-list";

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

const decodeIssue = Schema.decodeUnknownSync(IssueSummarySchema);
const decodeState = Schema.decodeUnknownSync(IssueStateSchema);

const state = (id: string, type: "open" | "closed", position: number) =>
  decodeState({
    id,
    name: id === "open" ? "Todo" : "Done",
    type,
    icon: "circlecheck",
    color: "green",
    position,
    isDefault: false,
  }) as IssueState;

const states = [state("open", "open", 1), state("closed", "closed", 2)];

const issue = (id: string, stateId: string, title: string) =>
  decodeIssue({
    id,
    code: id.toUpperCase(),
    number: 1,
    projectId: "prj_sample",
    title,
    status: "todo",
    stateId,
    priority: "normal",
    parentIssueId: null,
    visibility: "org",
    accessJamId: null,
    assignee: null,
    subIssueCount: 0,
    closedSubIssueCount: 0,
    viewer: {
      subscribed: false,
      unread: false,
      unreadSince: null,
      mentions: 0,
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    closedAt: null,
  }) as IssueSummary;

const issues = [
  issue("SAMPLE-1", "open", "Sample issue"),
  issue("SAMPLE-2", "closed", "Finished issue"),
];

const display = {
  order: "priority",
  direction: "asc",
  grouping: "status",
  subIssues: "expanded",
  hidden: [],
  density: "comfortable",
} as unknown as Parameters<typeof MobileIssueList>[0]["display"];

const filters = { stateIds: [], stateNot: false, hideClosedSubIssues: false };

const renderList = async (
  props: Partial<Parameters<typeof MobileIssueList>[0]> = {},
  ready: RegExp | string | null = /Todo/,
) => {
  const root = createRootRoute({
    component: () => (
      <RegistryProvider>
        <MobileIssueList
          orgId={"org_sample" as OrgId}
          issues={issues}
          states={states}
          filters={filters}
          display={display}
          projectNames={{}}
          now={Date.now()}
          emptyText="No issues match these filters"
          {...props}
        />
      </RegistryProvider>
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/issues"] }),
  });
  render(<RouterProvider router={router} />);
  if (ready === null) await screen.findByText("No issues match these filters");
  else await screen.findByRole("button", { name: ready });
};

it("groups issues into collapsible state sections", async () => {
  await renderList();
  const todo = screen.getByRole("button", { name: /Todo/ });
  expect(todo.getAttribute("data-slot")).toBe("collapsible-trigger");
  const row = screen.getByText("Sample issue").closest("[data-issue-row]");
  expect(row?.getAttribute("data-issue-code")).toBe("SAMPLE-1");
});

it("starts closed-state sections collapsed", async () => {
  await renderList();
  const done = screen.getByRole("button", { name: /Done/ });
  expect(done.getAttribute("data-panel-open")).toBeNull();
  expect(screen.queryByText("Finished issue")).toBeNull();
});

it("writes the empty line when the filters match nothing", async () => {
  await renderList({ issues: [] }, null);
  expect(await screen.findByText("No issues match these filters")).toBeTruthy();
});

it("renders nothing above the narrow breakpoint", async () => {
  narrow = false;
  const root = createRootRoute({
    component: () => (
      <RegistryProvider>
        <p>page body</p>
        <MobileIssueList
          orgId={"org_sample" as OrgId}
          issues={issues}
          states={states}
          filters={filters}
          display={display}
          projectNames={{}}
          now={Date.now()}
          emptyText="No issues match these filters"
        />
      </RegistryProvider>
    ),
  });
  const page = createRoute({ getParentRoute: () => root, path: "$" });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/issues"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByText("page body");
  expect(screen.queryByText("Todo")).toBeNull();
});
