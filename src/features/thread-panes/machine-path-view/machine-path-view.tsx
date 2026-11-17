import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { FileView, Preview, PreviewSource } from "@/components/file-view";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  driveListingAtom,
  driveWriteAtom,
  machineFileAtom,
  writeMachineFileAtom,
} from "@/data/atoms/machine-files";
import { organizationsAtom } from "@/data/atoms/session";
import { Breadcrumb, BreadcrumbItem } from "@/primitives/breadcrumb";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { CopyMachineFileDialog } from "./copy-machine-file-dialog";
import {
  canCopyFile,
  copyBody,
  fileName,
  formattedBytes,
  isPreviewable,
  type MachinePathViewProps,
  relativePath,
} from "./logic";
import {
  EmptyState,
  MachineFileMiss,
  MachinePathUnavailable,
  RetryButton,
} from "./machine-states";
import { parseDriveEntries, parseMachineFile, parseWriteResult } from "./parse";

export type MachinePathBodyProps = {
  path: string;
  file: ReturnType<typeof parseMachineFile> | undefined;
  loading: boolean;
  unreachable: boolean;
  dormant?: boolean;
  now?: number;
  onRetry: () => void;
  onOpenDiffs?: () => void;
  onCopy: () => void;
  actions?: ReactNode;
};

/** Presentational body: file content, the miss state and the unavailable card. */
export function MachinePathBody({
  path,
  file,
  loading,
  unreachable,
  dormant,
  now,
  onRetry,
  onOpenDiffs,
  onCopy,
  actions,
}: MachinePathBodyProps) {
  const name = fileName(path);
  if (file === undefined) {
    if (loading && !unreachable && dormant !== true)
      return (
        <div
          data-slot="machine-path-loading"
          role="status"
          aria-label="Loading file"
          className="flex flex-1 items-center justify-center p-6"
        >
          <Icon name="dots" size="sm" className="animate-spin" />
        </div>
      );
    return (
      <MachinePathUnavailable
        pending={loading}
        onRetry={onRetry}
        action={
          <>
            <EmptyState
              line="Machine is unreachable"
              sub="Machine unavailable, showing the last read"
              action={
                <>
                  <Button size="xs" variant="ghost" onClick={onCopy}>
                    Copy to Drive
                  </Button>
                  <RetryButton onRetry={onRetry} pending={loading} />
                </>
              }
            />
            <div className="flex flex-col items-center gap-2 px-4 pb-6 text-center text-xs text-muted-foreground-2">
              <span>Copy to Drive needs a complete read of this file</span>
              <span>Connect the machine or wake it to read the file first</span>
              <Button size="xs" variant="ghost" disabled>
                Copy to Drive
              </Button>
            </div>
          </>
        }
      />
    );
  }
  if (file.content === null)
    return (
      <MachineFileMiss path={path} device={false} onOpenDiffs={onOpenDiffs} />
    );
  const previewable = isPreviewable(file, name, file.content.sizeBytes);
  return (
    <FileView
      data-slot="machine-path-file-view"
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <Preview className="flex min-h-0 flex-1 flex-col">
        <PreviewSource className="min-h-0 flex-1 overflow-auto font-mono text-code-block whitespace-pre-wrap text-foreground">
          {file.content.content ?? ""}
        </PreviewSource>
        {!previewable && (
          <div className="px-2 py-1 text-2xs text-muted-foreground-2">
            {formattedBytes(file.content.sizeBytes)}
            {now === undefined ? "" : " · last read"}
          </div>
        )}
      </Preview>
      {dormant === true && (
        <div className="px-2 py-1 text-2xs text-muted-foreground-2">
          This machine is asleep
        </div>
      )}
      {actions}
    </FileView>
  );
}

export type MachinePathConnectedProps = MachinePathViewProps & {
  orgId?: OrgId;
};

function useCurrentOrgId(): OrgId | undefined {
  const organizations = useAtomValue(organizationsAtom);
  return AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
}

function splitPath(path: string, machineHome?: string) {
  const home = machineHome?.replace(/\/+$/, "");
  if (home !== undefined && (path === home || path.startsWith(`${home}/`)))
    return { home, path: path.slice(home.length) || "/" };
  return { home: "", path };
}

/** Connected pane for a machine path: reads files.read, offers save and Copy to Drive. */
export function MachinePathView({
  tabId,
  jamId,
  path,
  machineHome,
  workspaceRoot,
  dormant,
  onOpenFile,
  onViewport,
  onOpenDiffs,
  orgId,
}: MachinePathConnectedProps) {
  const currentOrgId = useCurrentOrgId();
  const resolvedOrgId = orgId ?? currentOrgId;
  const [copyOpen, setCopyOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  if (resolvedOrgId === undefined) return null;
  return (
    <ConnectedBody
      orgId={resolvedOrgId}
      tabId={tabId}
      jamId={jamId}
      path={path}
      machineHome={machineHome}
      workspaceRoot={workspaceRoot}
      dormant={dormant}
      copyOpen={copyOpen}
      onOpenCopy={() => setCopyOpen(true)}
      onCloseCopy={() => setCopyOpen(false)}
      saving={saving}
      setSaving={setSaving}
      onOpenFile={onOpenFile}
      onViewport={onViewport}
      onOpenDiffs={onOpenDiffs}
    />
  );
}

type BodyProps = MachinePathViewProps & {
  orgId: OrgId;
  copyOpen: boolean;
  onOpenCopy: () => void;
  onCloseCopy: () => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
};

function ConnectedBody({
  orgId,
  tabId,
  jamId,
  path,
  machineHome,
  workspaceRoot,
  dormant,
  copyOpen,
  onOpenCopy,
  onCloseCopy,
  saving,
  setSaving,
  onOpenFile,
  onViewport,
  onOpenDiffs,
}: BodyProps) {
  const fileAtom = machineFileAtom(orgId, jamId, path);
  const driveAtom = driveListingAtom(orgId);
  const fileResult = useAtomValue(fileAtom);
  const driveResult = useAtomValue(driveAtom);
  const refreshFile = useAtomRefresh(fileAtom);
  const refreshDrive = useAtomRefresh(driveAtom);
  const writeFile = useAtomSet(writeMachineFileAtom, { mode: "promiseExit" });
  const writeDrive = useAtomSet(driveWriteAtom, { mode: "promiseExit" });
  const file = AsyncResult.isSuccess(fileResult)
    ? parseMachineFile(fileResult.value)
    : undefined;
  const driveEntries = AsyncResult.isSuccess(driveResult)
    ? parseDriveEntries(driveResult.value)
    : undefined;
  const name = fileName(path);
  const copyable = file !== undefined && canCopyFile(file);
  const body = file === undefined ? undefined : copyBody(file);
  const breadcrumb = splitPath(path, machineHome);

  const save = () => {
    if (file === undefined || saving) return;
    const content = file.content?.content;
    if (
      file.content === null ||
      file.content.binary ||
      file.content.truncated ||
      content === undefined
    ) {
      toast.error("Could not read the draft");
      return;
    }
    if (file.sha === null) {
      toast.error("Machine unavailable", {
        description: "Copy your changes to Drive or reconnect before saving",
      });
      return;
    }
    setSaving(true);
    writeFile({
      params: { orgId, jamId },
      payload: { path, content, baseSha: file.sha },
    }).then((exit) => {
      setSaving(false);
      if (exit._tag === "Failure") toast.error("Could not save file");
      else toast.success("File saved to machine");
      refreshFile();
    });
  };

  const copy = async (
    drivePath: string,
    copyBodyValue: NonNullable<typeof body>,
  ) => {
    await writeDrive({
      params: { orgId },
      payload: {
        path: drivePath,
        ...(copyBodyValue.kind === "text"
          ? { content: copyBodyValue.content }
          : { contentBase64: copyBodyValue.contentBase64 }),
      },
      reactivityKeys: [`volume:${orgId}`],
    }).then((exit) => {
      if (exit._tag === "Failure") throw new Error("Drive write failed");
      return parseWriteResult(exit.value);
    });
    refreshDrive();
  };

  return (
    <div
      data-slot="machine-path-view"
      className="relative flex min-h-0 min-w-0 flex-1 flex-col"
      onViewportCapture={onViewport}
    >
      <div
        data-slot="machine-path-header"
        className="flex h-8 shrink-0 items-center gap-2 border-b-(length:--border-width-hairline) border-border-1 px-2 text-xs text-muted-foreground-2"
      >
        <Breadcrumb
          data-slot="machine-path-breadcrumb"
          className="flex min-w-0 items-center gap-1"
        >
          {breadcrumb.home !== "" && (
            <>
              <BreadcrumbItem className="shrink-0">
                {breadcrumb.home}
              </BreadcrumbItem>
              <Icon name="chevron-right" className="size-(--icon-xs)" />
            </>
          )}
          <BreadcrumbItem className="min-w-0 truncate text-foreground">
            {name}
          </BreadcrumbItem>
          <BreadcrumbItem className="min-w-0 truncate">
            {relativePath(breadcrumb.path, workspaceRoot)}
          </BreadcrumbItem>
        </Breadcrumb>
        <span
          data-slot="machine-path-actions"
          className="ml-auto flex shrink-0 items-center gap-1"
        >
          {copyable && (
            <Button size="xs" variant="ghost" onClick={onOpenCopy}>
              Copy to Drive
            </Button>
          )}
          <Button size="xs" variant="ghost" onClick={refreshFile}>
            Retry
          </Button>
        </span>
      </div>
      <MachinePathBody
        path={path}
        file={file}
        loading={AsyncResult.isInitial(fileResult)}
        unreachable={AsyncResult.isFailure(fileResult)}
        dormant={dormant}
        onRetry={refreshFile}
        onOpenDiffs={onOpenDiffs}
        onCopy={onOpenCopy}
        actions={
          <div
            data-tab-id={tabId}
            data-slot="machine-path-file-actions"
            className="flex items-center gap-2 px-2 py-1"
          >
            <Button
              size="xs"
              variant="ghost"
              onClick={save}
              disabled={saving || !copyable}
            >
              <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive">
                <Icon name="floppy-disk-1" size="xs" />
              </span>
              Save
            </Button>
            <Button
              size="xs"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setSaving(false);
                onOpenFile?.(path);
              }}
            >
              <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive">
                <Icon name="x" size="xs" />
              </span>
              Discard changes
            </Button>
            {onOpenFile !== undefined && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onOpenFile(path)}
              >
                Open file
              </Button>
            )}
          </div>
        }
      />
      {copyOpen && body !== undefined && (
        <CopyMachineFileDialog
          name={name}
          body={body}
          driveEntries={driveEntries}
          driveUnavailable={AsyncResult.isFailure(driveResult)}
          onRetryDrive={() => {
            refreshDrive();
            refreshFile();
          }}
          onCopy={copy}
          onClose={onCloseCopy}
        />
      )}
    </div>
  );
}
