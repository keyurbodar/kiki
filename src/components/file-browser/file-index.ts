export type BrowserFile = {
  path: string;
  sizeBytes: number;
};

export type FileIndexFile = {
  name: string;
  path: string;
  sizeBytes: number;
};

export type FileIndexFolder = {
  files: FileIndexFile[];
  folders: Map<string, FileIndexFolder>;
  fileCount: number;
  totalBytes: number;
};

export type FolderEntry =
  | {
      kind: "folder";
      label: string;
      path: string;
      fileCount: number;
      totalBytes: number;
    }
  | { kind: "file"; label: string; path: string; sizeBytes: number };

const emptyFolder = (): FileIndexFolder => ({
  files: [],
  folders: new Map(),
  fileCount: 0,
  totalBytes: 0,
});

export const baseName = (path: string) => path.split("/").at(-1) ?? path;

export const parentPath = (path: string) =>
  path.slice(0, -baseName(path).length - 1);

export const normalizeFilter = (filter: string) =>
  filter.trim().replaceAll("\\", "/").toLowerCase();

export function buildFileIndex(
  files: ReadonlyArray<BrowserFile>,
): FileIndexFolder {
  const root = emptyFolder();
  for (const file of files) {
    const segments = file.path.split("/");
    let folder = root;
    folder.fileCount += 1;
    folder.totalBytes += file.sizeBytes;
    for (const segment of segments.slice(0, -1)) {
      let child = folder.folders.get(segment);
      if (child === undefined) {
        child = emptyFolder();
        folder.folders.set(segment, child);
      }
      child.fileCount += 1;
      child.totalBytes += file.sizeBytes;
      folder = child;
    }
    folder.files.push({
      name: segments.at(-1) ?? file.path,
      path: file.path,
      sizeBytes: file.sizeBytes,
    });
  }
  return root;
}

export function folderAt(
  index: FileIndexFolder,
  path: string,
): FileIndexFolder | undefined {
  if (path === "") return index;
  let folder: FileIndexFolder | undefined = index;
  for (const segment of path.split("/")) {
    folder = folder?.folders.get(segment);
    if (folder === undefined) return undefined;
  }
  return folder;
}

export function nearestFolder(
  files: ReadonlyArray<BrowserFile>,
  path: string,
): string {
  const index = buildFileIndex(files);
  const segments = path === "" ? [] : path.split("/");
  for (let length = segments.length; length > 0; length -= 1) {
    const candidate = segments.slice(0, length).join("/");
    if (folderAt(index, candidate) !== undefined) return candidate;
  }
  return "";
}

export function folderEntries(
  folder: FileIndexFolder,
  path: string,
): FolderEntry[] {
  const prefix = path === "" ? "" : `${path}/`;
  const folders = [...folder.folders.entries()]
    .map(([name, child]): FolderEntry => {
      let label = name;
      let fullPath = `${prefix}${name}`;
      let current = child;
      while (current.files.length === 0 && current.folders.size === 1) {
        const [nextName, next] = [...current.folders.entries()][0] as [
          string,
          FileIndexFolder,
        ];
        label = `${label}/${nextName}`;
        fullPath = `${fullPath}/${nextName}`;
        current = next;
      }
      return {
        kind: "folder",
        label,
        path: fullPath,
        fileCount: current.fileCount,
        totalBytes: current.totalBytes,
      };
    })
    .toSorted((a, b) => a.label.localeCompare(b.label));
  const files = folder.files
    .map(
      (file): FolderEntry => ({
        kind: "file",
        label: file.name,
        path: file.path,
        sizeBytes: file.sizeBytes,
      }),
    )
    .toSorted((a, b) => a.label.localeCompare(b.label));
  return [...folders, ...files];
}

export function siblingPath(
  paths: ReadonlyArray<string>,
  current: string,
  step: number,
): string | undefined {
  const directory = parentPath(current);
  const siblings = paths.filter((path) => parentPath(path) === directory);
  return siblings[siblings.indexOf(current) + step];
}
