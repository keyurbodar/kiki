export const folderPathsOf = (paths: Iterable<string>): Set<string> => {
  const folders = new Set<string>();
  for (const path of paths)
    for (let at = path.indexOf("/"); at !== -1; at = path.indexOf("/", at + 1))
      folders.add(path.slice(0, at));
  return folders;
};

export const ancestorFoldersOf = (path: string): string[] =>
  path === ""
    ? []
    : path
        .split("/")
        .map((_, index, parts) => parts.slice(0, index + 1).join("/"));

export const deepestKnownFolder = (
  folders: ReadonlySet<string>,
  path: string,
) => ancestorFoldersOf(path).findLast((folder) => folders.has(folder)) ?? "";

export const filterPaths = (paths: readonly string[], filter: string) => {
  const needle = filter.trim().replaceAll("\\", "/").toLowerCase();
  return needle === ""
    ? [...paths]
    : paths.filter((path) => path.toLowerCase().includes(needle));
};

export type FileStat = { additions?: number; deletions?: number };

export const statDecoration = (stat: FileStat) => {
  const parts = [
    ...((stat.additions ?? 0) > 0
      ? [{ text: `+${stat.additions}`, color: "var(--diff-add)" }]
      : []),
    ...((stat.deletions ?? 0) > 0
      ? [{ text: `-${stat.deletions}`, color: "var(--diff-del)" }]
      : []),
  ];
  if (parts.length === 0) return null;
  return {
    text: parts.map((part) => part.text).join(" "),
    title: [
      (stat.additions ?? 0) > 0 ? `${stat.additions} additions` : undefined,
      (stat.deletions ?? 0) > 0 ? `${stat.deletions} deletions` : undefined,
    ]
      .filter((part) => part !== undefined)
      .join(", "),
    parts,
  };
};
