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
import { afterEach, describe, expect, it, vi } from "vitest";
import { failMockRequests } from "@/data/mocks/failure";
import { ThreadScreen } from "@/features/thread/thread-route/thread-route";
import type { OverviewPull } from "@/features/thread-panes/overview/model";
import { searchParams } from "@/lib/search-params";
import { ThreadSummaryBody } from "./thread-summary-pane";

const noop = () => undefined;
const now = new Date("2026-11-18T12:00:00Z").getTime();

afterEach(() => {
  failMockRequests(null);
  cleanup();
});

const pull = (): OverviewPull => ({
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
});

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

describe("the summary's crew section", () => {
  it("says the crew did not load and keeps the rest of the pane", () => {
    body({ threadsFailed: true, pulls: [pull()] });
    expect(screen.getByText("Couldn't load this thread's crew")).toBeTruthy();
    expect(
      document.querySelector('[data-slot="thread-summary-crew-failed"]'),
    ).not.toBeNull();
    // A failed crew read used to drop the section, so the thread looked
    // crewless. The other sections must keep painting around it.
    expect(screen.getByText("Threads")).toBeTruthy();
    expect(screen.getByText("Pull requests")).toBeTruthy();
    expect(screen.getByText("web#128")).toBeTruthy();
  });

  it("re-runs the crew read from the failed state's Retry", () => {
    const retry = vi.fn();
    body({ threadsFailed: true, onRetryThreads: retry });
    fireEvent.click(screen.getByText("Retry"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("keeps the failed state out of a body whose crew loaded", () => {
    body({ pulls: [pull()] });
    expect(
      document.querySelector('[data-slot="thread-summary-crew-failed"]'),
    ).toBeNull();
    expect(screen.queryByText("Couldn't load this thread's crew")).toBeNull();
  });
});

async function renderThread(path: string) {
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

const failedCrew = (captain: string) =>
  failMockRequests(new RegExp(`/captains/${captain}/crew$`));

describe("the summary pane route", () => {
  it("surfaces a Captain's failed crew read in its section only", async () => {
    failedCrew("jam_sample_cap1");
    await renderThread("/thread/jam_sample_cap1?pane=chat");
    await waitFor(
      () =>
        expect(
          document.querySelector(
            '[data-section="threads"] [data-slot="thread-summary-crew-failed"]',
          ),
        ).not.toBeNull(),
      { timeout: 4000 },
    );
    expect(
      document.querySelector('[data-slot="thread-summary-pane"]'),
    ).not.toBeNull();
  });

  it("does not invent a crew failure on a thread that is not a Captain", async () => {
    failMockRequests(/\/crew$/);
    await renderThread("/thread/jam_sample_0001?pane=chat");
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-slot="thread-summary-pane"]'),
        ).not.toBeNull(),
      { timeout: 4000 },
    );
    expect(
      document.querySelector('[data-slot="thread-summary-crew-failed"]'),
    ).toBeNull();
  });

  it("refills the section when the retry lands", async () => {
    failedCrew("jam_sample_cap1");
    await renderThread("/thread/jam_sample_cap1?pane=chat");
    const retry = await screen.findByText("Retry", undefined, {
      timeout: 4000,
    });
    failMockRequests(null);
    fireEvent.click(retry);
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-slot="thread-summary-thread-row"]'),
        ).not.toBeNull(),
      { timeout: 4000 },
    );
    expect(
      document.querySelector('[data-slot="thread-summary-crew-failed"]'),
    ).toBeNull();
  });
});
