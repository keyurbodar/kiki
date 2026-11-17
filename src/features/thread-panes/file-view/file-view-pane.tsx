import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
  FileBody,
  FileChrome,
  FileEmpty,
  type FileHome,
  FileLoading,
  fileMeta,
  fileName,
  MenuIcon,
  type ViewportHandler,
} from "@/components/file-view";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Kbd } from "@/primitives/kbd";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import {
  contentFromBlob,
  decodeMachineFile,
  type MachineFileRead,
  machineFileGated,
  machineFileMiss,
} from "./machine-file";
import { machineFileAtom, machineFileKey } from "./machine-file-atom";

const track = (owner: string) => `features/thread/pane/file-view.tsx#${owner}`;

export class FileSaveConflict extends Error {
  readonly _tag = "FileSaveConflict";
}

export type FileDraft = {
  state: "clean" | "dirty" | "saved";
  stale?: boolean;
  saveShortcut?: string;
  onSave: () => Promise<void>;
  onDiscard: () => void;
};

export type FileStored = { state: string; action?: ReactNode };

export type MachineFileState =
  | { status: "loading" }
  | { status: "failed"; waiting?: boolean }
  | { status: "ready"; file: MachineFileRead };

export type FileViewPaneBodyProps = {
  path: string;
  home: FileHome;
  read: MachineFileState;
  onRetry?: () => void;
  machine?: "missing" | "asleep";
  onRetryMachine?: () => void;
  device?: boolean;
  stored?: FileStored;
  draft?: FileDraft;
  onOpenDiffs?: () => void;
  onViewport?: ViewportHandler;
  cacheKey?: string;
};

function RetryButton({
  owner,
  onRetry,
  pending,
}: {
  owner: string;
  onRetry?: () => void;
  pending?: boolean;
}) {
  if (onRetry === undefined) return null;
  return (
    <Button
      data-track-owner={track(`${owner}:RetryButton.1`)}
      variant="ghost"
      size="xs"
      disabled={pending}
      onClick={onRetry}
    >
      Retry
    </Button>
  );
}

function saveFailure(error: unknown) {
  toast.error(
    error instanceof FileSaveConflict
      ? "Capy changed this file since you loaded it"
      : "Could not save file",
  );
}

function DraftActions({ draft }: { draft: FileDraft }) {
  const [saving, setSaving] = useState(false);
  if (draft.state !== "dirty") return undefined;
  const save = () => {
    if (saving) return;
    setSaving(true);
    draft
      .onSave()
      .catch(saveFailure)
      .finally(() => setSaving(false));
  };
  return (
    <>
      <ResponsiveMenuItem
        data-track-owner={track("LocatedFileBody:ResponsiveMenuItem[Save]")}
        disabled={saving}
        onClick={save}
        aria-keyshortcuts={draft.saveShortcut}
      >
        <MenuIcon>
          <Icon name="floppy-disk-1" size="sm" />
        </MenuIcon>
        Save
        {draft.saveShortcut !== undefined && (
          <Kbd variant="chip" className="ml-auto pointer-coarse:hidden">
            {draft.saveShortcut}
          </Kbd>
        )}
      </ResponsiveMenuItem>
      <ResponsiveMenuItem
        data-track-owner={track(
          "LocatedFileBody:ResponsiveMenuItem[Discard changes]",
        )}
        disabled={saving}
        onClick={draft.onDiscard}
      >
        <MenuIcon>
          <Icon name="arrow-corner-left-up" size="sm" />
        </MenuIcon>
        Discard changes
      </ResponsiveMenuItem>
    </>
  );
}

function StoredBanner({ stored }: { stored: FileStored }) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-1 border-b-hairline border-border-1 bg-card pr-1.5 pl-3 text-xs text-muted-foreground-2">
      <span className="min-w-0 flex-1 truncate">
        {stored.state}, showing the last completed turn
      </span>
      {stored.action}
    </div>
  );
}

function StaleBanner({ onReload }: { onReload: () => void }) {
  return (
    <div className="flex min-h-8 shrink-0 items-center gap-2 border-b-hairline border-border-1 px-3 text-2xs text-muted-foreground-2">
      <span className="min-w-0 flex-1 truncate">
        Capy changed this file since you started editing
      </span>
      <Button
        data-track-owner={track("GitFile:Button[Reload]")}
        variant="ghost"
        size="xs"
        onClick={onReload}
      >
        <Icon name="rotate" size="sm" />
        Reload
      </Button>
    </div>
  );
}

function MachineFileBody({
  path,
  read,
  onRetry,
  device,
  stored,
  draft,
  onOpenDiffs,
  cacheKey,
  rendered,
}: FileViewPaneBodyProps & { rendered: boolean }) {
  const [loadAnyway, setLoadAnyway] = useState(false);
  if (read.status === "loading") return <FileLoading />;
  if (read.status === "failed")
    return (
      <FileEmpty
        line="File unavailable"
        action={
          <RetryButton
            owner="MachineFileBody"
            onRetry={onRetry}
            pending={read.waiting}
          />
        }
      />
    );
  const blob = read.file.content;
  if (blob === null) {
    const miss = machineFileMiss(path, device === true);
    return (
      <FileEmpty
        line={miss.line}
        sub={miss.sub}
        action={
          onOpenDiffs === undefined ? undefined : (
            <Button
              data-track-owner="features/thread/pane/machine-path-view.tsx#MachineFileMiss:Button[Open diffs]"
              size="xs"
              variant="ghost"
              onClick={onOpenDiffs}
            >
              Open diffs
            </Button>
          )
        }
      />
    );
  }
  const name = fileName(path);
  const sizeBytes = blob.sizeBytes ?? 0;
  const meta = fileMeta(name, sizeBytes);
  const key = read.file.sha ?? `${cacheKey ?? path}:${sizeBytes}`;
  const content =
    machineFileGated(path, blob) && !loadAnyway
      ? {
          kind: "gated" as const,
          sizeBytes,
          onLoad: () => setLoadAnyway(true),
        }
      : contentFromBlob(blob, sizeBytes, false, name);
  return (
    <>
      {stored !== undefined && <StoredBanner stored={stored} />}
      {draft?.stale === true && <StaleBanner onReload={draft.onDiscard} />}
      <FileBody
        content={content}
        name={name}
        meta={meta}
        cacheKey={key}
        rendered={rendered}
      />
    </>
  );
}

export function FileViewPaneBody(props: FileViewPaneBodyProps) {
  const {
    path,
    home,
    machine,
    onRetryMachine,
    draft,
    onOpenDiffs,
    onViewport,
  } = props;
  const name = fileName(path);
  if (machine !== undefined)
    return (
      <FileChrome home={home} path={path} name={name} onViewport={onViewport}>
        {() =>
          machine === "missing" ? (
            <FileEmpty
              line="Couldn't find the machine that holds this file"
              sub="This file is on another machine"
              action={<RetryButton owner="FileLane" onRetry={onRetryMachine} />}
            />
          ) : (
            <FileEmpty
              line="That machine isn't running"
              sub="This file opens once the machine that holds it is awake"
            />
          )
        }
      </FileChrome>
    );
  return (
    <FileChrome
      home={home}
      path={path}
      name={name}
      onOpenDiffs={onOpenDiffs}
      onViewport={onViewport}
      actions={draft === undefined ? undefined : <DraftActions draft={draft} />}
    >
      {(rendered) => (
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <MachineFileBody key={path} {...props} rendered={rendered} />
        </div>
      )}
    </FileChrome>
  );
}

export type FileViewPaneProps = {
  threadId: string;
  orgId: string;
  path: string;
  machineId?: string;
  home?: FileHome;
  machine?: "missing" | "asleep";
  onRetryMachine?: () => void;
  device?: boolean;
  stored?: FileStored;
  draft?: FileDraft;
  onOpenDiffs?: () => void;
  onViewport?: ViewportHandler;
};

export function FileViewPane({
  threadId,
  orgId,
  path,
  machineId,
  home = { kind: "machine", jamId: threadId },
  ...rest
}: FileViewPaneProps) {
  const key = { orgId, jamId: threadId, path, machineId };
  const atom = machineFileAtom(key);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const value = Option.getOrUndefined(AsyncResult.value(result));
  const file = value === undefined ? undefined : decodeMachineFile(value);
  const read: MachineFileState =
    file !== undefined
      ? { status: "ready", file }
      : value !== undefined || AsyncResult.isFailure(result)
        ? { status: "failed", waiting: result.waiting }
        : { status: "loading" };
  return (
    <FileViewPaneBody
      {...rest}
      path={path}
      home={home}
      read={read}
      onRetry={refresh}
      cacheKey={machineFileKey(key)}
    />
  );
}
