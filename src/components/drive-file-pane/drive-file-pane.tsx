import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { FileState, MissingFile } from "@/components/missing-file";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import {
  type DriveEntry,
  type DriveFileTarget,
  type DriveFolderEntry,
  type DriveLocation,
  type DriveVolume,
  resolveScopeFile,
  type ScopeListing,
} from "./resolve";

export type DriveFileChrome = {
  onCrumb?: (path: string) => void;
  actions: ReactNode;
};

export type DriveFileHome = { kind: "drive"; location: DriveLocation };

export type DriveFilePaneViews = {
  share: (shareId: string) => ReactNode;
  captain: (props: {
    jamId: string;
    path: string;
    version?: string;
    onOpenFile: (path: string) => void;
    chrome: DriveFileChrome;
  }) => ReactNode;
  frame: (props: {
    home: DriveFileHome;
    path: string;
    name: string;
    chrome: DriveFileChrome;
    children: ReactNode;
  }) => ReactNode;
  file: (props: {
    entry: DriveEntry;
    home: DriveFileHome;
    chrome: DriveFileChrome;
  }) => ReactNode;
  folder: (props: {
    home: DriveFileHome;
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
    home: DriveFileHome;
    chrome: DriveFileChrome;
  }) => ReactNode;
};

export type ScopeListingState = {
  listing: ScopeListing | undefined;
  failed: boolean;
  onRetry: () => void;
};

export type DriveFilePaneProps = {
  jamId: string;
  path: string;
  target?: DriveFileTarget;
  version?: string;
  onOpenFile: (path: string) => void;
  onCrumb?: (path: string) => void;
  scope: ScopeListingState;
  views: DriveFilePaneViews;
};

const menuIcon =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

function OpenInDrive({
  trackOwner,
  onClick,
}: {
  trackOwner: string;
  onClick: () => void;
}) {
  return (
    <ResponsiveMenuItem data-track-owner={trackOwner} onClick={onClick}>
      <span className={menuIcon}>
        <Icon name="folder-1" />
      </span>
      Open in Drive
    </ResponsiveMenuItem>
  );
}

export function DriveFilePane({
  jamId,
  path,
  target,
  version,
  onOpenFile,
  onCrumb,
  scope,
  views,
}: DriveFilePaneProps) {
  const navigate = useNavigate();
  if (target?.kind === "share") return views.share(target.shareId);
  if (target === undefined || target.kind === "captain") {
    const captainJamId = target?.jamId ?? jamId;
    return views.captain({
      jamId: captainJamId,
      path,
      version,
      onOpenFile,
      chrome: {
        onCrumb,
        actions: (
          <OpenInDrive
            trackOwner="shared/drive-file-pane.tsx#DriveFilePane:ResponsiveMenuItem[Open in Drive]"
            onClick={() =>
              void navigate({
                to: "/drive/captain/$jamId",
                params: { jamId: captainJamId },
                search: { file: path },
              })
            }
          />
        ),
      },
    });
  }
  return (
    <ScopeDriveFile
      target={target}
      path={path}
      version={version}
      onOpenFile={onOpenFile}
      onCrumb={onCrumb}
      scope={scope}
      views={views}
    />
  );
}

function useOpenInDrive() {
  const navigate = useNavigate();
  return (location: DriveLocation, file: string) => {
    if (location.kind === "project")
      return void navigate({
        to: "/project/$projectId/drive/$scope",
        params: { projectId: location.projectId, scope: location.scope },
        search: { file },
      });
    return void navigate({
      to: "/drive/$scope",
      params: {
        scope: location.kind === "personal" ? "personal" : "organization",
      },
      search: { file },
    });
  };
}

function ScopeDriveFile({
  target,
  path,
  version,
  onOpenFile,
  onCrumb,
  scope,
  views,
}: Omit<DriveFilePaneProps, "target" | "jamId"> & { target: DriveLocation }) {
  const [opened, setOpened] = useState<{ path: string; version: string }>();
  const openInDrive = useOpenInDrive();
  const chrome: DriveFileChrome = {
    onCrumb,
    actions: (
      <OpenInDrive
        trackOwner="shared/drive-file-pane.tsx#ScopeDriveFile:ResponsiveMenuItem[Open in Drive]"
        onClick={() => openInDrive(target, path)}
      />
    ),
  };
  const home: DriveFileHome = { kind: "drive", location: target };
  const view = resolveScopeFile({
    listing: scope.listing,
    failed: scope.failed,
    path,
    version: version ?? (opened?.path === path ? opened.version : undefined),
  });
  if (view.kind === "version")
    return views.version({ ...view, path, home, chrome });
  if (view.kind === "file")
    return views.file({ entry: view.entry, home, chrome });
  if (view.kind === "folder")
    return views.folder({
      home,
      path,
      entries: view.entries,
      onOpen: onOpenFile,
      chrome,
    });
  const notFound = view.kind === "unavailable" || view.kind === "not-found";
  return views.frame({
    home,
    path,
    name: path.split("/").at(-1) ?? path,
    chrome,
    children:
      view.kind === "loading" ? (
        <FileState busy line="Loading file" />
      ) : view.kind === "missing" ? (
        <MissingFile
          volumeId={view.volumeId}
          path={path}
          absent="Not in this drive yet"
          onRetry={scope.onRetry}
          onOpenVersion={(next) => setOpened({ path, version: next })}
        />
      ) : (
        notFound && (
          <FileState
            line={
              view.kind === "unavailable"
                ? "Drive unavailable"
                : "File not found"
            }
            sub={
              view.kind === "unavailable" ? undefined : "Not in this drive yet"
            }
            action={
              <Button
                data-track-owner="shared/drive-file-pane.tsx#ScopeDriveFile:Button[Retry]"
                variant="ghost"
                size="xs"
                onClick={scope.onRetry}
              >
                Retry
              </Button>
            }
          />
        )
      ),
  });
}
