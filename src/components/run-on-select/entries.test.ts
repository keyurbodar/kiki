import { describe, expect, it } from "vitest";
import {
  bestFolder,
  defaultPlacement,
  deviceDescription,
  folderName,
  homePath,
  type RunOnDevice,
  relativeTime,
  repoNote,
  toRunOnEntries,
} from "./entries";
import { groupWorktrees, worktreeDetails } from "./existing-worktree-rows";
import { placementLabel } from "./run-on-select";

const device = (id: string, extra: Partial<RunOnDevice> = {}): RunOnDevice => ({
  id,
  name: id,
  description: null,
  hardware: null,
  ownerName: null,
  userId: "u1",
  access: "private",
  revokedAt: null,
  connected: true,
  lastConnectedAt: new Date(1000),
  createdAt: new Date(0),
  workspaces: [],
  ...extra,
});

describe("toRunOnEntries", () => {
  it("keeps your and shared devices, sorted connected first", () => {
    const entries = toRunOnEntries(
      [
        device("offline", { connected: false }),
        device("theirs", { userId: "u2" }),
        device("shared", { userId: "u2", access: "shared", ownerName: "Sam" }),
        device("mine"),
        device("revoked", { revokedAt: new Date(1) }),
      ],
      "u1",
      [],
    );
    expect(entries.map((e) => e.id)).toEqual(["shared", "mine", "offline"]);
    expect(entries[0]?.shared).toBe(true);
  });

  it("finds folders for project repos and what is missing", () => {
    const [entry] = toRunOnEntries(
      [
        device("d", {
          workspaces: [
            { root: "/home/alex/web", repos: ["Acme/Web"], branch: "main" },
            { root: "/home/alex/old", repos: ["acme/api"], missing: true },
          ],
        }),
      ],
      "u1",
      ["acme/web", "acme/api"],
    );
    expect(entry?.folders.map((f) => f.root)).toEqual([
      "/home/alex/web",
      "/home/alex/old",
    ]);
    expect(entry?.missingRepos).toEqual(["acme/api"]);
    expect(entry?.repoNote).toBe("Has web");
    expect(entry?.setupNeeded).toBe(false);
    expect(entry?.worktreeCapable).toBe(true);
    expect(entry && defaultPlacement(entry)).toEqual({ kind: "worktree" });
    expect(entry && bestFolder(entry)?.root).toBe("/home/alex/web");
  });

  it("uses the linked checkout for projectless runs", () => {
    const [entry] = toRunOnEntries(
      [
        device("d", {
          workspaces: [
            { root: "/srv/a", repos: [] },
            { root: "/srv/b", repos: [] },
          ],
        }),
      ],
      "u1",
      [],
      [{ deviceId: "d", root: "/srv/b" }],
    );
    expect(entry?.folders.map((f) => f.root)).toEqual(["/srv/b"]);
    expect(entry?.folders[0]?.needsGit).toBe(true);
    expect(entry && defaultPlacement(entry)).toEqual({
      kind: "linked",
      root: "/srv/b",
    });
  });

  it("returns nothing without a user", () => {
    expect(toRunOnEntries([device("d")], undefined, [])).toEqual([]);
  });
});

describe("helpers", () => {
  it("summarises repo coverage", () => {
    expect(repoNote([], ["acme/a"])).toBe("No folders for this project");
    expect(
      repoNote(
        [{ root: "/x", repos: ["acme/a", "acme/b", "acme/c", "acme/d"] }],
        ["acme/a", "acme/b", "acme/c", "acme/d", "acme/e"],
      ),
    ).toBe("Has a, b and 2 more");
  });

  it("formats paths, descriptions and times", () => {
    expect(homePath("/Users/alex/code/web")).toBe("~/code/web");
    expect(folderName("/home/alex/code/web/")).toBe("web");
    expect(
      deviceDescription({ hardware: { chip: "M4" }, description: "Desk" }),
    ).toBe("M4 · Desk");
    expect(relativeTime(new Date(0), 2000)).toBe("just now");
    expect(relativeTime(new Date(0), 3 * 60 * 60 * 1000)).toBe("3h ago");
  });

  it("labels the placement", () => {
    expect(placementLabel("worktree", undefined)).toBe("New worktree");
    expect(placementLabel("linked", undefined)).toBe("Current checkout");
    expect(placementLabel("linked", "/w/feature")).toBe(
      "Current checkout (feature)",
    );
    expect(placementLabel("worktree", "/w/feature", "Fix login")).toBe(
      "Fix login",
    );
  });
});

describe("worktrees", () => {
  const entry = (
    root: string,
    state: "active" | "unused" | "other" | "missing" | "archived",
  ) => ({
    root,
    commit: "abcdef123",
    state,
    dirty: { modified: 0, untracked: 0 },
  });

  it("groups by state and filters by name or branch", () => {
    const rows = [
      entry("/w/a", "active"),
      { ...entry("/w/b", "unused"), branch: "fix-login" },
      entry("/w/c", "missing"),
      entry("/w/d", "archived"),
    ];
    expect(
      groupWorktrees(rows, "").map((g) => [g.label, g.rows.length]),
    ).toEqual([
      ["In use", 1],
      ["Not in use", 1],
      ["Other worktrees", 1],
    ]);
    expect(groupWorktrees(rows, "login").map((g) => g.label)).toEqual([
      "Not in use",
    ]);
  });

  it("describes a worktree", () => {
    expect(
      worktreeDetails(
        { ...entry("/w/a", "other"), dirty: { modified: 2, untracked: 1 } },
        [],
        true,
      ),
    ).toEqual([
      "detached @ abcdef1",
      "2 modified",
      "1 untracked",
      "Not linked",
      "Changes unknown",
    ]);
  });
});
