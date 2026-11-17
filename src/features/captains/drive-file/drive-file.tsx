import { useAtomRefresh } from "@effect/atom-react";
import { type ReactNode, useState } from "react";
import {
  type DriveEntry,
  type DriveFileChrome,
  type DriveFolderEntry,
  type DriveVolume,
  folderEntries,
} from "@/components/drive-file-pane";
import { FileState, MissingFile } from "@/components/missing-file";
import {
  type CaptainDrive,
  captainDriveAtom,
  useCaptainDrive,
  useCaptainOrgId,
} from "@/features/captains/overview";
import { Button } from "@/primitives/button";

export type CaptainDriveHome = {
  kind: "drive";
  location: { kind: "captain"; jamId: string };
};

export type CaptainDriveViews = {
  frame: (props: {
    home: CaptainDriveHome;
    path: string;
    name: string;
    chrome: DriveFileChrome;
    children: ReactNode;
  }) => ReactNode;
  file: (props: {
    entry: DriveEntry;
    home: CaptainDriveHome;
    chrome: DriveFileChrome;
  }) => ReactNode;
  folder: (props: {
    home: CaptainDriveHome;
    path: string;
    entries: DriveFolderEntry[];
    onOpen: (path: string) => void;
    chrome: DriveFileChrome;
  }) => ReactNode;
  version: (props: {
    volume: DriveVolume;
    path: string;
    live?: DriveEntry;
    version: string;
    home: CaptainDriveHome;
    chrome: DriveFileChrome;
  }) => ReactNode;
};

export const captainDriveAbsent = "Not in this Captain's drive yet";

export type CaptainDriveFileState =
  | { kind: "version"; volume: DriveVolume; version: string; live?: DriveEntry }
  | { kind: "file"; entry: DriveEntry }
  | { kind: "folder"; entries: DriveFolderEntry[] }
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "not-found" }
  | { kind: "missing"; volumeId: string };

/**
 * Which view a path in a Captain's drive gets, in Capy's order: a pinned
 * version, the live file, a folder listing, then the empty states.
 */
export function resolveCaptainDriveFile({
  drive,
  failed,
  path,
  version,
}: {
  drive: CaptainDrive | null | undefined;
  failed: boolean;
  path: string;
  version: string | undefined;
}): CaptainDriveFileState {
  const files = drive?.files ?? [];
  const entry = files.find((file) => file.path === path);
  if (version !== undefined && drive != null)
    return { kind: "version", volume: drive.volume, version, live: entry };
  if (entry !== undefined) return { kind: "file", entry };
  const folder = folderEntries(files, path);
  if (folder !== undefined) return { kind: "folder", entries: folder };
  if (drive === undefined)
    return failed ? { kind: "unavailable" } : { kind: "loading" };
  if (drive === null) return { kind: "not-found" };
  return { kind: "missing", volumeId: drive.volume.id };
}

export type CaptainDriveFileViewProps = {
  orgId?: string;
  jamId: string;
  path: string;
  version?: string;
  onOpenFile: (path: string) => void;
  chrome: DriveFileChrome;
  views: CaptainDriveViews;
};

/** A file, folder or empty state inside a Captain's drive. */
export function CaptainDriveFileView({
  orgId: orgIdProp,
  jamId,
  path,
  version,
  onOpenFile,
  chrome,
  views,
}: CaptainDriveFileViewProps) {
  const orgId = useCaptainOrgId(orgIdProp);
  const { drive, failed } = useCaptainDrive(orgId, jamId);
  const refresh = useAtomRefresh(captainDriveAtom(orgId ?? "", jamId));
  const [opened, setOpened] = useState<{ path: string; version: string }>();
  const home: CaptainDriveHome = {
    kind: "drive",
    location: { kind: "captain", jamId },
  };
  const state = resolveCaptainDriveFile({
    drive,
    failed,
    path,
    version: version ?? (opened?.path === path ? opened.version : undefined),
  });

  if (state.kind === "version")
    return views.version({ ...state, path, home, chrome });
  if (state.kind === "file")
    return views.file({ entry: state.entry, home, chrome });
  if (state.kind === "folder")
    return views.folder({
      home,
      path,
      entries: state.entries,
      onOpen: onOpenFile,
      chrome,
    });

  const retry = (
    <Button variant="ghost" size="xs" onClick={refresh}>
      Retry
    </Button>
  );
  return views.frame({
    home,
    path,
    name: path.split("/").at(-1) ?? path,
    chrome,
    children:
      state.kind === "loading" ? (
        <FileState busy line="Loading file" />
      ) : state.kind === "unavailable" ? (
        <FileState line="Drive unavailable" action={retry} />
      ) : state.kind === "not-found" ? (
        <FileState
          line="File not found"
          sub={captainDriveAbsent}
          action={retry}
        />
      ) : (
        <MissingFile
          orgId={orgId}
          volumeId={state.volumeId}
          path={path}
          absent={captainDriveAbsent}
          onRetry={refresh}
          onOpenVersion={(next) => setOpened({ path, version: next })}
        />
      ),
  });
}
