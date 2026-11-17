import { describe, expect, it } from "vitest";
import {
  buildSidebarThreadsView,
  defaultSidebarPrefs,
  formatAge,
  GROUP_ROW_LIMIT,
  type SidebarPrefs,
  type SidebarSource,
  type SourceThread,
} from "./build-view";

const now = new Date("2026-01-10T12:00:00Z");
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000);

const thread = (
  id: string,
  patch: Partial<SourceThread> = {},
): SourceThread => ({
  id,
  title: id,
  status: "idle",
  needsYou: false,
  ask: null,
  hasUnreads: false,
  projectId: null,
  machine: null,
  settled: false,
  createdAt: hoursAgo(10),
  updatedAt: hoursAgo(1),
  ...patch,
});

const source = (patch: Partial<SidebarSource> = {}): SidebarSource => ({
  now,
  threads: [],
  folders: [],
  projects: [],
  captains: [],
  activeId: null,
  ...patch,
});

const prefs = (patch: Partial<SidebarPrefs> = {}): SidebarPrefs => ({
  ...defaultSidebarPrefs,
  ...patch,
});

describe("formatAge", () => {
  it("uses Capy's short units", () => {
    const ago = (ms: number) => formatAge(new Date(now.getTime() - ms), now);
    expect(ago(1000)).toBe("now");
    expect(ago(30_000)).toBe("30s");
    expect(ago(5 * 60_000)).toBe("5m");
    expect(ago(3 * 3_600_000)).toBe("3h");
    expect(ago(2 * 86_400_000)).toBe("2d");
    expect(ago(14 * 86_400_000)).toBe("2w");
    expect(ago(400 * 86_400_000)).toBe("1y");
  });
});

describe("buildSidebarThreadsView", () => {
  it("puts pinned folders first, then folders, recent and the shelves", () => {
    const view = buildSidebarThreadsView(
      source({
        threads: [
          thread("a"),
          thread("b"),
          thread("c", { status: "working" }),
          thread("d", { settled: true }),
          thread("e"),
        ],
        folders: [
          { id: "f1", name: "Later", systemKind: null, threadIds: ["b"] },
          { id: "pin", name: null, systemKind: "pinned", threadIds: ["a"] },
        ],
      }),
      prefs(),
    );
    expect(view.sections.map((s) => [s.id, s.kind, s.label, s.count])).toEqual([
      ["folder:pin", "pinned", "Pinned", 1],
      ["folder:f1", "folder", "Later", 1],
      ["threads:recent", "recent", "Recent", 1],
      ["closed:shelf:working", "working", "Working", 1],
      ["closed:shelf:settled", "settled", "Settled", 1],
    ]);
    const shelves = view.sections.slice(3);
    expect(shelves.every((s) => !s.open && s.countAtRest)).toBe(true);
  });

  it("drops archived threads and threads missing from folders", () => {
    const view = buildSidebarThreadsView(
      source({
        threads: [thread("a", { status: "archived" }), thread("b")],
        folders: [
          { id: "f", name: "F", systemKind: null, threadIds: ["a", "zz"] },
        ],
      }),
      prefs(),
    );
    expect(view.sections[0]?.count).toBe(0);
    expect(view.sections[1]?.threads.map((t) => t.id)).toEqual(["b"]);
  });

  it("sorts by last active or created and limits groups until expanded", () => {
    const threads = Array.from({ length: GROUP_ROW_LIMIT + 3 }, (_, i) =>
      thread(`t${i}`, { updatedAt: hoursAgo(i), createdAt: hoursAgo(100 - i) }),
    );
    const recent = (p: SidebarPrefs) =>
      buildSidebarThreadsView(source({ threads }), p).sections[0];
    const byActive = recent(prefs());
    expect(byActive?.threads[0]?.id).toBe("t0");
    expect(byActive?.threads).toHaveLength(GROUP_ROW_LIMIT);
    expect(byActive?.hidden).toBe(3);
    expect(recent(prefs({ sort: "createdAt" }))?.threads[0]?.id).toBe("t12");
    const expanded = recent(prefs({ expanded: { "threads:recent": true } }));
    expect(expanded?.threads).toHaveLength(GROUP_ROW_LIMIT + 3);
    expect(expanded?.hidden).toBe(0);
  });

  it("groups loose threads by project when grouping is projects", () => {
    const view = buildSidebarThreadsView(
      source({
        projects: [{ id: "p1", name: "web-app", logoUrl: null }],
        threads: [thread("a", { projectId: "p1" }), thread("b")],
      }),
      prefs({ grouping: "projects" }),
    );
    expect(view.sections.slice(0, 2).map((s) => [s.id, s.label])).toEqual([
      ["project:p1", "web-app"],
      ["project:none", "No project"],
    ]);
  });

  it("honours collapse prefs and per-section open state", () => {
    const view = buildSidebarThreadsView(
      source({ threads: [thread("a")] }),
      prefs({
        collapse: { working: false, settled: true },
        open: { "threads:recent": false },
      }),
    );
    const open = Object.fromEntries(view.sections.map((s) => [s.id, s.open]));
    expect(open).toEqual({
      "threads:recent": false,
      "closed:shelf:working": true,
      "closed:shelf:settled": false,
    });
  });

  it("orders captains by the chosen sort and hides archived ones", () => {
    const captain = (
      id: string,
      position: number,
      updated: number,
      created: number,
    ) => ({
      id,
      name: id,
      avatarUrl: null,
      status: "idle" as const,
      needsYou: false,
      ask: null,
      preview: null,
      hasUnreads: false,
      crewMentionCount: 0,
      position,
      createdAt: hoursAgo(created),
      updatedAt: hoursAgo(updated),
    });
    const captains = [
      captain("x", 2, 1, 5),
      captain("y", 0, 3, 1),
      captain("z", 1, 2, 9),
      { ...captain("gone", 3, 0, 0), status: "archived" as const },
    ];
    const order = (captainSort: SidebarPrefs["captainSort"]) =>
      buildSidebarThreadsView(
        source({ captains }),
        prefs({ captainSort }),
      ).captains.map((c) => c.id);
    expect(order("activity")).toEqual(["x", "z", "y"]);
    expect(order("createdAt")).toEqual(["y", "x", "z"]);
    expect(order("drag")).toEqual(["y", "z", "x"]);
    expect(
      buildSidebarThreadsView(source({ captains }), prefs()).captains[0]?.age,
    ).toBe("1h");
  });
});
