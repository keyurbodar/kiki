import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PullRequestId } from "@/data/api/schemas/ids";
import type { ThreadCard } from "@/data/api/schemas/thread";
import {
  buildSidebarThreadsView,
  defaultSidebarPrefs,
  type SidebarSource,
  type SourceThread,
  useSidebarThreads,
} from "../sidebar-threads-data";
import { SidebarThreadsPanel } from "./sidebar-threads-panel";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const now = new Date("2026-01-10T12:00:00Z");
const ago = (hours: number) => new Date(now.getTime() - hours * 3_600_000);

const card = (overrides: Partial<ThreadCard> = {}) =>
  ({
    id: "jam_sample_2",
    title: "Add dark mode to settings",
    status: "idle",
    archived: false,
    origin: "web",
    primaryMachine: null,
    needsYou: false,
    ask: null,
    preview: null,
    personal: false,
    pulls: [],
    ...overrides,
  }) as unknown as ThreadCard;

const thread = (patch: Partial<SourceThread> = {}): SourceThread => ({
  id: "jam_sample_2",
  title: "Add dark mode to settings",
  status: "idle",
  needsYou: false,
  ask: null,
  hasUnreads: false,
  projectId: null,
  machine: null,
  settled: false,
  createdAt: ago(5),
  updatedAt: ago(1),
  ...patch,
});

const source = (threads: SourceThread[]): SidebarSource => ({
  now,
  threads,
  folders: [],
  projects: [],
  captains: [],
  activeId: null,
});

function Harness({ sidebarSource }: { sidebarSource: SidebarSource }) {
  const controller = useSidebarThreads({ source: sidebarSource });
  return <SidebarThreadsPanel controller={controller} />;
}

const renderAt = async (node: ReactNode) => {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  await router.load();
};

const rowLink = () => screen.getByRole("link", { name: /Add dark mode/ });

const open = () => fireEvent.focus(rowLink());

const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

describe("sidebar thread hover card", () => {
  it("wraps the row in a preview trigger and shows the thread preview", async () => {
    const pull = {
      id: PullRequestId.make("pr_sample_128"),
      repo: "acme/web",
      number: 128,
      title: "Add dark mode to settings",
      state: "ready" as const,
      additions: 42,
      deletions: 7,
      diffBreakdown: null,
      author: "alex-sample",
      authorAvatarUrl: "",
      url: "https://github.com/acme/web/pull/128",
    };
    await renderAt(
      <Harness
        sidebarSource={source([
          thread({
            card: card({ pulls: [pull] }),
            code: "WEB-40",
            description: "Settings needs the new palette.",
          }),
        ])}
      />,
    );
    const trigger = rowLink();
    expect(trigger.dataset.slot).toBe("sidebar-thread-row");
    open();
    expect(await screen.findByText("WEB-40")).toBeTruthy();
    expect(screen.getByText("Settings needs the new palette.")).toBeTruthy();
    expect(screen.getByText("Pull requests")).toBeTruthy();
    expect(screen.getByText("#128")).toBeTruthy();
  });

  it("opens no card for a row whose source carries no card", async () => {
    await renderAt(<Harness sidebarSource={source([thread()])} />);
    open();
    await settle();
    expect(
      document.querySelector("[data-slot=preview-card-content]"),
    ).toBeNull();
  });

  it("renders a bare card without inventing missing sections", async () => {
    await renderAt(
      <Harness sidebarSource={source([thread({ card: card() })])} />,
    );
    open();
    expect(await screen.findByText("Thread")).toBeTruthy();
    expect(
      document.querySelector("[data-slot=preview-card-content]"),
    ).not.toBeNull();
    for (const section of [
      "Issues",
      "Pull requests",
      "Subagents",
      "Crew",
      "Asks",
    ])
      expect(screen.queryByText(section)).toBeNull();
  });
});

describe("buildSidebarThreadsView preview data", () => {
  it("carries the optional preview fields through to the row", () => {
    const [row] = buildSidebarThreadsView(
      source([
        thread({
          card: card(),
          code: "WEB-40",
          description: "Settings needs the new palette.",
          multirepo: true,
        }),
      ]),
      defaultSidebarPrefs,
    ).sections.flatMap((section) => section.threads);
    expect(row?.card?.id).toBe("jam_sample_2");
    expect(row?.code).toBe("WEB-40");
    expect(row?.description).toBe("Settings needs the new palette.");
    expect(row?.multirepo).toBe(true);
    expect(row?.age).toBe("1h");
  });
});
