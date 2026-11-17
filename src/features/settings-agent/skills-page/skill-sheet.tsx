import { type ReactNode, useState } from "react";
import type { DriveEntry } from "@/data/atoms/agent-context";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import {
  SideSheet,
  SideSheetBody,
  SideSheetContent,
  SideSheetDescription,
  SideSheetFooter,
  SideSheetHeader,
  SideSheetTitle,
} from "@/primitives/side-sheet";
import { Textarea } from "@/primitives/textarea";
import {
  type AgentScope,
  EditorField,
  EditorSkeleton,
  parseSkill,
  skillNameOf,
  skillNamePattern,
  skillPath,
  slugifySkillName,
  useVolumeFile,
  useVolumeWriter,
  writeSkill,
} from "../agent-scopes";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is a child
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint !== undefined && (
        <span className="text-xs text-destructive">{hint}</span>
      )}
    </label>
  );
}

/** Capy's SkillFields: the name and description of a SKILL.md. */
export function SkillFields({
  name,
  onName,
  nameNote,
  taken,
  description,
  onDescription,
  readOnly,
  autoFocus,
}: {
  name: string;
  onName?: ((name: string) => void) | undefined;
  nameNote?: string | undefined;
  taken?: boolean;
  description: string;
  onDescription: (description: string) => void;
  readOnly: boolean;
  autoFocus: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Name"
        hint={
          taken === true ? "A skill with this name already exists" : undefined
        }
      >
        <Input
          value={name}
          onChange={(event) => onName?.(slugifySkillName(event.target.value))}
          placeholder="release-check"
          maxLength={64}
          aria-invalid={taken === true || undefined}
          readOnly={readOnly}
          disabled={onName === undefined}
          autoFocus={autoFocus}
          required
        />
        {nameNote !== undefined && (
          <span className="text-xs font-normal text-muted-foreground-2">
            {nameNote}
          </span>
        )}
      </Field>
      <Field label="Description">
        <Textarea
          value={description}
          onChange={(event) => onDescription(event.target.value)}
          placeholder="When Capy should use this skill"
          rows={2}
          maxLength={1024}
          className="field-sizing-content max-h-48 min-h-16"
          readOnly={readOnly}
        />
      </Field>
    </div>
  );
}

type FormShared = {
  readOnly: boolean;
  existing: ReadonlySet<string>;
  changed: boolean;
  onReload: () => void;
  onSubmit: (name: string, content: string) => Promise<boolean>;
};

/** Whether the form may save: a new skill needs a free, valid name and a description. */
export const canSubmitSkill = ({
  isNew,
  name,
  description,
  taken,
  composed,
  original,
}: {
  isNew: boolean;
  name: string;
  description: string;
  taken: boolean;
  composed: string;
  original: string;
}) =>
  isNew
    ? skillNamePattern.test(name) && !taken && description.trim() !== ""
    : composed !== original;

export function SkillForm({
  text,
  name: initialName,
  existing,
  readOnly,
  changed,
  onReload,
  onDelete,
  onSubmit,
}: FormShared & {
  text: string;
  name: string | undefined;
  onDelete?: () => void;
}) {
  const isNew = initialName === undefined;
  const [doc] = useState(() => parseSkill(text));
  const [name, setName] = useState(initialName ?? "");
  const [description, setDescription] = useState(doc.description);
  const [body, setBody] = useState(doc.body);
  const [saving, setSaving] = useState(false);
  const taken = isNew && existing.has(name);
  const composed = writeSkill(
    doc,
    isNew ? name : doc.name,
    description.trim(),
    body,
  );
  const valid = canSubmitSkill({
    isNew,
    name,
    description,
    taken,
    composed,
    original: text,
  });
  const save = () => {
    if (readOnly || saving || !valid) return;
    setSaving(true);
    void onSubmit(name, composed).then(() => setSaving(false));
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SideSheetBody className="gap-4 pt-4">
        <SkillFields
          name={name}
          onName={isNew ? setName : undefined}
          nameNote={isNew ? undefined : "The skill's folder name"}
          taken={taken}
          description={description}
          onDescription={setDescription}
          readOnly={readOnly}
          autoFocus={isNew}
        />
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Instructions
          </span>
          <EditorField
            initial={doc.body}
            placeholder="What Capy does when it uses this skill, in markdown"
            readOnly={readOnly}
            onChange={setBody}
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground-2">
          <span className="truncate">
            {skillPath(name === "" ? "name" : name)}
          </span>
          <span className="tabular-nums">
            {readOnly
              ? "Read only"
              : `${composed.length.toLocaleString("en-US")} characters`}
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
              disabled={!valid || saving}
              aria-busy={saving || undefined}
            >
              {isNew ? "Create skill" : "Save"}
            </Button>
          </div>
        </SideSheetFooter>
      )}
    </div>
  );
}

function LoadedSkill({
  entry,
  ...rest
}: FormShared & { entry: DriveEntry; name: string; onDelete: () => void }) {
  const { content, failed, retry } = useVolumeFile(entry);
  if (failed)
    return (
      <SideSheetBody className="flex flex-col items-start gap-3 pt-5">
        <p className="text-sm text-muted-foreground-2">
          Could not load this skill
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
  return <SkillForm text={content.text} {...rest} />;
}

type LiveFiles = {
  entries: ReadonlyArray<DriveEntry>;
  headDigest: string | null;
};

/** Capy's skill side sheet: create, edit or delete one skill in a scope. */
export function SkillSheet({
  scope,
  name,
  live,
  onClose,
}: {
  scope: AgentScope;
  name: string | undefined;
  live: LiveFiles | undefined;
  onClose: () => void;
}) {
  const [opened, setOpened] = useState(live);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (opened === undefined && live !== undefined) setOpened(live);
  const path = name === undefined ? undefined : skillPath(name);
  const entry = opened?.entries.find((candidate) => candidate.path === path);
  const liveEntry = live?.entries.find((candidate) => candidate.path === path);
  const writer = useVolumeWriter({
    scope: scope.scope,
    headDigest: opened?.headDigest ?? null,
    onReload: () => setOpened(live),
  });
  const shared: FormShared = {
    readOnly: scope.readOnly === true,
    existing: new Set(
      (opened?.entries ?? []).flatMap((file) => skillNameOf(file.path) ?? []),
    ),
    changed: live !== undefined && liveEntry?.sha256 !== entry?.sha256,
    onReload: () => setOpened(live),
    onSubmit: (skillName, content) =>
      writer
        .put(
          [{ path: skillPath(skillName), content }],
          name === undefined ? "Skill created" : "Skill saved",
          name === undefined
            ? "Could not create skill"
            : "Could not save skill",
        )
        .then((saved) => {
          if (saved) onClose();
          return saved;
        }),
  };
  const title = name ?? "New skill";
  const remove = () => {
    if (name === undefined) return;
    setDeleting(true);
    void writer
      .put(
        (opened?.entries ?? [])
          .filter((file) => file.path.startsWith(`skills/${name}/`))
          .map((file) => ({ path: file.path, delete: true as const })),
        "Skill deleted",
        "Could not delete skill",
      )
      .then((deleted) => {
        setDeleting(false);
        setConfirming(false);
        if (deleted) onClose();
      });
  };
  return (
    <SideSheet open onOpenChange={(open) => !open && onClose()}>
      <SideSheetContent aria-label={title}>
        <SideSheetHeader>
          <SideSheetTitle>{title}</SideSheetTitle>
          <SideSheetDescription>
            {scope.captain === undefined
              ? scope.audience
              : `Crew threads of ${scope.captain}`}
          </SideSheetDescription>
        </SideSheetHeader>
        {opened === undefined ? (
          <EditorSkeleton />
        ) : name === undefined ? (
          <SkillForm text="" name={undefined} {...shared} />
        ) : entry === undefined ? (
          <SideSheetBody>
            <p className="text-sm text-muted-foreground-2">
              This skill was deleted
            </p>
          </SideSheetBody>
        ) : (
          <LoadedSkill
            key={entry.sha256}
            entry={entry}
            name={name}
            onDelete={() => setConfirming(true)}
            {...shared}
          />
        )}
      </SideSheetContent>
      {name !== undefined && (
        <Dialog open={confirming} onOpenChange={setConfirming}>
          <DialogOverlay />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {name}</DialogTitle>
              <DialogDescription>
                Removes skills/{name} and every file in it from {scope.name}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                disabled={deleting}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                intent="danger"
                disabled={deleting}
                aria-busy={deleting || undefined}
                onClick={remove}
              >
                Delete skill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </SideSheet>
  );
}
