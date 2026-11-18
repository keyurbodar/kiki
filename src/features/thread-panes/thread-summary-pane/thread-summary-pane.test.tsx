import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CrewThread } from "@/features/captains/overview";
import { ThreadScreen } from "@/features/thread/thread-route/thread-route";
import type {
  OverviewPull,
  OverviewTask,
} from "@/features/thread-panes/overview/model";
import { searchParams } from "@/lib/search-params";
import { crewMeta, inProgressIssues, issueMeta, subagentMeta } from "./model";
import { ThreadSummaryBody } from "./thread-summary-pane";

const noop = () => undefined;

afterEach(cleanup);

const crewThread = (overrides: Partial<CrewThread> = {}): CrewThread => ({
  id: "jam_crew1",
  title: "Dock the summary pane",
  code: "DOCK-5",
  status: "working",
  needsYou: false,
  unread: false,
  modelName: null,
  pulls: [{ number: 12, state: "ready" }],
  pullCount: 2,
  createdAt: new Date("2026-11-18T09:00:00Z"),
  lastActivityAt: new Date("2026-11-18T11:59:41Z"),
  updatedAt: new Date("2026-11-18T11:59:41Z"),
  ...overrides,
});

const subagent = (overrides: Partial<OverviewTask> = {}): OverviewTask => ({
  id: "jam_sub1",
  parentJamId: "jam_parent",
  relationType: "task",
  localIndex: 2,
  title: "Add the retry budget",
  status: "working",
  modelId: null,
  machine: null,
  createdAt: new Date("2026-11-18T11:59:00Z"),
  lastActivityAt: new Date("2026-11-18T11:59:09Z"),
  ...overrides,
});

const pull = (overrides: Partial<OverviewPull> = {}): OverviewPull => ({
  id: "pr_1",
  jamId: null,
  threadId: "jam_parent",
  number: 128,
  url: "https://github.com/acme/web/pull/128",
  repo: "acme/web",
  title: "Add dark mode to settings",
  state: "ready",
  baseRef: "main",
  headRef: "feat/dark-mode",
  additions: 1300,
  deletions: 1121,
  createdAt: new Date("2026-11-18T11:00:00Z"),
  ...overrides,
});

const now = new Date("2026-11-18T12:00:00Z").getTime();

const body = (
  overrides: Partial<Parameters<typeof ThreadSummaryBody>[0]> = {},
) =>
  render(
    <ThreadSummaryBody
      inProgress={[]}
      threads={[]}
      subagents={[]}
      pulls={[]}
      now={now}
      sort="updated"
      onSort={noop}
      onOpenIssue={noop}
      onOpenThread={noop}
      onMessageThread={noop}
      onRemoveThread={noop}
      onArchiveThread={noop}
      onOpenSubagent={noop}
      onOpenPull={noop}
      {...overrides}
    />,
  );

describe("ThreadSummaryBody", () => {
  it("renders the four sections in Capy's order with their counts", () => {
    body({
      inProgress: [
        {
          id: "iss_1",
          code: "AMA-177",
          title: "Wire the pane",
          assignee: "DOCK-3",
        },
      ],
      threads: [crewThread()],
      subagents: [subagent()],
      pulls: [pull()],
    });
    const labels = [...document.querySelectorAll("[data-section]")].map(
      (section) => section.getAttribute("data-section"),
    );
    expect(labels).toEqual(["in_progress", "threads", "subagents", "pulls"]);
    expect(screen.getByText("In progress")).toBeTruthy();
    expect(screen.getByText("Threads")).toBeTruthy();
    expect(screen.getByText("Subagents")).toBeTruthy();
    expect(screen.getByText("Pull requests")).toBeTruthy();
  });

  it("renders no section at all when it has no rows", () => {
    body({ threads: [crewThread()] });
    expect(screen.getByText("Threads")).toBeTruthy();
    expect(screen.queryByText("In progress")).toBeNull();
    expect(screen.queryByText("Subagents")).toBeNull();
    expect(screen.queryByText("Pull requests")).toBeNull();
  });

  it("prints the captured row anatomy: title, dot, meta", () => {
    body({ threads: [crewThread()] });
    const row = document.querySelector(
      '[data-slot="thread-summary-thread-row"]',
    );
    expect(row?.className).toContain("px-2");
    expect(screen.getByText("Dock the summary pane")).toBeTruthy();
    expect(screen.getByText("DOCK-5 · 19s · 2 PRs")).toBeTruthy();
    expect(row?.querySelector(".rounded-full")).not.toBeNull();
  });

  it("gives the pull section its sort control and its diff chip", () => {
    body({ pulls: [pull()] });
    expect(screen.getByLabelText("Sort pull requests")).toBeTruthy();
    expect(screen.getByText("+1300")).toBeTruthy();
    expect(screen.getByText("-1121")).toBeTruthy();
    expect(screen.getByText("main ← feat/dark-mode")).toBeTruthy();
    expect(screen.getByText("web#128")).toBeTruthy();
  });

  it("offers the crew row's four actions", async () => {
    body({ threads: [crewThread()] });
    const row = document.querySelector(
      '[data-slot="thread-summary-thread-row"]',
    );
    if (row === null) throw new Error("No thread row");
    row.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
      }),
    );
    for (const label of [
      "Open as its own thread",
      "Message thread",
      "Remove from crew",
      "Archive thread",
    ]) {
      expect(await screen.findByText(label)).toBeTruthy();
    }
  });
});

describe("summary row meta", () => {
  it("prints the crew thread's code, age and pull count", () => {
    expect(crewMeta(crewThread(), now)).toBe("DOCK-5 · 19s · 2 PRs");
    expect(crewMeta(crewThread({ pullCount: 1 }), now)).toBe(
      "DOCK-5 · 19s · 1 PR",
    );
    expect(
      crewMeta(
        crewThread({ code: "DOCK-2", pullCount: 0, lastActivityAt: null }),
        now,
      ),
    ).toBe("DOCK-2 · 19s");
    expect(
      crewMeta(
        crewThread({
          code: null,
          pullCount: 0,
          updatedAt: new Date(0),
          lastActivityAt: null,
        }),
        now,
      ),
    ).toBe("");
  });

  it("prints the issue and the thread working it", () => {
    expect(
      issueMeta({
        id: "iss_1",
        code: "AMA-177",
        title: "Wire the pane",
        assignee: "DOCK-3",
      }),
    ).toBe("AMA-177 with DOCK-3");
  });

  it("prints the subagent's number and age", () => {
    expect(subagentMeta(subagent(), 0, now)).toBe("Subagent 2 · 51s");
    expect(subagentMeta(subagent({ localIndex: null }), 0, now)).toBe(
      "Subagent 1 · 51s",
    );
  });
});

describe("inProgressIssues", () => {
  const issue = (code: string, status: "in_progress" | "done") => ({
    code,
    title: `${code} title`,
    status,
    assignee: { kind: "jam" as const, code: "DOCK-3", name: "Dock thread" },
  });

  it("keeps the crew's in-progress issues and names their holder", () => {
    const rows = inProgressIssues(
      { items: [{ id: "iss_1", code: "AMA-177" }] },
      [issue("AMA-177", "in_progress"), issue("AMA-178", "done")] as never,
    );
    expect(rows).toEqual([
      {
        id: "iss_1",
        code: "AMA-177",
        title: "AMA-177 title",
        assignee: "DOCK-3",
      },
    ]);
  });

  it("answers nothing when the activity did not load", () => {
    expect(inProgressIssues(undefined, [])).toEqual([]);
  });
});

describe("the chat pane route", () => {
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

  it("mounts the summary dock from ?pane=chat and keeps the param", async () => {
    const router = await renderRoute("/thread/jam_sample_0001?pane=chat");
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-slot="thread-summary-pane"]'),
        ).not.toBeNull(),
      { timeout: 3000 },
    );
    expect(
      document.querySelector('[data-pane-tab="chat"] [data-selected]'),
    ).not.toBeNull();
    expect(router.state.location.search).toEqual({ pane: "chat" });
  });

  it("keeps the chat tab out of the dock's strip", async () => {
    await renderRoute("/thread/jam_sample_0001?pane=chat");
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-slot="thread-summary-pane"]'),
        ).not.toBeNull(),
      { timeout: 3000 },
    );
    expect(
      document.querySelector(
        '[data-slot="thread-dock-header"] [data-pane-tab]',
      ),
    ).toBeNull();
  });
});
