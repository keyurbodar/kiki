import type { DiffToolbarFile } from "@/components/diff-toolbar";
import { diffCategory } from "@/lib/diff-categories";

export type DiffScope =
  | { scope: "pr-preview" }
  | { scope: "uncommitted" }
  | { scope: "local" }
  | { scope: "turn"; from: string; through: string };

export const scopeLabels: Record<DiffScope["scope"], string> = {
  "pr-preview": "PR preview",
  uncommitted: "Uncommitted",
  turn: "Turns",
  local: "Local",
};

export type DiffTurn = {
  eventId: string;
  repos: ReadonlyArray<{ repo: string; scopes: ReadonlyArray<string> }>;
  additions: number;
  deletions: number;
  title?: string;
};

export function groupTurns(turns: ReadonlyArray<DiffTurn>): DiffTurn[] {
  const grouped = new Map<string, DiffTurn[]>();
  for (const turn of turns) {
    const group = grouped.get(turn.eventId);
    if (group === undefined) {
      grouped.set(turn.eventId, [turn]);
      continue;
    }
    group.push(turn);
  }
  return [...grouped.entries()].map(([eventId, group]) => ({
    eventId,
    repos: group.flatMap((entry) => entry.repos),
    additions: group.reduce((total, entry) => total + entry.additions, 0),
    deletions: group.reduce((total, entry) => total + entry.deletions, 0),
    title: group.find((entry) => entry.title !== undefined)?.title,
  }));
}

export function availableScopes(
  turns: ReadonlyArray<DiffTurn>,
): Set<DiffScope["scope"]> {
  const scopes = new Set<DiffScope["scope"]>();
  for (const turn of turns) {
    for (const repo of turn.repos) {
      for (const scope of repo.scopes) {
        if (
          scope === "pr-preview" ||
          scope === "uncommitted" ||
          scope === "turn"
        ) {
          scopes.add(scope);
        }
      }
    }
  }
  return scopes;
}

export function defaultScope(
  scopes: ReadonlySet<DiffScope["scope"]>,
  turns: ReadonlyArray<DiffTurn>,
  current?: DiffScope | null,
): DiffScope | null {
  if (
    current !== null &&
    current !== undefined &&
    current.scope !== "local" &&
    scopes.has(current.scope) &&
    (current.scope !== "turn" ||
      (turns.some((turn) => turn.eventId === current.from) &&
        turns.some((turn) => turn.eventId === current.through)))
  ) {
    return current;
  }
  if (scopes.has("pr-preview")) return { scope: "pr-preview" };
  if (scopes.has("uncommitted")) return { scope: "uncommitted" };
  const last = turns.at(-1);
  return last === undefined
    ? null
    : { scope: "turn", from: last.eventId, through: last.eventId };
}

export function turnTitle(turn: DiffTurn, index: number): string {
  const title = turn.title
    ?.split("\n")
    .find((line) => line.trim().length > 0)
    ?.trim();
  return title === undefined || title.length === 0
    ? `Turn ${index + 1}`
    : title;
}

export function filterTurns(
  turns: ReadonlyArray<DiffTurn>,
  query: string,
): Array<{ turn: DiffTurn; index: number; title: string }> {
  const needle = query.trim().toLowerCase();
  return turns
    .map((turn, index) => ({ turn, index, title: turnTitle(turn, index) }))
    .filter(
      ({ title, index }) =>
        needle.length === 0 ||
        title.toLowerCase().includes(needle) ||
        `turn ${index + 1}`.includes(needle),
    );
}

/** Shift-click extends the selected range from the anchor; plain click moves it. */
export function pickTurn(
  index: number,
  from: number,
  through: number,
  shift: boolean,
  turns: ReadonlyArray<DiffTurn>,
) {
  const start = shift ? Math.min(index, from) : index;
  const end = shift ? Math.max(index, through) : index;
  if (start < 0 || end >= turns.length || end < 0) return undefined;
  return { from: turns[start].eventId, through: turns[end].eventId };
}

export function rangeLabel(from: number, through: number, count: number) {
  return from === through
    ? `Turn ${from + 1} of ${count}`
    : `Turns ${from + 1}–${through + 1} of ${count}`;
}

export function filesForScope(
  files: ReadonlyArray<DiffToolbarFile & { repo?: string }>,
  scope: DiffScope,
): DiffToolbarFile[] {
  if (scope.scope === "turn") {
    return files.filter(
      (file) => file.repo === undefined || scope.from <= scope.through,
    );
  }
  return files.filter((file) => {
    if (file.category !== undefined) return file.category === scope.scope;
    return diffCategory(file.path) === scope.scope;
  });
}

export type PatchFile = DiffToolbarFile & {
  patch?: string | null;
  repo?: string;
};

/** Keep only changed files from the patch response, with their counts. */
export function changedPatchFiles(
  value: unknown,
  changedPaths: ReadonlySet<string>,
): PatchFile[] {
  if (typeof value !== "object" || value === null) return [];
  const files = (value as Record<string, unknown>).files;
  if (!Array.isArray(files)) return [];
  return files.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const file = entry as Record<string, unknown>;
    if (typeof file.path !== "string" || !changedPaths.has(file.path))
      return [];
    const patch = typeof file.diff === "string" ? file.diff : null;
    return [
      {
        path: file.path,
        patch,
        additions:
          typeof file.additionCount === "number" ? file.additionCount : 0,
        deletions:
          typeof file.deletionCount === "number" ? file.deletionCount : 0,
      },
    ];
  });
}

export function patchTotals(files: ReadonlyArray<PatchFile>) {
  return files.reduce(
    (totals, file) => ({
      additions: totals.additions + (file.additions ?? 0),
      deletions: totals.deletions + (file.deletions ?? 0),
    }),
    { additions: 0, deletions: 0 },
  );
}
