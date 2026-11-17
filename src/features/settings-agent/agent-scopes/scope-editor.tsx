import { useState } from "react";
import type { DriveEntry } from "@/data/atoms/agent-context";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { SideSheetBody, SideSheetFooter } from "@/primitives/side-sheet";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Textarea } from "@/primitives/textarea";
import { useVolumeFile } from "./volume-file";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const proseClass = "px-2.5 py-1.5 text-sm";

/** Placeholder while a scope file loads. */
export function EditorSkeleton() {
  return (
    <SideSheetBody className="gap-2.5 pt-5">
      <SkeletonPanel className="h-4 w-2/3" />
      <SkeletonPanel className="h-4 w-1/2" />
      <SkeletonPanel className="h-4 w-3/5" />
    </SideSheetBody>
  );
}

export type EditorFieldProps = {
  initial: string;
  placeholder: string;
  readOnly: boolean;
  onChange: (text: string) => void;
};

/** The markdown field of a scope file: read-only text, or an editor. */
export function EditorField({
  initial,
  placeholder,
  readOnly,
  onChange,
}: EditorFieldProps) {
  return (
    <div className="flex min-h-64 flex-1 flex-col overflow-y-auto overscroll-contain border-hairline border-border-1">
      {readOnly ? (
        initial.trim() === "" ? (
          <p className={cx(proseClass, "text-muted-foreground-3")}>Empty</p>
        ) : (
          <div className={cx(proseClass, "whitespace-pre-wrap")}>{initial}</div>
        )
      ) : (
        <Textarea
          variant="editor"
          defaultValue={initial}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cx(proseClass, "flex flex-1 flex-col")}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

export type DraftEditorProps = {
  initial: string;
  path: string;
  placeholder: string;
  cap?: number;
  readOnly: boolean;
  changed: boolean;
  onReload: () => void;
  onDelete?: () => void;
  onSave: (text: string) => Promise<boolean>;
  onSaved: () => void;
};

/** Capy's DraftEditor: one scope file with its size meter and save bar. */
export function DraftEditor({
  initial,
  path,
  placeholder,
  cap,
  readOnly,
  changed,
  onReload,
  onDelete,
  onSave,
  onSaved,
}: DraftEditorProps) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = text !== initial;
  const length = text.length.toLocaleString("en-US");
  const save = () => {
    if (readOnly || saving || !dirty) return;
    setSaving(true);
    void onSave(text).then((saved) => {
      setSaving(false);
      if (saved) onSaved();
    });
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SideSheetBody className="gap-2 pt-4">
        <EditorField
          initial={initial}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={setText}
        />
        <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground-2">
          <span className="truncate">{path}</span>
          <span className="flex items-center gap-2 tabular-nums">
            {cap !== undefined && text.length > cap && (
              <Badge size="xs" color="warning">
                Threads read the first {cap.toLocaleString("en-US")}
              </Badge>
            )}
            {readOnly
              ? "Read only"
              : cap === undefined
                ? `${length} characters`
                : `${length} of ${cap.toLocaleString("en-US")}`}
          </span>
        </div>
      </SideSheetBody>
      {!readOnly && (
        <SideSheetFooter className="items-center justify-between">
          {changed ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground-2">
              Changed since you opened it
              <Button
                type="button"
                variant="link"
                size="auto-xs"
                onClick={onReload}
              >
                Reload
              </Button>
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {onDelete !== undefined && (
              <Button
                type="button"
                variant="ghost"
                intent="danger"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              intent="accent"
              onClick={save}
              disabled={!dirty || saving}
              aria-busy={saving || undefined}
            >
              Save
            </Button>
          </div>
        </SideSheetFooter>
      )}
    </div>
  );
}

/** Capy's LoadedEditor: fetches a scope file, then edits it. */
export function LoadedEditor({
  entry,
  ...rest
}: Omit<DraftEditorProps, "initial"> & { entry: DriveEntry }) {
  const { content, failed, retry } = useVolumeFile(entry);
  if (failed)
    return (
      <SideSheetBody className="flex flex-col items-start gap-3 pt-5">
        <p className="text-sm text-muted-foreground-2">
          Could not load this file
        </p>
        <Button variant="outline" size="sm" onClick={retry}>
          Retry
        </Button>
      </SideSheetBody>
    );
  if (content === undefined) return <EditorSkeleton />;
  if (content.kind !== "text")
    return (
      <SideSheetBody className="pt-5">
        <p className="text-sm text-muted-foreground-2">
          This file is not text, open it in Drive
        </p>
      </SideSheetBody>
    );
  return <DraftEditor initial={content.text} {...rest} />;
}
