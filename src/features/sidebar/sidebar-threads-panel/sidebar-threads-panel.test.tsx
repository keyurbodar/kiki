import { RegistryContext } from "@effect/atom-react";
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
  waitFor,
} from "@testing-library/react";
import { Option } from "effect";
import { AsyncResult, AtomRegistry } from "effect/reactivity";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PullRequestId } from "@/data/api/schemas/ids";
import type { ThreadCard } from "@/data/api/schemas/thread";
import { threadAtom } from "@/data/atoms/jams";
import { organizationsAtom } from "@/data/atoms/session";
import { foldersAtom } from "@/data/atoms/threadOrganization";
import {
  buildSidebarThreadsView,
  defaultSidebarPrefs,
  type SidebarSource,
  type SourceCaptain,
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

const source = (
  threads: SourceThread[],
  captains: SourceCaptain[] = [],
): SidebarSource => ({
  now,
  threads,
  folders: [],
  projects: [],
  captains,
  activeId: null,
});

const captain = (patch: Partial<SourceCaptain> = {}): SourceCaptain => ({
  id: "jam_sample_cap1",
  name: "Release captain",
  avatar: { kind: "preset", value: "capy-avatar-1", background: "#ffffff" },
  status: "idle",
  needsYou: false,
  ask: null,
  preview: null,
  hasUnreads: false,
  crewMentionCount: 0,
  position: 0,
  createdAt: ago(9),
  updatedAt: ago(2),
  ...patch,
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
  return router;
};

const renderWithRegistry = async (node: ReactNode) => {
  const registry = AtomRegistry.make();
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <RegistryContext.Provider value={registry}>
      <RouterProvider router={router} />
    </RegistryContext.Provider>,
  );
  await router.load();
  return registry;
};
const orgId = (registry: AtomRegistry.AtomRegistry) =>
  Option.getOrUndefined(AsyncResult.value(registry.get(organizationsAtom)))?.[0]
    ?.id;

const openThreadOptions = () =>
  fireEvent.click(screen.getByLabelText("Thread options"));

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

describe("sidebar row menu mutations", () => {
  it("settles the thread through the mock API when Settle is clicked", async () => {
    const registry = await renderWithRegistry(
      <Harness sidebarSource={source([thread()])} />,
    );
    fireEvent.contextMenu(rowLink());
    fireEvent.click(await screen.findByText("Settle"));
    await waitFor(() => {
      const org = orgId(registry);
      if (org === undefined) throw new Error("no org yet");
      const card = Option.getOrUndefined(
        AsyncResult.value(registry.get(threadAtom(`${org}/jam_sample_2`))),
      );
      expect(card?.settledAt).not.toBeNull();
    });
  });

  it("asks for confirmation before deleting", async () => {
    await renderWithRegistry(
      <Harness sidebarSource={source([thread({ owner: true })])} />,
    );
    fireEvent.contextMenu(rowLink());
    fireEvent.click(await screen.findByText("Delete"));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Delete thread");
    expect(dialog.textContent).toContain("Add dark mode to settings");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });
});

describe("sidebar row menu", () => {
  it("opens Capy's row menu on right-click and opens the thread in a new tab", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    await renderAt(<Harness sidebarSource={source([thread()])} />);
    fireEvent.contextMenu(rowLink());
    expect(await screen.findByText("Open in new tab")).toBeTruthy();
    expect(screen.getByText("Copy link")).toBeTruthy();
    fireEvent.click(screen.getByText("Open in new tab"));
    expect(openSpy).toHaveBeenCalledWith("/thread/jam_sample_2", "_blank");
    openSpy.mockRestore();
  });

  it("opens nothing when the right-click misses a row", async () => {
    await renderAt(<Harness sidebarSource={source([thread()])} />);
    const list = document.querySelector("[role=list]");
    if (list === null) throw new Error("no list");
    fireEvent.contextMenu(list);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.queryByText("Open in new tab")).toBeNull();
  });
});

describe("sidebar captain row menu", () => {
  const captainRow = () => {
    const row = document.querySelector("[data-captain-row]");
    if (row === null) throw new Error("no captain row");
    return row;
  };

  it("opens Capy's Captain menu on right-click, in Capy's order", async () => {
    await renderAt(<Harness sidebarSource={source([thread()], [captain()])} />);
    fireEvent.contextMenu(captainRow());
    await screen.findByText("Open in new tab");
    const labels = [...document.querySelectorAll("[role=menuitem]")].map(
      (item) => item.textContent?.trim(),
    );
    expect(labels).toEqual([
      "Open in new tab",
      "Profile",
      "Share",
      "Pin",
      "Move to",
      "Mark as unread",
      "Archive",
      "Demote to thread",
      "Delete",
    ]);
  });

  it("asks before deleting a Captain", async () => {
    await renderAt(<Harness sidebarSource={source([thread()], [captain()])} />);
    fireEvent.contextMenu(captainRow());
    fireEvent.click(await screen.findByText("Delete"));
    expect(await screen.findByText(/deleted for everyone/)).toBeTruthy();
  });
});

describe("sidebar row action cluster", () => {
  it("mounts the cluster on the row so hovering it reveals Capy's actions", async () => {
    await renderAt(<Harness sidebarSource={source([thread()])} />);
    const row = rowLink().closest("[data-drag-row]");
    expect(row?.querySelector('[aria-label="Settle"]')).not.toBeNull();
    expect(row?.querySelector('[aria-label="Archive thread"]')).not.toBeNull();
    expect(row?.querySelector('[aria-label="Thread actions"]')).not.toBeNull();
    expect(row?.querySelector("span.mask-fade-l")).not.toBeNull();
  });

  it("hides the cluster on settled rows and offers un-settle instead", async () => {
    await renderAt(
      <Harness sidebarSource={source([thread({ settled: true })])} />,
    );
    fireEvent.click(screen.getByText("Settled"));
    const row = rowLink().closest("[data-drag-row]");
    expect(row?.querySelector('[aria-label="Settle"]')).toBeNull();
    expect(row?.querySelector('[aria-label="Un-settle"]')).not.toBeNull();
  });
});

describe("sidebar row menu", () => {
  it("renders Capy's items in Capy's order", async () => {
    await renderAt(
      <Harness
        sidebarSource={source([thread({ owner: true, hasUnreads: false })])}
      />,
    );
    fireEvent.contextMenu(rowLink());
    await screen.findByText("Open in new tab");
    const labels = [...document.querySelectorAll("[role=menuitem]")].map(
      (item) => item.textContent?.trim(),
    );
    expect(labels).toEqual([
      "Share",
      "Open in new tab",
      "Pin",
      "Move to",
      "Tags",
      "Promote to Captain",
      "Rename",
      "Regenerate title",
      "Copy link",
      "Mark as unread",
      "Settle",
      "Archive",
      "Delete",
    ]);
  });

  it("keeps owner-only items but disables them on a thread the viewer does not own", async () => {
    await renderAt(
      <Harness sidebarSource={source([thread({ owner: false })])} />,
    );
    fireEvent.contextMenu(rowLink());
    await screen.findByText("Rename");
    const rename = screen.getByText("Rename").closest("[role=menuitem]");
    expect(rename?.getAttribute("aria-disabled")).toBe("true");
    expect(screen.queryByText("Promote to Captain")).toBeNull();
    expect(screen.queryByText("Delete")).toBeTruthy();
  });

  it("offers mark as read on an unread thread", async () => {
    await renderAt(
      <Harness sidebarSource={source([thread({ hasUnreads: true })])} />,
    );
    fireEvent.contextMenu(rowLink());
    await screen.findByText("Mark as read");
    expect(screen.queryByText("Mark as unread")).toBeNull();
  });
});

describe("thread options menu", () => {
  it("renders Capy's header controls instead of hiding the unmounted ones", async () => {
    await renderAt(<Harness sidebarSource={source([thread()])} />);
    openThreadOptions();
    expect(await screen.findByText("New folder")).toBeTruthy();
    expect(screen.getByText("Mark all as read")).toBeTruthy();
    expect(screen.getByText("Filters")).toBeTruthy();
    expect(screen.getByText("View all threads")).toBeTruthy();
  });

  it("offers only the origins the list actually carries", async () => {
    await renderAt(
      <Harness
        sidebarSource={source([
          thread(),
          thread({ id: "jam_sample_9", origin: "slack" }),
        ])}
      />,
    );
    openThreadOptions();
    const filters = await screen.findByText("Filters");
    fireEvent.pointerMove(filters);
    fireEvent.click(filters);
    expect(await screen.findByText("Web")).toBeTruthy();
    expect(screen.getByText("Slack")).toBeTruthy();
    expect(screen.queryByText("Linear")).toBeNull();
  });

  it("creates a folder through the mock API from New folder", async () => {
    const registry = await renderWithRegistry(
      <Harness sidebarSource={source([thread()])} />,
    );
    openThreadOptions();
    fireEvent.click(await screen.findByText("New folder"));
    const input = (await screen.findByLabelText(
      "Folder name",
    )) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Release train" } });
    fireEvent.click(screen.getByRole("button", { name: "Create folder" }));
    await waitFor(() => {
      const org = orgId(registry);
      if (org === undefined) throw new Error("no org yet");
      const folders = Option.getOrUndefined(
        AsyncResult.value(registry.get(foldersAtom(org))),
      );
      expect(folders?.some((folder) => folder.name === "Release train")).toBe(
        true,
      );
    });
  });

  it("sends View all threads to the thread list", async () => {
    const router = await renderAt(
      <Harness sidebarSource={source([thread()])} />,
    );
    openThreadOptions();
    fireEvent.click(await screen.findByText("View all threads"));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/threads"),
    );
  });
});

describe("captain options menu", () => {
  it("renders New folder beside sort and density", async () => {
    await renderAt(<Harness sidebarSource={source([thread()])} />);
    fireEvent.click(screen.getByLabelText("Captain options"));
    expect(await screen.findByText("New folder")).toBeTruthy();
    expect(screen.getByText("Sort by")).toBeTruthy();
  });
});

describe("sidebar thread list scroll area", () => {
  it("scrolls the list through the scroll-area primitive", async () => {
    await renderAt(<Harness sidebarSource={source([thread()])} />);
    const list = document.querySelector("[role=list]");
    expect(list?.closest("[data-slot=scroll-area-viewport]")).not.toBeNull();
  });
});
