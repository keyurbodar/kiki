export type DriveLocation =
  | { kind: "personal" }
  | { kind: "organization" }
  | { kind: "project"; projectId: string; scope: "personal" | "shared" };

export type DriveFileTarget =
  | DriveLocation
  | { kind: "share"; shareId: string }
  | { kind: "captain"; jamId: string };

export type DriveVolume = {
  id: string;
  namespace: string;
  name: string;
  headVersionId: string | null;
};

export type DriveEntry = {
  path: string;
  sourcePath?: string;
  volume: DriveVolume;
  versionId: string;
  sha256: string;
  sizeBytes: number;
};

export type DriveFolderEntry = { name: string; path: string; folder: boolean };

export function folderEntries(
  entries: ReadonlyArray<Pick<DriveEntry, "path">>,
  path: string,
): DriveFolderEntry[] | undefined {
  const trimmed = path.replace(/\/+$/, "");
  const prefix = trimmed === "" ? "" : `${trimmed}/`;
  const children = new Map<string, DriveFolderEntry>();
  for (const entry of entries) {
    if (!entry.path.startsWith(prefix)) continue;
    const [name = "", ...rest] = entry.path.slice(prefix.length).split("/");
    if (!children.has(name))
      children.set(name, {
        name,
        path: prefix + name,
        folder: rest.length > 0,
      });
  }
  if (children.size === 0) return undefined;
  return [...children.values()].sort((a, b) =>
    a.folder === b.folder ? a.name.localeCompare(b.name) : a.folder ? -1 : 1,
  );
}

export const isArtifactsVolume = (volume: DriveVolume) =>
  volume.namespace === "artifacts" && volume.name === "artifacts";

export type ScopeListing = {
  volumes: ReadonlyArray<DriveVolume>;
  entries: ReadonlyArray<DriveEntry>;
};

export type ScopeFileView =
  | { kind: "version"; volume: DriveVolume; version: string; live?: DriveEntry }
  | { kind: "folder"; entries: DriveFolderEntry[] }
  | { kind: "file"; entry: DriveEntry }
  | { kind: "loading" }
  | { kind: "missing"; volumeId: string }
  | { kind: "unavailable" }
  | { kind: "not-found" };

export function resolveScopeFile({
  listing,
  failed,
  path,
  version,
}: {
  listing: ScopeListing | undefined;
  failed: boolean;
  path: string;
  version: string | undefined;
}): ScopeFileView {
  const entries = listing?.entries ?? [];
  const entry = entries.find((candidate) => candidate.path === path);
  const artifacts = listing?.volumes.find(isArtifactsVolume);
  if (version !== undefined && artifacts !== undefined)
    return {
      kind: "version",
      volume: artifacts,
      version,
      live: entry?.volume.id === artifacts.id ? entry : undefined,
    };
  if (entry !== undefined) return { kind: "file", entry };
  const folder = folderEntries(entries, path);
  if (folder !== undefined) return { kind: "folder", entries: folder };
  if (listing === undefined && !failed) return { kind: "loading" };
  if (artifacts !== undefined && !failed)
    return { kind: "missing", volumeId: artifacts.id };
  return failed ? { kind: "unavailable" } : { kind: "not-found" };
}
