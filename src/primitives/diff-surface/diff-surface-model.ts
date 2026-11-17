import { parsePatchFiles } from "@pierre/diffs";
import type { CodeViewHandle, FileDiffMetadata } from "@pierre/diffs/react";

export type DiffGroupCategory = "database" | "tests" | "generated";

export const DIFF_GROUP_CATEGORIES: readonly DiffGroupCategory[] = [
  "database",
  "tests",
  "generated",
];

export type DiffCategoryFlags = Record<DiffGroupCategory, boolean>;

export type DiffGroup = {
  id: string;
  category?: DiffGroupCategory;
  filePaths: readonly string[];
  additions?: number;
  deletions?: number;
};

export type DiffJoin = "start" | "middle" | "end";

export type DiffSource =
  | { kind: "files"; files: FileDiffMetadata[] }
  | { kind: "raw"; text: string; reason: string };

export type DiffBinaryInfo = { oldSizeBytes?: number; newSizeBytes?: number };

export type DiffChangedFile = {
  path: string;
  previousPath?: string | null;
  kind: "added" | "modified" | "deleted";
};

export const DIFF_METRICS = {
  lineHeight: 15.6,
  diffHeaderHeight: 36,
  spacing: 0,
  hunkSeparatorHeight: 24,
};

export const DIFF_MINIMAL_METRICS = {
  lineHeight: 15.6,
  diffHeaderHeight: 0,
  spacing: 0,
  paddingTop: 0,
};

export const DIFF_FILE_METRICS = {
  ...DIFF_METRICS,
  hunkLineCount: 1,
  paddingTop: 0,
  paddingBottom: 0,
};

export const DIFF_FLUSH_LAYOUT = { paddingTop: 0, paddingBottom: 0, gap: 0 };
export const DIFF_CARD_LAYOUT = { paddingTop: 12, paddingBottom: 12, gap: 12 };

export const DIFF_SKELETON_FILE_LIMIT = 12;
export const DIFF_SKELETON_MAX_ROWS = 120;
export const DIFF_SKELETON_WIDTHS = [
  62, 44, 78, 55, 34, 70, 48, 66, 29, 74, 52, 38,
];
export const DIFF_RECOVERY_ATTEMPTS = 2;

const hash = (text: string, seed: number, prime: number) => {
  let value = seed >>> 0;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, prime) >>> 0;
  }
  return value >>> 0;
};

export const patchCacheKey = (text: string) =>
  `capy-diff:${text.length}:${hash(text, 2166136261, 16777619).toString(36)}:${hash(text, 2654435769, 2246822507).toString(36)}`;

export function parsePatch(patch: string): DiffSource {
  const text = patch.trim();
  let files: FileDiffMetadata[];
  try {
    files = parsePatchFiles(text, {
      cacheKeyPrefix: patchCacheKey(text),
      throwOnError: true,
    }).flatMap((parsed) => parsed.files);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { kind: "raw", text, reason: `Could not parse patch: ${message}` };
  }
  return files.length > 0
    ? { kind: "files", files }
    : {
        kind: "raw",
        text,
        reason: "Unsupported patch format, showing raw text",
      };
}

export function countChanges(fileDiff: FileDiffMetadata) {
  let additions = 0;
  let deletions = 0;
  for (const hunk of fileDiff.hunks) {
    for (const content of hunk.hunkContent) {
      if (content.type !== "change") continue;
      additions += content.additions;
      deletions += content.deletions;
    }
  }
  return { additions, deletions };
}

export function splitPath(path: string): [string, string | undefined] {
  const slash = path.lastIndexOf("/");
  return slash === -1
    ? [path, undefined]
    : [path.slice(slash + 1), path.slice(0, slash + 1)];
}

export function changeLabel(fileDiff: FileDiffMetadata) {
  if (fileDiff.type === "new") return "added";
  if (fileDiff.type === "deleted") return "deleted";
  if (fileDiff.type === "rename-pure" || fileDiff.type === "rename-changed")
    return "renamed";
  return undefined;
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
    units.length - 1,
  );
  const value = bytes / 1024 ** (index + 1);
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

const lastLine = (start: number, count: number) =>
  start - (count === 0 ? 0 : 1) + count;

export function estimateLines(
  fileDiff: FileDiffMetadata,
  split: boolean,
  canLoadFiles: boolean,
) {
  const lines = fileDiff.hunks.reduce(
    (total, hunk) =>
      total + (split ? hunk.splitLineCount : hunk.unifiedLineCount),
    0,
  );
  const gaps = fileDiff.hunks.filter((hunk) =>
    fileDiff.isPartial ? hunk.collapsedBefore > 0 : hunk.collapsedBefore > 1,
  ).length;
  const last = fileDiff.hunks.at(-1);
  let trailing = 0;
  if (last !== undefined) {
    trailing = fileDiff.isPartial
      ? Number(
          canLoadFiles &&
            (fileDiff.type === "change" || fileDiff.type === "rename-changed"),
        )
      : Number(
          fileDiff.additionLines.length -
            lastLine(last.additionStart, last.additionCount) >
            1,
        );
  }
  return { lines, separators: gaps + trailing };
}

export function emptyFileDiff(file: DiffChangedFile): FileDiffMetadata {
  const previousPath = file.previousPath ?? undefined;
  let type: FileDiffMetadata["type"] = "rename-changed";
  if (previousPath === undefined) {
    type =
      file.kind === "added"
        ? "new"
        : file.kind === "deleted"
          ? "deleted"
          : "change";
  }
  return {
    name: file.path,
    prevName: previousPath,
    type,
    hunks: [],
    splitLineCount: 0,
    unifiedLineCount: 0,
    isPartial: true,
    deletionLines: [],
    additionLines: [],
    deletionCharacterCount: 0,
    additionCharacterCount: 0,
  };
}

export function getTopFile<A>(
  handle: CodeViewHandle<A, undefined> | null | undefined,
) {
  const view = handle?.getInstance();
  if (view === undefined) return undefined;
  const scrollTop = view.getScrollTop();
  const top = view
    .getRenderedItems()
    .map((item) => ({
      id: item.id,
      top: view.getTopForItem(item.id) ?? 0,
      height: item.instance.getVirtualizedHeight(),
    }))
    .find(
      (item) =>
        item.top + item.height - scrollTop >
        Math.min(item.height / 2, DIFF_METRICS.diffHeaderHeight),
    );
  return top === undefined
    ? undefined
    : { id: top.id, offset: scrollTop - top.top };
}

export function groupsByFile(
  groups: readonly DiffGroup[] | undefined,
  itemCards: boolean,
) {
  const byFile = new Map<string, DiffGroup>();
  if (!itemCards) return byFile;
  for (const group of groups ?? []) {
    if (group.category === undefined) continue;
    for (const path of group.filePaths) byFile.set(path, group);
  }
  return byFile;
}

export function collapsedGroupIds(
  groups: readonly DiffGroup[] | undefined,
  expanded: Partial<DiffCategoryFlags>,
  hidden: DiffCategoryFlags,
) {
  return new Set(
    (groups ?? []).flatMap((group) =>
      group.category !== undefined &&
      !(expanded[group.category] ?? !hidden[group.category])
        ? [group.id]
        : [],
    ),
  );
}

export function orderFiles(
  files: readonly FileDiffMetadata[],
  groups: readonly DiffGroup[],
  byFile: Map<string, DiffGroup>,
  collapsed: Set<string>,
  hidden: DiffCategoryFlags,
) {
  const byName = new Map(files.map((file) => [file.name, file]));
  const categorized = groups.filter(
    (group): group is DiffGroup & { category: DiffGroupCategory } =>
      group.category !== undefined,
  );
  const entries: (FileDiffMetadata | DiffGroup)[] = [
    ...files.filter((file) => !byFile.has(file.name)),
    ...categorized.filter((group) => !hidden[group.category]),
    ...categorized.filter((group) => hidden[group.category]),
  ];
  return entries.flatMap((entry) => {
    if (!("filePaths" in entry)) return [entry];
    const members = entry.filePaths.flatMap((path) => byName.get(path) ?? []);
    return collapsed.has(entry.id) ? members.slice(0, 1) : members;
  });
}

export function joinedPositions(
  files: readonly FileDiffMetadata[],
  groups: readonly DiffGroup[] | undefined,
  itemCards: boolean,
) {
  const positions = new Map<string, DiffJoin>();
  if (!itemCards || groups === undefined) return positions;
  const names = files.map((file) => file.name);
  for (const group of groups) {
    if (group.category === undefined) continue;
    const members = names.filter((name) => group.filePaths.includes(name));
    if (members.length < 2) continue;
    members.forEach((name, index) => {
      positions.set(
        name,
        index === 0 ? "start" : index === members.length - 1 ? "end" : "middle",
      );
    });
  }
  return positions;
}

export function groupLeaders(
  files: readonly FileDiffMetadata[],
  groups: readonly DiffGroup[] | undefined,
) {
  const leaders = new Map<string, { group: DiffGroup; count: number }>();
  if (groups === undefined) return leaders;
  const names = files.map((file) => file.name);
  for (const group of groups) {
    if (group.category === undefined) continue;
    const first = names.find((name) => group.filePaths.includes(name));
    if (first !== undefined)
      leaders.set(first, { group, count: group.filePaths.length });
  }
  return leaders;
}

export function isFileCollapsed(options: {
  name: string;
  binary: boolean;
  annotationCount: number;
  variant: "default" | "minimal";
  collapsedFiles: ReadonlySet<string>;
}) {
  if (options.binary) return options.annotationCount === 0;
  return (
    options.variant === "default" && options.collapsedFiles.has(options.name)
  );
}

export function itemVersion(options: {
  collapsed: boolean;
  join: DiffJoin | undefined;
  groupCollapsed: boolean;
  categoryHidden: boolean;
  fileVersion: number;
}) {
  const join =
    options.join === "start"
      ? 2
      : options.join === "middle"
        ? 4
        : options.join === "end"
          ? 6
          : 0;
  return (
    Number(options.collapsed) +
    join +
    (options.groupCollapsed ? 8 : 0) +
    (options.categoryHidden ? 16 : 0) +
    options.fileVersion * 32
  );
}

export function toggleInSet(set: ReadonlySet<string>, value: string) {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
}

export function workerPoolSize(hardwareConcurrency: number | undefined) {
  return Math.min(6, Math.max(2, Math.floor((hardwareConcurrency || 4) / 2)));
}
