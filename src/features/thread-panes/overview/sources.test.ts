import { describe, expect, it } from "vitest";
import {
  overviewMachine,
  overviewModels,
  overviewRepos,
  overviewSurfaces,
  overviewTurns,
  threadTodos,
} from "./sources";

const compact = (todos: unknown) => ({
  id: "01M7PK3X2N0000000000000C1",
  jamId: "jam_sample",
  kind: "compact" as const,
  state: "committed" as const,
  createdAt: "2026-11-19T09:00:00.000Z",
  payload: { todos },
});

const message = {
  id: "01M7PK3X2N0000000000000M1",
  jamId: "jam_sample",
  kind: "message" as const,
  state: "committed" as const,
  createdAt: "2026-11-19T08:00:00.000Z",
  payload: { text: "hello" },
};

describe("threadTodos", () => {
  it("reads the list the newest compaction carried", () => {
    expect(
      threadTodos([
        compact([{ content: "older", status: "pending" }]),
        message,
        compact([
          { content: "Add the empty state", status: "in_progress" },
          { content: "Ship it", status: "completed" },
        ]),
      ] as never),
    ).toEqual([
      { content: "Add the empty state", status: "in_progress" },
      { content: "Ship it", status: "completed" },
    ]);
  });

  it("has no list for a thread that never compacted", () => {
    expect(threadTodos([message] as never)).toBeNull();
  });

  it("drops a todo whose status the contract does not name", () => {
    expect(
      threadTodos([
        compact([
          { content: "kept", status: "pending" },
          { content: "dropped", status: "blocked" },
          { content: "", status: "pending" },
        ]),
      ] as never),
    ).toEqual([{ content: "kept", status: "pending" }]);
  });
});

describe("overviewModels", () => {
  it("resolves a task's model id against the catalog the picker reads", () => {
    expect(
      overviewModels([
        {
          id: "anthropic/claude-opus-5-5",
          name: "Claude Opus 5.5",
          provider: "anthropic",
        },
        { id: "openai/gpt", label: "GPT", provider: "openai" },
      ]),
    ).toEqual([
      {
        id: "anthropic/claude-opus-5-5",
        name: "Claude Opus 5.5",
        provider: "anthropic",
      },
      { id: "openai/gpt", name: "GPT", provider: "openai" },
    ]);
  });
});

describe("the overview's surface rows", () => {
  const status = {
    repo: "acme/web",
    ahead: 2,
    changes: [{ path: "src/checkout/retry.ts", status: "modified" }],
  };
  const turns = [{ id: "turn_1", files: [{ path: "src/checkout/retry.ts" }] }];
  const patch = {
    files: [
      {
        path: "src/checkout/retry.ts",
        diff: "@@ -1 +1 @@",
        additionCount: 4,
        deletionCount: 1,
      },
    ],
  };

  it("names the repository and its dirty count", () => {
    expect(overviewRepos(status)).toEqual([
      { repo: "acme/web", repoFullName: null, dirtyCount: 1, ahead: 2 },
    ]);
  });

  it("counts each turn's files and the lines its patch carries", () => {
    expect(overviewTurns(turns, patch)).toEqual([
      { fileCount: 1, additions: 4, deletions: 1 },
    ]);
  });

  it("maps the thread's machine and keeps a device a device", () => {
    expect(
      overviewMachine([{ id: "machine_1", kind: "cloud", status: "running" }]),
    ).toEqual({
      machineId: "machine_1",
      state: "awake",
      device: false,
      allocation: null,
    });
    expect(
      overviewMachine([{ id: "machine_2", kind: "device", status: "stopped" }]),
    ).toMatchObject({ state: "gone", device: true });
    expect(overviewMachine([])).toBeNull();
  });

  it("builds the whole surface set from the atoms that hold it", () => {
    expect(
      overviewSurfaces({
        status,
        turns,
        patch,
        machines: [{ id: "machine_1", kind: "cloud", status: "sleeping" }],
      }),
    ).toEqual({
      repos: [
        { repo: "acme/web", repoFullName: null, dirtyCount: 1, ahead: 2 },
      ],
      turns: [{ fileCount: 1, additions: 4, deletions: 1 }],
      machine: {
        machineId: "machine_1",
        state: "asleep",
        device: false,
        allocation: null,
      },
      sessions: undefined,
    });
  });
});
