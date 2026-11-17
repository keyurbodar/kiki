import { useEffect, useRef, useState } from "react";
import { ArrowLeftGlyph, DownloadGlyph } from "@/components/media-gallery";
import {
  type AttachmentFile,
  attachmentKind,
  downloadUrl,
  FileTypeIcon,
  formatBytes,
  saveUrl,
  useAttachmentUrl,
} from "@/features/thread/attachment-gallery";
import { attachmentFailureLine } from "@/features/thread/attachment-gallery/attachment-source";
import {
  AttachmentBody,
  type AttachmentContent,
  AttachmentFrame,
  PaneEmptyState,
  PaneLoading,
  RetryButton,
  textContent,
} from "@/features/thread-panes/attachment-view/frame";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  ARCHIVE_BROWSE_LIMIT,
  ARCHIVE_GATE_BYTES,
  type ArchiveMember,
  directoryTotals,
  indexMembers,
  listDirectory,
  mediaTypeForPath,
  normalizeMemberPath,
  readZipDirectory,
  readZipMember,
} from "./zip";

const track = (owner: string) =>
  `features/thread/pane/attachment-archive.tsx#${owner}`;

const DIRECTORY_PAGE = 150;

type ArchiveLoad =
  | {
      status: "loaded";
      bytes: Uint8Array;
      members: Map<string, ArchiveMember>;
      folders: string[];
    }
  | { status: "refused"; reason: string }
  | { status: "failed"; url: string };

export function useArchive(
  fileId: string,
  url: string | undefined,
  attempt: number,
) {
  const [state, setState] = useState<{
    fileId: string;
    attempt: number;
    value: ArchiveLoad;
  }>();
  const value =
    state !== undefined && state.fileId === fileId && state.attempt === attempt
      ? state.value
      : undefined;
  useEffect(() => {
    if (
      url === undefined ||
      (value !== undefined && (value.status !== "failed" || value.url === url))
    )
      return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) =>
        response.ok
          ? response.arrayBuffer()
          : Promise.reject(new Error(response.statusText)),
      )
      .then((buffer) => {
        if (controller.signal.aborted) return;
        const bytes = new Uint8Array(buffer);
        const directory = readZipDirectory(bytes);
        setState({
          fileId,
          attempt,
          value:
            directory.refused !== undefined
              ? { status: "refused", reason: directory.refused }
              : {
                  status: "loaded",
                  bytes,
                  members: indexMembers(directory.members),
                  folders: directory.folders,
                },
        });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ fileId, attempt, value: { status: "failed", url } });
      });
    return () => controller.abort();
  }, [attempt, fileId, url, value]);
  return value;
}

type MemberLoad =
  | { status: "loaded"; bytes: Uint8Array; url?: string }
  | { status: "failed"; reason: string };

export function useArchiveMember(
  bytes: Uint8Array,
  member: ArchiveMember | undefined,
  mediaType: string | undefined,
) {
  const [state, setState] = useState<{
    member: ArchiveMember;
    value: MemberLoad;
  }>();
  useEffect(() => {
    if (member === undefined) return;
    let cancelled = false;
    let url: string | undefined;
    readZipMember(bytes, member).then(
      (data) => {
        if (cancelled) return;
        url =
          mediaType === undefined
            ? undefined
            : URL.createObjectURL(
                new Blob([data as BlobPart], { type: mediaType }),
              );
        setState({ member, value: { status: "loaded", bytes: data, url } });
      },
      (error: unknown) => {
        if (cancelled) return;
        setState({
          member,
          value: {
            status: "failed",
            reason:
              error instanceof Error ? error.message : "Could not read member",
          },
        });
      },
    );
    return () => {
      cancelled = true;
      if (url !== undefined) URL.revokeObjectURL(url);
    };
  }, [bytes, member, mediaType]);
  return state !== undefined && state.member === member
    ? state.value
    : undefined;
}

function DirectoryCrumb({
  label,
  current,
  onOpen,
}: {
  label: string;
  current: boolean;
  onOpen: () => void;
}) {
  if (current)
    return (
      <span className="min-w-0 truncate font-medium text-foreground">
        {label}
      </span>
    );
  return (
    <button
      data-track-owner="shared/files/directory-view.tsx#DirectoryCrumb:button[onClick=onOpen]"
      type="button"
      className="min-w-0 cursor-pointer truncate rounded font-medium text-muted-foreground-2 outline-none hover:text-foreground focus-visible:outline-ring-inset"
      onClick={onOpen}
    >
      {label}
    </button>
  );
}

export type ArchiveDirectoryProps = {
  rootLabel: string;
  path: string;
  files: ReadonlyArray<{ path: string; sizeBytes: number }>;
  explicitFolders?: ReadonlyArray<string>;
  decorations?: ReadonlyMap<string, string>;
  trailing?: React.ReactNode;
  onOpenDirectory: (path: string) => void;
  onOpenFile: (path: string) => void;
};

export function ArchiveDirectory({
  rootLabel,
  path,
  files,
  explicitFolders,
  decorations,
  trailing,
  onOpenDirectory,
  onOpenFile,
}: ArchiveDirectoryProps) {
  const [pages, setPages] = useState(1);
  const entries = listDirectory(files, path, explicitFolders);
  const totals = directoryTotals(files, path);
  const shown = entries.slice(0, pages * DIRECTORY_PAGE);
  const crumbs = path === "" ? [] : path.split("/");
  const fileCount = (count: number) =>
    `${count} ${count === 1 ? "file" : "files"}`;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        className={[
          "flex min-h-9 shrink-0 items-center gap-1 border-b-hairline border-border-1 pl-4 text-xs whitespace-nowrap",
          trailing === undefined ? "pr-4" : "pr-1.5",
        ].join(" ")}
      >
        <DirectoryCrumb
          label={rootLabel}
          current={crumbs.length === 0}
          onOpen={() => onOpenDirectory("")}
        />
        {crumbs.map((crumb, index) => (
          <span
            key={crumbs.slice(0, index + 1).join("/")}
            className="flex min-w-0 items-center gap-1"
          >
            <span className="text-muted-foreground-3">/</span>
            <DirectoryCrumb
              label={crumb}
              current={index === crumbs.length - 1}
              onOpen={() =>
                onOpenDirectory(crumbs.slice(0, index + 1).join("/"))
              }
            />
          </span>
        ))}
        <span className="ml-auto shrink-0 pl-3 font-normal text-muted-foreground-3">
          {[fileCount(totals.fileCount), formatBytes(totals.totalBytes)].join(
            " · ",
          )}
        </span>
        {trailing !== undefined && (
          <span className="flex shrink-0 items-center">{trailing}</span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {entries.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm font-normal text-muted-foreground-2">
            Empty folder
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*32),1fr))] gap-1">
            {shown.map((entry) => {
              const meta = [
                formatBytes(
                  entry.kind === "folder" ? entry.totalBytes : entry.sizeBytes,
                ),
                ...(decorations?.get(entry.path) === undefined
                  ? []
                  : [decorations.get(entry.path)]),
              ].join(" · ");
              return (
                <button
                  key={entry.path}
                  data-track-owner="shared/files/directory-view.tsx#DirectoryView:button.1"
                  type="button"
                  title={entry.label}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded px-2 py-3 outline-none select-none hover:bg-section focus-visible:outline-ring-inset"
                  onClick={() =>
                    entry.kind === "folder"
                      ? onOpenDirectory(entry.path)
                      : onOpenFile(entry.path)
                  }
                >
                  {entry.kind === "folder" ? (
                    <Icon name="folder-1" className="size-8 text-icon-muted" />
                  ) : (
                    <FileTypeIcon name={entry.label} className="size-8" />
                  )}
                  <span className="max-w-full truncate text-center text-xs text-foreground">
                    {entry.label}
                  </span>
                  <span className="max-w-full truncate text-2xs font-normal text-muted-foreground-3">
                    {entry.kind === "folder"
                      ? `${fileCount(entry.fileCount)} · ${meta}`
                      : meta}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {entries.length > shown.length && (
          <div className="flex justify-center pt-2">
            <Button
              data-track-owner="shared/files/directory-view.tsx#DirectoryView:Button[Show more]"
              variant="ghost"
              size="xs"
              onClick={() => setPages(pages + 1)}
            >
              Show {Math.min(DIRECTORY_PAGE, entries.length - shown.length)}{" "}
              more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export type ArchiveMemberViewProps = {
  bytes: Uint8Array;
  member: ArchiveMember;
  path: string;
  archiveName: string;
  onBack: () => void;
};

export function ArchiveMemberView({
  bytes,
  member,
  path,
  archiveName,
  onBack,
}: ArchiveMemberViewProps) {
  const name = path.split("/").at(-1) ?? path;
  const kind = attachmentKind({ name, mediaType: mediaTypeForPath(name) });
  const [ungated, setUngated] = useState(false);
  const gated =
    kind === undefined && member.sizeBytes > ARCHIVE_GATE_BYTES && !ungated;
  const load = useArchiveMember(
    bytes,
    member.unavailable === undefined && !gated ? member : undefined,
    kind === undefined ? undefined : mediaTypeForPath(name),
  );
  const loaded = load?.status === "loaded" ? load : undefined;
  const meta = `${name.split(".").at(-1) ?? "file"} · ${formatBytes(member.sizeBytes)}`;
  const content: AttachmentContent | undefined =
    kind !== undefined && loaded?.url !== undefined
      ? { kind: "media", media: kind, url: loaded.url, label: name }
      : gated
        ? {
            kind: "gated",
            sizeBytes: member.sizeBytes,
            onLoad: () => setUngated(true),
          }
        : loaded === undefined
          ? undefined
          : textContent(new TextDecoder().decode(loaded.bytes));
  const unavailable =
    member.unavailable ?? (load?.status === "failed" ? load.reason : undefined);
  const objectUrls = useRef<string[]>([]);
  useEffect(
    () => () => {
      for (const url of objectUrls.current) URL.revokeObjectURL(url);
    },
    [],
  );
  return (
    <AttachmentFrame
      name={name}
      meta={meta}
      path={`${archiveName}/${path}`}
      leading={
        <Tooltip>
          <TooltipTrigger
            data-track-owner={track("ArchiveMemberView:TooltipTrigger.1")}
            render={
              <Button
                data-track-owner={track(
                  "ArchiveMemberView:Button[Back to archive]",
                )}
                variant="ghost"
                size="icon-xs"
                aria-label="Back to archive"
                onClick={onBack}
              />
            }
          >
            <ArrowLeftGlyph className="size-(--icon-sm)" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Back to archive</TooltipContent>
        </Tooltip>
      }
      download={loaded !== undefined}
      onDownload={
        loaded === undefined
          ? undefined
          : () => {
              const href = URL.createObjectURL(
                new Blob([loaded.bytes as BlobPart], {
                  type: mediaTypeForPath(name),
                }),
              );
              objectUrls.current.push(href);
              saveUrl(href, name);
            }
      }
    >
      {unavailable !== undefined ? (
        <PaneEmptyState line={unavailable} sub={meta} />
      ) : content === undefined ? (
        <PaneLoading />
      ) : (
        <AttachmentBody content={content} sizeLabel={formatBytes} />
      )}
    </AttachmentFrame>
  );
}

export type AttachmentArchiveViewProps = {
  file: AttachmentFile;
  title?: string;
};

export function AttachmentArchiveView({
  file,
  title,
}: AttachmentArchiveViewProps) {
  const resolved = useAttachmentUrl(file, "archive", "original");
  const [ungated, setUngated] = useState(false);
  const tooLarge = file.sizeBytes > ARCHIVE_BROWSE_LIMIT;
  const gated = !tooLarge && file.sizeBytes > ARCHIVE_GATE_BYTES && !ungated;
  const [attempt, setAttempt] = useState(0);
  const archive = useArchive(
    file.fileId,
    tooLarge || gated ? undefined : resolved.url,
    attempt,
  );
  const [directory, setDirectory] = useState("");
  const [openPath, setOpenPath] = useState<string>();
  const meta = `zip · ${formatBytes(file.sizeBytes)}`;
  const url = resolved.url;
  const onDownload =
    url === undefined
      ? undefined
      : () => void downloadUrl(url, file.name).catch(() => {});
  if (archive?.status === "loaded") {
    const member =
      openPath === undefined ? undefined : archive.members.get(openPath);
    if (member !== undefined && openPath !== undefined)
      return (
        <ArchiveMemberView
          key={openPath}
          bytes={archive.bytes}
          member={member}
          path={openPath}
          archiveName={file.name}
          onBack={() => setOpenPath(undefined)}
        />
      );
    const files = [...archive.members.entries()].map(([path, entry]) => ({
      path,
      sizeBytes: entry.sizeBytes,
    }));
    const decorations = new Map(
      [...archive.members.entries()]
        .filter(([, entry]) => entry.unavailable !== undefined)
        .map(([path]) => [path, "Unavailable"] as const),
    );
    return (
      <ArchiveDirectory
        rootLabel={file.name}
        path={directory}
        files={files}
        explicitFolders={archive.folders}
        decorations={decorations}
        trailing={
          <Tooltip>
            <TooltipTrigger
              data-track-owner={track("AttachmentArchiveView:TooltipTrigger.1")}
              render={
                <Button
                  data-track-owner={track(
                    "AttachmentArchiveView:Button[Download archive]",
                  )}
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Download archive"
                  disabled={onDownload === undefined}
                  onClick={onDownload}
                />
              }
            >
              <DownloadGlyph className="size-(--icon-sm)" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Download</TooltipContent>
          </Tooltip>
        }
        onOpenDirectory={(path) => {
          setDirectory(path);
          setOpenPath(undefined);
        }}
        onOpenFile={(path) => setOpenPath(normalizeMemberPath(path))}
      />
    );
  }
  return (
    <AttachmentFrame
      name={file.name}
      meta={meta}
      path={file.sourcePath ?? title ?? file.name}
      copyPath={file.sourcePath ?? title ?? file.name}
      download
      onDownload={onDownload}
    >
      {tooLarge ? (
        <PaneEmptyState
          line="Archive is larger than 64 MB"
          sub="Download it to browse"
        />
      ) : gated ? (
        <AttachmentBody
          content={{
            kind: "gated",
            sizeBytes: file.sizeBytes,
            onLoad: () => setUngated(true),
          }}
          sizeLabel={formatBytes}
        />
      ) : (resolved.failed && !resolved.waiting) ||
        archive?.status === "failed" ? (
        <PaneEmptyState
          line={attachmentFailureLine(resolved.gone)}
          sub={meta}
          action={
            <RetryButton
              owner={track("AttachmentArchiveView:RetryButton.1")}
              onRetry={() => {
                if (resolved.failed) resolved.refresh();
                setAttempt(attempt + 1);
              }}
            />
          }
        />
      ) : archive?.status === "refused" ? (
        <PaneEmptyState line={archive.reason} sub={meta} />
      ) : (
        <PaneLoading />
      )}
    </AttachmentFrame>
  );
}
