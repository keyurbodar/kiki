import { describe, expect, it } from "vitest";
import {
  devicePullErrorText,
  localPullRowState,
  repoName,
  signInTip,
} from "@/features/thread/local-pull-rows";
import type { PaneProps } from "@/features/thread-panes/thread-pane/registry";
import type { OverviewPull, OverviewTask } from "./model";
import {
  childPath,
  childTasks,
  diffsSummary,
  hasOverviewContent,
  machineMarkLabel,
  machineStateLabel,
  pluralize,
  pullComparator,
  relativeTime,
  sideThreads,
  sortPulls,
  subagentPaths,
  todoProgress,
} from "./model";

const now = new Date("2026-11-17T12:00:00Z");
const task = (
  id: string,
  parentJamId: string | null,
  localIndex: number | null,
  relationType: "task" | "side_thread" = "task",
): OverviewTask => ({
  id,
  parentJamId,
  relationType,
  localIndex,
  title: id,
  status: "idle",
  modelId: null,
  machine: null,
  createdAt: now,
  lastActivityAt: null,
});

const pull = (over: Partial<OverviewPull> = {}): OverviewPull => ({
  id: over.id ?? "1",
  jamId: null,
  threadId: "t1",
  number: 12,
  url: "https://example.com/acme/web/pull/12",
  repo: "acme/web",
  title: "Sample",
  state: "ready",
  baseRef: "main",
  headRef: "feature",
  additions: 2,
  deletions: 1,
  createdAt: now,
  ...over,
});

describe("overview model", () => {
  it("sorts tasks by local index and separates side threads", () => {
    const subtree = [
      task("b", "root", 2),
      task("a", "root", 1),
      task("s", "root", null, "side_thread"),
    ];
    expect(childTasks(subtree, "root").map((item) => item.id)).toEqual([
      "b",
      "a",
    ]);
    expect(sideThreads(subtree, "root").map((item) => item.id)).toEqual(["s"]);
  });

  it("builds dotted subagent paths, including nested tasks", () => {
    const subtree = [
      task("1", "root", 1),
      task("1.1", "1", 1),
      task("s", "root", null, "side_thread"),
    ];
    expect(subagentPaths(subtree, "root")).toEqual(
      new Map([
        ["1", "1"],
        ["1.1", "1.1"],
      ]),
    );
    expect(childPath("1", 2)).toBe("1.2");
    expect(childPath("", null)).toBe("");
  });

  it("formats relative times in minified and full form", () => {
    expect(relativeTime(now, { now: now.getTime(), minified: true })).toBe(
      "now",
    );
    expect(relativeTime(now.getTime() - 90_000, { now: now.getTime() })).toBe(
      "1m ago",
    );
    expect(relativeTime(now.getTime() + 90_000, { now: now.getTime() })).toBe(
      "in 1m",
    );
  });

  it("orders pull sorts and applies them", () => {
    const rows = [
      pull({
        id: "small",
        number: 1,
        additions: 1,
        deletions: 0,
        repo: "acme/z",
      }),
      pull({
        id: "large",
        number: 2,
        additions: 40,
        deletions: 10,
        repo: "acme/a",
      }),
    ];
    expect(sortPulls(rows, "largest").map((item) => item.id)).toEqual([
      "large",
      "small",
    ]);
    expect(sortPulls(rows, "smallest").map((item) => item.id)).toEqual([
      "small",
      "large",
    ]);
    expect(sortPulls(rows, "repo").map((item) => item.id)).toEqual([
      "large",
      "small",
    ]);
    expect(sortPulls(rows, "opened").map((item) => item.id)).toEqual([
      "small",
      "large",
    ]);
    expect(
      pullComparator("updated")(
        rows[0] as OverviewPull,
        rows[1] as OverviewPull,
      ),
    ).toBe(0);
  });

  it("detects whether the overview has content", () => {
    const base = {
      todos: null,
      tasks: [],
      pulls: [],
      locals: [],
      ports: [],
      sideThreads: [],
    };
    expect(hasOverviewContent(base)).toBe(false);
    expect(
      hasOverviewContent({
        ...base,
        todos: [{ content: "x", status: "pending" }],
      }),
    ).toBe(true);
  });

  it("formats counters, todos, machine labels and diff summaries", () => {
    expect(pluralize(1, "turn")).toBe("1 turn");
    expect(pluralize(2, "turn")).toBe("2 turns");
    expect(
      todoProgress([
        { content: "a", status: "completed" },
        { content: "b", status: "pending" },
      ]),
    ).toBe("1/2");
    expect(machineMarkLabel({ kind: "cloud", size: "large" })).toBe(
      "Cloud · Large",
    );
    expect(machineMarkLabel({ kind: "device", name: "Mac" })).toBe(
      "Paired device · Mac",
    );
    expect(
      machineStateLabel(
        { machineId: "m", state: "gone", device: false, allocation: null },
        true,
      ),
    ).toBe("Restarting");
    expect(diffsSummary([], []).detail).toBe("No changes yet");
    expect(
      diffsSummary(
        [{ repo: "web", repoFullName: "acme/web", dirtyCount: 1, ahead: 2 }],
        [{ fileCount: 2, additions: 3, deletions: 4 }],
      ),
    ).toEqual({
      detail: "2 files · 1 turn · 1 dirty · 2 ahead",
      additions: 3,
      deletions: 4,
      hasTurns: true,
    });
  });
});

describe("local pull rows", () => {
  it("shortens repository names and formats device tips", () => {
    expect(repoName("acme/web")).toBe("web");
    expect(repoName("web")).toBe("web");
    expect(signInTip("computer")).toBe(
      "Sign in to GitHub on this computer to reveal details",
    );
    expect(devicePullErrorText({ offline: true }, "computer")).toBe(
      "Device offline",
    );
    expect(devicePullErrorText({ refused: "auth" }, "computer")).toBe(
      signInTip("computer"),
    );
  });

  it("maps reachable and unreachable pull states", () => {
    const onRefresh = () => undefined;
    expect(
      localPullRowState({
        reachable: false,
        answer: undefined,
        refreshing: false,
        onRefresh,
        githubLinked: true,
        onConnect: () => undefined,
      }),
    ).toMatchObject({ kind: "plain" });
    expect(
      localPullRowState({
        reachable: true,
        answer: undefined,
        refreshing: false,
        onRefresh,
        githubLinked: true,
      }),
    ).toEqual({ kind: "loading" });
    expect(
      localPullRowState({
        reachable: true,
        answer: { pull: {} as never },
        refreshing: false,
        onRefresh,
        githubLinked: true,
      }),
    ).toMatchObject({ kind: "live" });
    expect(
      localPullRowState({
        reachable: true,
        answer: { refused: "missing" },
        refreshing: false,
        onRefresh,
        githubLinked: true,
      }),
    ).toMatchObject({ kind: "tip", tip: "signin" });
  });
});

const _typeCheck: PaneProps = { threadId: "t1" };
void _typeCheck;
