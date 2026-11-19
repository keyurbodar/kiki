import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  defaultThreadsPageState,
  filterThreads,
  type ThreadFilters,
  type ThreadListItem,
} from "./model";
import { prStatusOptions, ThreadsPageView } from "./threads-page";

afterEach(cleanup);

const thread = (
  id: string,
  options: {
    readonly state?: "ready" | "merged";
    readonly userId?: string;
  } = {},
): ThreadListItem => ({
  id,
  title: `Thread ${id}`,
  status: "idle",
  archived: false,
  archivedIdleDays: null,
  threadNumber: 1,
  userId: options.userId ?? "user_me",
  participated: true,
  origin: "web",
  projectId: null,
  pinned: false,
  needsYou: false,
  hasUnreads: false,
  personal: false,
  lastModelId: null,
  pulls:
    options.state === undefined
      ? []
      : [{ repo: "acme/web", number: 1, state: options.state }],
  createdAt: new Date(2026, 10, 17),
  sortActivityAt: new Date(2026, 10, 17),
  lastActivityAt: new Date(2026, 10, 17),
  settledAt: null,
  automationName: null,
  automationId: null,
  captain: null,
});

const threads = [
  thread("open", { state: "ready" }),
  thread("merged", { state: "merged", userId: "user_sam" }),
];

async function mount() {
  const rootRoute = createRootRoute({
    component: () => (
      <ThreadsPageView
        threads={threads}
        captains={[]}
        projects={[]}
        folders={[]}
        viewerId="user_me"
        loading={false}
        failed={false}
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
  await router.load();
  render(<RouterProvider router={router} />);
  fireEvent.click(screen.getByRole("button", { name: "Filter threads" }));
}

/** The menu's own subtree: the chip bar repeats the same labels outside it. */
const menu = () => {
  const content = document.querySelector('[data-slot="menu-content"]');
  if (content === null) throw new Error("the filter menu is not open");
  return within(content as HTMLElement);
};

describe("threads page filter menu", () => {
  it("offers Capy's axes, its inline search row and the PR states", async () => {
    await mount();
    // The trigger and the menu's own inline row share Capy's label.
    expect(screen.getAllByLabelText("Filter threads")).toHaveLength(2);
    for (const label of [
      "Participants",
      "Project",
      "Created by",
      "PR status",
      "Created",
    ])
      expect(menu().getByText(label)).toBeTruthy();
  });

  it("offers every pull state Capy's PR status names", () => {
    expect(prStatusOptions.map((option) => option.label)).toEqual([
      "None",
      "Open",
      "Draft",
      "Merged",
      "Closed",
    ]);
  });

  it("narrows the list through those axes, not just the state", () => {
    const idsWith = (filters: Partial<ThreadFilters>) =>
      filterThreads(
        threads,
        { ...defaultThreadsPageState.filters, ...filters },
        "user_me",
        new Date(2026, 10, 17).getTime(),
      ).map((item) => item.id);
    expect(idsWith({ prStates: ["merged"] })).toEqual(["merged"]);
    expect(idsWith({ prStates: ["ready"] })).toEqual(["open"]);
    expect(idsWith({ authors: ["user_sam"] })).toEqual(["merged"]);
    expect(idsWith({ prStates: ["none"] })).toEqual([]);
  });
});
