import type { FileRef, TimelineRow } from "@/data/events";

export type ThreadAttachment = { file: FileRef; title?: string };

export type ThreadUpload = {
  path: string;
  attachment: ThreadAttachment;
  siblings: readonly ThreadAttachment[];
};

export type FileSourceValue =
  | { kind: "machine"; machineId: string; path: string }
  | { kind: "drive"; location: string; path: string };

export type ThreadSource = {
  key: string;
  source: FileSourceValue;
  from: string;
  at: Date;
};

export const MACHINE_ROOT = "machine";
export const UPLOADS_ROOT = "uploads";
export const SEARCH_LIMIT = 200;

export function threadUploads(rows: readonly TimelineRow[]): ThreadUpload[] {
  const groups = rows.flatMap((row): ThreadAttachment[][] =>
    row.type === "user-message"
      ? [row.files.map((file) => ({ file }))]
      : row.type === "agent-message"
        ? [
            row.files.map((entry) =>
              entry.title === undefined
                ? { file: entry.file }
                : { file: entry.file, title: entry.title },
            ),
          ]
        : [],
  );
  const seen = new Set<string>();
  const names = new Set<string>();
  return groups.flatMap((siblings) =>
    siblings.flatMap((attachment) => {
      if (seen.has(attachment.file.fileId)) return [];
      seen.add(attachment.file.fileId);
      const base = attachment.file.name.replaceAll("/", "_");
      const candidates = [
        base,
        ...Array.from(
          { length: names.size },
          (_, index) => `${base} (${index + 2})`,
        ),
      ];
      const path = candidates.find((name) => !names.has(name)) ?? base;
      names.add(path);
      return [{ path, attachment, siblings }];
    }),
  );
}

export const sourceKey = (source: FileSourceValue) =>
  source.kind === "drive"
    ? `drive:${source.location}:${source.path}`
    : `machine:${source.machineId}:${source.path}`;

export function threadSources(
  rows: readonly TimelineRow[],
  jamId: string,
): ThreadSource[] {
  const entries = rows.flatMap((row) =>
    (row.type === "cluster" ? row.members : [row]).flatMap(
      (item): Omit<ThreadSource, "key">[] => {
        if (item.type === "agent-message")
          return (item.sources ?? []).map((entry) => ({
            source: entry.source,
            from: jamId,
            at: item.createdAt,
          }));
        if (item.type === "update" && item.kind === "task")
          return (item.sources ?? []).map((entry) => ({
            source: entry.source,
            from: item.childJamId,
            at: item.createdAt,
          }));
        return [];
      },
    ),
  );
  const latest = new Map<string, ThreadSource>();
  for (const entry of entries) {
    const key = sourceKey(entry.source);
    const current = latest.get(key);
    if (current === undefined || current.at < entry.at)
      latest.set(key, { ...entry, key });
  }
  return [...latest.values()];
}

export const displayPath = (path: string, workspaceRoot?: string) => {
  const root = workspaceRoot?.replace(/\/+$/, "");
  const relative =
    root !== undefined && root !== "" && path.startsWith(`${root}/`)
      ? path.slice(root.length + 1)
      : path;
  return relative.replace(/^\/+/, "");
};

export type OpenTab = { root: string; path: string; id: string };

export type OpenTabs = {
  files: readonly OpenTab[];
  previews: readonly string[];
  activeId: string | undefined;
};

export type OpenMarks = {
  openPaths: Set<string>;
  previewPaths: Set<string>;
  currentPath: string | undefined;
};

export function openMarks(
  tabs: OpenTabs,
  root: string,
  toPath?: (tab: OpenTab) => string | undefined,
): OpenMarks {
  const files = tabs.files.flatMap((tab) => {
    if (tab.root !== root) return [];
    const path = toPath === undefined ? tab.path : toPath(tab);
    return path === undefined ? [] : [{ path, id: tab.id }];
  });
  return {
    openPaths: new Set(files.map((file) => file.path)),
    previewPaths: new Set(
      files
        .filter((file) => tabs.previews.includes(file.id))
        .map((file) => file.path),
    ),
    currentPath: files.find((file) => file.id === tabs.activeId)?.path,
  };
}
