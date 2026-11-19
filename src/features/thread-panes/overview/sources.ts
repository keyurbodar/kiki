import type { EventRow } from "@/data/events";
import { changedPatchFiles } from "@/features/thread-panes/diffs-view/logic";
import type {
  OverviewMachine,
  OverviewModel,
  OverviewRepoStatus,
  OverviewSurfaces,
  OverviewTodo,
  OverviewTurn,
} from "./model";

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;

const asArray = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];

const text = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : undefined;

const num = (value: unknown): number => (typeof value === "number" ? value : 0);

const TODO_STATUS: ReadonlySet<string> = new Set([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "deferred",
]);

const toTodo = (value: unknown): OverviewTodo | undefined => {
  const row = asRecord(value);
  const content = text(row?.content);
  const status = text(row?.status);
  if (content === undefined || status === undefined) return undefined;
  if (!TODO_STATUS.has(status)) return undefined;
  return { content, status: status as OverviewTodo["status"] };
};

/**
 * The list the thread's newest compaction carried. Todos travel with the
 * compaction that wrote them rather than as rows of their own, so the last
 * `compact` event with a list is the current one; a thread that never
 * compacted has none and the section stays away.
 */
export function threadTodos(
  events: ReadonlyArray<EventRow>,
): ReadonlyArray<OverviewTodo> | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const row = events[index];
    if (row === undefined || row.kind !== "compact") continue;
    const todos = asRecord(row.payload)?.todos;
    if (!Array.isArray(todos)) continue;
    return todos.flatMap((todo) => {
      const parsed = toTodo(todo);
      return parsed === undefined ? [] : [parsed];
    });
  }
  return null;
}

/** The catalog rows an overview's model chip resolves a task's `modelId` against. */
export function overviewModels(catalog: unknown): ReadonlyArray<OverviewModel> {
  return asArray(catalog).flatMap((value) => {
    const row = asRecord(value);
    const id = text(row?.id);
    if (id === undefined) return [];
    return [
      {
        id,
        name: text(row?.name) ?? text(row?.label) ?? id,
        provider: text(row?.provider) ?? "capy",
      },
    ];
  });
}

/** The repositories the thread's diff status names, one row per repo. */
export function overviewRepos(
  status: unknown,
): ReadonlyArray<OverviewRepoStatus> {
  const row = asRecord(status);
  const repo = text(row?.repo);
  if (repo === undefined) return [];
  return [
    {
      repo,
      repoFullName: null,
      dirtyCount: asArray(row?.changes).length,
      ahead: num(row?.ahead),
    },
  ];
}

/**
 * One row per turn, with the additions and deletions the turn's own files carry
 * in the thread's patch — a turn names files, the patch counts their lines.
 */
export function overviewTurns(
  turns: unknown,
  patch: unknown,
): ReadonlyArray<OverviewTurn> {
  const paths = new Set<string>();
  for (const value of asArray(turns)) {
    for (const file of asArray(asRecord(value)?.files)) {
      const path = text(asRecord(file)?.path);
      if (path !== undefined) paths.add(path);
    }
  }
  const counts = new Map(
    changedPatchFiles(patch, paths).map((file) => [file.path, file]),
  );
  return asArray(turns).flatMap((value) => {
    const files = asArray(asRecord(value)?.files);
    if (files.length === 0) return [];
    return [
      {
        fileCount: files.length,
        additions: files.reduce<number>(
          (sum, file) =>
            sum + num(counts.get(text(asRecord(file)?.path) ?? "")?.additions),
          0,
        ),
        deletions: files.reduce<number>(
          (sum, file) =>
            sum + num(counts.get(text(asRecord(file)?.path) ?? "")?.deletions),
          0,
        ),
      },
    ];
  });
}

const MACHINE_STATE: Readonly<Record<string, OverviewMachine["state"]>> = {
  creating: "creating",
  starting: "waking",
  waking: "waking",
  running: "awake",
  online: "awake",
  sleeping: "asleep",
  stopped: "gone",
  gone: "gone",
};

/** The machine the thread runs on, in the shape the overview's rows read. */
export function overviewMachine(rows: unknown): OverviewMachine | null {
  const row = asRecord(asArray(rows)[0]);
  const machineId = text(row?.id);
  if (row === undefined || machineId === undefined) return null;
  const state = MACHINE_STATE[text(row.status) ?? ""] ?? "awake";
  return {
    machineId,
    state,
    device: row.kind === "device",
    allocation: null,
  };
}

/** Everything the overview's surface rows read, from the atoms that already hold it. */
export function overviewSurfaces(input: {
  readonly status: unknown;
  readonly turns: unknown;
  readonly patch: unknown;
  readonly machines: unknown;
}): OverviewSurfaces {
  return {
    repos: overviewRepos(input.status),
    turns: overviewTurns(input.turns, input.patch),
    machine: overviewMachine(input.machines),
    sessions: undefined,
  };
}
