export type DiffFile = {
  readonly path: string;
  readonly status: string;
  readonly additions: number;
  readonly deletions: number;
};

export type FileTreeNode =
  | {
      readonly kind: "dir";
      readonly name: string;
      readonly path: string;
      readonly children: ReadonlyArray<FileTreeNode>;
    }
  | { readonly kind: "file"; readonly name: string; readonly file: DiffFile };

type Json = Readonly<Record<string, unknown>>;

export const toDiffFiles = (value: unknown): ReadonlyArray<DiffFile> => {
  const raw = (
    typeof value === "object" && value !== null ? value : {}
  ) as Json;
  const files = Array.isArray(raw.files) ? raw.files : [];
  return files.flatMap((item: unknown) => {
    const file = (
      typeof item === "object" && item !== null ? item : {}
    ) as Json;
    if (typeof file.path !== "string") return [];
    return [
      {
        path: file.path,
        status: typeof file.status === "string" ? file.status : "modified",
        additions: typeof file.additions === "number" ? file.additions : 0,
        deletions: typeof file.deletions === "number" ? file.deletions : 0,
      },
    ];
  });
};

type MutableDir = { dirs: Map<string, MutableDir>; files: Array<DiffFile> };

const compact = (name: string, path: string, dir: MutableDir): FileTreeNode => {
  if (dir.files.length === 0 && dir.dirs.size === 1) {
    const [[childName, child]] = [...dir.dirs.entries()] as [
      [string, MutableDir],
    ];
    return compact(`${name} / ${childName}`, `${path}/${childName}`, child);
  }
  return { kind: "dir", name, path, children: childrenOf(path, dir) };
};

const childrenOf = (
  path: string,
  dir: MutableDir,
): ReadonlyArray<FileTreeNode> => [
  ...[...dir.dirs.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, child]) =>
      compact(name, path === "" ? name : `${path}/${name}`, child),
    ),
  ...[...dir.files]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((file) => ({
      kind: "file" as const,
      name: file.path.split("/").at(-1) ?? file.path,
      file,
    })),
];

export const buildFileTree = (
  files: ReadonlyArray<DiffFile>,
): ReadonlyArray<FileTreeNode> => {
  const root: MutableDir = { dirs: new Map(), files: [] };
  for (const file of files) {
    const parts = file.path.split("/");
    let dir = root;
    for (const part of parts.slice(0, -1)) {
      const next = dir.dirs.get(part) ?? { dirs: new Map(), files: [] };
      dir.dirs.set(part, next);
      dir = next;
    }
    dir.files.push(file);
  }
  return childrenOf("", root);
};

export const filterFiles = (files: ReadonlyArray<DiffFile>, query: string) => {
  const needle = query.trim().toLowerCase();
  return needle === ""
    ? files
    : files.filter((file) => file.path.toLowerCase().includes(needle));
};
