import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useEffect, useState } from "react";
import { driveFileAtom } from "@/data/atoms/drive";
import { formatBytes } from "@/features/drive/lib/format";
import {
  parseSkillDocument,
  skillPathPattern,
} from "@/features/drive/volume-authoring";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Kbd } from "@/primitives/kbd";
import { MenuContent, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Textarea } from "@/primitives/textarea";
import { changedUnderDraft, type FileDraft, type LoadedFile } from "./draft";
import { draftText, setDraftText } from "./draft-text";
import { DelayedPaneMessage, PaneMessage } from "./pane-message";
import type { DriveEntry } from "./use-drive-listing";

const menuIconClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const saveShortcut = "⌘S";

const isSymlink = (mode: number) => (mode & 61440) === 40960 || mode === 120000;

export interface ViewerChromeProps {
  readonly entry: DriveEntry;
  readonly onBack: () => void;
  readonly onCrumb: (directory: string) => void;
  readonly onSave?: () => void;
  readonly onDiscard?: () => void;
  readonly onDelete?: () => void;
  readonly saving: boolean;
  readonly children: ReactNode;
}

/** The frame around an open drive file: mobile back row, path, size or save state, actions. */
export function ViewerChrome({
  entry,
  onBack,
  onCrumb,
  onSave,
  onDiscard,
  onDelete,
  saving,
  children,
}: ViewerChromeProps) {
  const segments = entry.path.split("/");
  const name = segments.at(-1) ?? entry.path;
  const dirty = onSave !== undefined;
  const hasActions = dirty || onDelete !== undefined;
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
      <div className="flex h-9 shrink-0 items-center border-b-(length:--border-width-hairline) border-border-1 px-2 md:hidden">
        <Button variant="ghost" size="xs" onClick={onBack}>
          <Icon name="arrow-left" />
          Files
        </Button>
      </div>
      <div className="flex min-h-9 shrink-0 items-center gap-2 border-b-(length:--border-width-hairline) border-border-1 px-3">
        <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm">
          {segments.slice(0, -1).map((segment, index) => (
            <span
              key={segments.slice(0, index + 1).join("/")}
              className="contents"
            >
              <button
                type="button"
                className="min-w-0 truncate rounded text-muted-foreground-2 outline-none hover:text-foreground focus-visible:outline-ring-inset"
                onClick={() => onCrumb(segments.slice(0, index + 1).join("/"))}
              >
                {segment}
              </button>
              <Icon
                name="chevron-right-small"
                className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
              />
            </span>
          ))}
          <span className="min-w-0 truncate font-medium text-foreground">
            {name}
          </span>
        </nav>
        <span className="shrink-0 text-xs text-muted-foreground-2 tabular-nums">
          {dirty ? "Unsaved changes" : formatBytes(entry.sizeBytes)}
        </span>
        {dirty && (
          <Button
            type="button"
            variant="solid"
            size="xs"
            disabled={saving}
            onClick={onSave}
            aria-keyshortcuts="Meta+S"
          >
            Save
            <Kbd variant="chip" className="pointer-coarse:hidden">
              {saveShortcut}
            </Kbd>
          </Button>
        )}
        {hasActions && (
          <ResponsiveMenu>
            <MenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="File actions"
                />
              }
            >
              <Icon name="chevron-down-small" />
            </MenuTrigger>
            <MenuContent align="end" className="w-52">
              {onSave !== undefined && (
                <ResponsiveMenuItem disabled={saving} onClick={onSave}>
                  <span className={menuIconClassName}>
                    <Icon name="floppy-disk-1" />
                  </span>
                  Save
                  <Kbd variant="chip" className="ml-auto pointer-coarse:hidden">
                    {saveShortcut}
                  </Kbd>
                </ResponsiveMenuItem>
              )}
              {onDiscard !== undefined && (
                <ResponsiveMenuItem disabled={saving} onClick={onDiscard}>
                  <span className={menuIconClassName}>
                    <Icon name="arrow-undo-up" />
                  </span>
                  Discard changes
                </ResponsiveMenuItem>
              )}
              {onDelete !== undefined && (
                <ResponsiveMenuItem data-intent="danger" onClick={onDelete}>
                  <span className={menuIconClassName}>
                    <Icon name="trash-can" />
                  </span>
                  Delete file
                </ResponsiveMenuItem>
              )}
            </MenuContent>
          </ResponsiveMenu>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {children}
      </div>
    </section>
  );
}

export interface LoadedVolumeFileProps {
  readonly orgId: string;
  readonly entry: DriveEntry;
  readonly draft: FileDraft;
  readonly stateKey: string;
  readonly saving: boolean;
  readonly writable: boolean;
  readonly onDirty: (loaded: LoadedFile) => void;
  readonly onSave: () => void;
  readonly onDiscard: () => void;
  readonly onDelete?: () => void;
  readonly onBack: () => void;
  readonly onCrumb: (directory: string) => void;
}

/** An open drive file: its content, and an editor when the scope is writable. */
export function LoadedVolumeFile({
  orgId,
  entry,
  draft,
  stateKey,
  saving,
  writable,
  onDirty,
  onSave,
  onDiscard,
  onDelete,
  onBack,
  onCrumb,
}: LoadedVolumeFileProps) {
  const result = useAtomValue(
    driveFileAtom(orgId, entry.volume.id, entry.versionId, entry.sha256),
  );
  const file = Option.getOrUndefined(AsyncResult.value(result));
  const dirty = draft.state === "dirty" && draft.path === entry.path;
  const conflict = changedUnderDraft(entry, draft);
  const editable = !isSymlink(entry.mode) && writable;
  const [, rerender] = useState(0);
  useEffect(() => {
    if (!dirty) return;
    const save = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", save);
    return () => window.removeEventListener("keydown", save);
  }, [dirty, onSave]);

  const body = () => {
    if (file === undefined) {
      return AsyncResult.isFailure(result) ? (
        <PaneMessage line="File unavailable" />
      ) : (
        <DelayedPaneMessage line="Loading file" />
      );
    }
    if (file.type === "url") return <PaneMessage line="No preview" />;
    const skill = skillPathPattern.test(entry.path)
      ? parseSkillDocument(file.content)
      : undefined;
    const text = draftText(stateKey) ?? file.content;
    return (
      <>
        {conflict && (
          <div className="flex min-h-8 shrink-0 items-center gap-2 border-b-(length:--border-width-hairline) border-border-1 px-3 text-2xs text-muted-foreground-2">
            <span className="min-w-0 flex-1 truncate">
              This file changed since you started editing
            </span>
            <Button variant="ghost" size="xs" onClick={onDiscard}>
              <Icon name="arrow-rotate-clockwise" />
              Reload
            </Button>
          </div>
        )}
        {skill?.description !== undefined && !dirty && (
          <p className="mx-4 mt-4 text-sm font-normal text-muted-foreground-2">
            {skill.description}
          </p>
        )}
        {editable ? (
          <Textarea
            aria-label={entry.path}
            value={text}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none p-4 font-mono text-sm"
            onChange={(event) => {
              setDraftText(stateKey, event.target.value);
              rerender((count) => count + 1);
              onDirty({
                path: entry.path,
                volumeId: entry.volume.id,
                versionId: entry.versionId,
                sizeBytes: entry.sizeBytes,
                sha256: entry.sha256,
              });
            }}
          />
        ) : (
          <pre className="p-4 font-mono text-sm whitespace-pre-wrap text-foreground">
            {text}
          </pre>
        )}
      </>
    );
  };

  return (
    <ViewerChrome
      entry={entry}
      onBack={onBack}
      onCrumb={onCrumb}
      onSave={dirty ? onSave : undefined}
      onDiscard={dirty ? onDiscard : undefined}
      onDelete={dirty ? undefined : onDelete}
      saving={saving}
    >
      {body()}
    </ViewerChrome>
  );
}
