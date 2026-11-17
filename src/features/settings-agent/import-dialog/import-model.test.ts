import { describe, expect, it } from "vitest";
import {
  destinationLabel,
  destinationProjects,
  footerStatus,
  groupSessions,
  type ImportManifest,
  type ImportSession,
  placementRows,
  scopeManifest,
  selectableKeys,
  sessionsSummary,
  tildePath,
  toggleSelection,
} from "./import-model";

const session = (overrides: Partial<ImportSession>): ImportSession => ({
  source: "claude-code",
  sessionId: "s1",
  title: "Fix login form",
  endedAt: "2026-01-05T10:00:00.000Z",
  cwd: "/home/alex/acme/web",
  folderExists: true,
  repos: ["acme/web"],
  projectId: "project_web",
  projectName: "Acme Web",
  via: "linked",
  imported: false,
  updatable: false,
  ...overrides,
});

const manifest: ImportManifest = {
  versions: { claude: "2.1.0", codex: null },
  projects: [
    { id: "project_web", name: "Acme Web", repos: ["acme/web"] },
    { id: "project_api", name: "Acme API", repos: ["acme/api"] },
    { id: "project_dry_web", name: "Draft", repos: [] },
  ],
  sessions: [
    session({ sessionId: "w1" }),
    session({ sessionId: "w2", imported: true }),
    session({
      sessionId: "x1",
      via: "ambiguous",
      projectId: null,
      repos: ["Acme/Shared", "acme/tools"],
    }),
    session({
      sessionId: "f1",
      projectId: null,
      repos: [],
      cwd: "/Users/alex/scratch",
      folderExists: false,
    }),
    session({ sessionId: "f2", projectId: null, repos: [], cwd: "/tmp/notes" }),
    session({ sessionId: "f3", projectId: null, repos: [], cwd: "/tmp/notes" }),
  ],
};

describe("groupSessions", () => {
  const groups = groupSessions(manifest);

  it("puts ambiguous sessions first, then projects that have sessions", () => {
    expect(groups.projects.map((group) => group.id)).toEqual([
      "ambiguous:acme/shared,acme/tools",
      "project_web",
    ]);
    expect(groups.projects[0]).toMatchObject({
      name: "Shared",
      unresolved: true,
      existing: false,
    });
    expect(groups.projects[1]).toMatchObject({ existing: true });
    expect(groups.projects[1]?.sessions).toHaveLength(2);
  });

  it("groups the rest by folder, largest first, with home-relative paths", () => {
    expect(groups.folders.map((folder) => folder.key)).toEqual([
      "/tmp/notes",
      "/Users/alex/scratch",
    ]);
    expect(groups.folders[1]).toMatchObject({
      name: "scratch",
      path: "~/scratch",
      exists: false,
    });
  });

  it("keeps projects of locked sessions the org list lacks", () => {
    const locked = groupSessions({
      ...manifest,
      projects: [],
      sessions: [
        session({ sessionId: "u1", imported: true, projectName: null }),
      ],
    });
    expect(locked.projects[0]).toMatchObject({
      id: "project_web",
      name: "Unavailable project",
    });
  });
});

describe("scopeManifest", () => {
  it("filters by source, reopens updatable sessions and preselects new ones", () => {
    const scoped = scopeManifest(
      {
        ...manifest,
        sessions: [
          session({ sessionId: "a" }),
          session({ sessionId: "b", imported: true, updatable: true }),
          session({ sessionId: "c", imported: true }),
          session({ sessionId: "d", source: "codex" }),
          session({ sessionId: "e" }),
        ],
      },
      "claude-code",
      new Set(["claude-code:e"]),
    );
    expect(scoped.manifest.sessions.map((s) => s.sessionId)).toEqual([
      "a",
      "b",
      "c",
      "e",
    ]);
    expect([...scoped.selected]).toEqual(["claude-code:a", "claude-code:b"]);
    expect(
      scoped.manifest.sessions.find((s) => s.sessionId === "e")?.imported,
    ).toBe(true);
    expect(
      selectableKeys(
        groupSessions(scoped.manifest).projects[0] ?? { sessions: [] },
      ),
    ).not.toContain("claude-code:e");
  });

  it("keeps sessions completed in a previous run unselectable on reopen", () => {
    const scoped = scopeManifest(
      {
        ...manifest,
        sessions: [session({ sessionId: "a" }), session({ sessionId: "b" })],
      },
      "claude-code",
      new Set(["claude-code:b"]),
    );
    expect(
      scoped.manifest.sessions.find((s) => s.sessionId === "b")?.imported,
    ).toBe(true);
    expect([...scoped.selected]).toEqual(["claude-code:a"]);
    const keys = groupSessions(scoped.manifest)
      .projects.flatMap(selectableKeys)
      .concat(groupSessions(scoped.manifest).folders.flatMap(selectableKeys));
    expect(keys).not.toContain("claude-code:b");
  });
});

describe("toggleSelection", () => {
  const groups = groupSessions(manifest);

  it("toggles one session and moves the anchor", () => {
    const next = toggleSelection(
      new Set(),
      groups,
      undefined,
      "claude-code:f2",
      false,
    );
    expect([...next.selected]).toEqual(["claude-code:f2"]);
    expect(next.anchor).toBe("claude-code:f2");
  });

  it("shift-selects the range inside one group", () => {
    const next = toggleSelection(
      new Set(["claude-code:f2"]),
      groups,
      "claude-code:f2",
      "claude-code:f3",
      true,
    );
    expect([...next.selected].sort()).toEqual([
      "claude-code:f2",
      "claude-code:f3",
    ]);
  });

  it("falls back to a single toggle across groups", () => {
    const next = toggleSelection(
      new Set(["claude-code:f2"]),
      groups,
      "claude-code:f2",
      "claude-code:w1",
      true,
    );
    expect([...next.selected].sort()).toEqual([
      "claude-code:f2",
      "claude-code:w1",
    ]);
  });
});

describe("placementRows", () => {
  const groups = groupSessions(manifest);

  it("splits movable and locked picks and resolves names", () => {
    const rows = placementRows(
      groups,
      manifest,
      new Set(["claude-code:w1", "claude-code:w2", "claude-code:x1"]),
      new Map(),
    );
    expect(rows.map((row) => row.key)).toEqual([
      "ambiguous:acme/shared,acme/tools:false",
      "project_web:false",
      "project_web:true",
    ]);
    expect(rows[0]).toMatchObject({ unresolved: true, editable: true });
    expect(rows[2]).toMatchObject({
      locked: true,
      editable: false,
      name: "Acme Web",
    });
  });

  it("applies overrides and uses folder paths for repo-less sessions", () => {
    const rows = placementRows(
      groups,
      manifest,
      new Set(["claude-code:x1", "claude-code:f1"]),
      new Map([["claude-code:x1", "project_api"]]),
    );
    expect(rows[0]).toMatchObject({
      projectId: "project_api",
      name: "Acme API",
      unresolved: false,
    });
    expect(rows[1]).toMatchObject({
      source: "~/scratch",
      repository: false,
      editable: false,
    });
  });
});

describe("copy helpers", () => {
  it("summarises the sessions found", () => {
    expect(sessionsSummary(undefined, undefined)).toBe("Finding sessions");
    expect(sessionsSummary(undefined, "codex")).toBe("Finding Codex sessions");
    expect(sessionsSummary(manifest, undefined)).toBe(
      "6 sessions from Claude Code 2.1.0",
    );
    expect(
      sessionsSummary(
        { ...manifest, versions: { claude: "2.1.0", codex: "0.9.0" } },
        undefined,
      ),
    ).toBe("6 sessions from Claude Code 2.1.0 and Codex 0.9.0");
  });

  it("states the footer status", () => {
    expect(footerStatus(0, "sessions", true)).toBe("Nothing to import");
    expect(footerStatus(2, "projects", false)).toBe(
      "Choose a project to continue",
    );
    expect(footerStatus(2, "sessions", true)).toBe("2 selected");
  });

  it("labels the destination", () => {
    expect(destinationLabel("Acme Web", "project_web", true)).toBe(
      "Choose project",
    );
    expect(destinationLabel("web", null, false)).toBe("New project: web");
    expect(destinationLabel("web", "project_dry_web", false)).toBe(
      "New project: web",
    );
    expect(destinationLabel("Acme Web", "project_web", false)).toBe("Acme Web");
  });

  it("offers only real projects linked to the sessions' repos", () => {
    const linked = destinationProjects(
      manifest.projects,
      [session({ repos: ["ACME/web"] })],
      " acme ",
    );
    expect(linked.map((project) => project.id)).toEqual(["project_web"]);
  });

  it("shortens home paths", () => {
    expect(tildePath("/home/alex/acme")).toBe("~/acme");
    expect(tildePath("/srv/acme")).toBe("/srv/acme");
  });
});
