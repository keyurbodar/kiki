import { type DragEvent, type ReactElement, useRef, useState } from "react";
import { PlusIcon, SparkleIcon, UploadIcon } from "@/features/drive/icons";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { MenuContent, MenuSeparator, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { newFilePath, skillNamePattern, skillSlug } from "./authoring";
import { filesFromDrop, filesFromList, type UploadFile } from "./upload";

const menuIconClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export interface VolumeAddMenuProps {
  readonly hasInstructions: boolean;
  /** `uploads` hides the authoring items and keeps only the upload rows. */
  readonly only?: "uploads";
  /** Replaces the default ghost Add icon button. */
  readonly trigger?: ReactElement;
  readonly onNewFile: () => void;
  readonly onNewSkill: () => void;
  readonly onAddInstructions: () => void;
  readonly onUploads: (files: Array<UploadFile>) => void;
}

/** The drive's Add menu: new file, new skill, instructions and uploads. */
export function VolumeAddMenu({
  hasInstructions,
  only,
  trigger,
  onNewFile,
  onNewSkill,
  onAddInstructions,
  onUploads,
}: VolumeAddMenuProps) {
  const filesInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  return (
    <>
      <ResponsiveMenu>
        {trigger === undefined ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <MenuTrigger
                  render={
                    <Button variant="ghost" size="icon-xs" aria-label="Add" />
                  }
                >
                  <PlusIcon />
                </MenuTrigger>
              }
            />
            <TooltipContent side="bottom">Add</TooltipContent>
          </Tooltip>
        ) : (
          <MenuTrigger render={trigger} />
        )}
        <MenuContent
          align={trigger === undefined ? "end" : "start"}
          className="w-52"
        >
          {only === undefined && (
            <>
              <ResponsiveMenuItem onClick={onNewFile}>
                <span className={menuIconClassName}>
                  <Icon name="page-add" />
                </span>
                New file
              </ResponsiveMenuItem>
              <ResponsiveMenuItem onClick={onNewSkill}>
                <span className={menuIconClassName}>
                  <SparkleIcon />
                </span>
                New skill
              </ResponsiveMenuItem>
              {!hasInstructions && (
                <ResponsiveMenuItem onClick={onAddInstructions}>
                  <span className={menuIconClassName}>
                    <Icon name="book" />
                  </span>
                  Add instructions
                </ResponsiveMenuItem>
              )}
              <MenuSeparator />
            </>
          )}
          <ResponsiveMenuItem onClick={() => filesInput.current?.click()}>
            <span className={menuIconClassName}>
              <UploadIcon />
            </span>
            Upload files
          </ResponsiveMenuItem>
          <ResponsiveMenuItem onClick={() => folderInput.current?.click()}>
            <span className={menuIconClassName}>
              <Icon name="folder-upload" />
            </span>
            Upload folder
          </ResponsiveMenuItem>
        </MenuContent>
      </ResponsiveMenu>
      <input
        ref={filesInput}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          onUploads(filesFromList(event.target.files));
          event.target.value = "";
        }}
      />
      <input
        ref={folderInput}
        type="file"
        className="hidden"
        {...{ webkitdirectory: "" }}
        onChange={(event) => {
          onUploads(filesFromList(event.target.files));
          event.target.value = "";
        }}
      />
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly children: ReactElement;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is the child
    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
      {hint !== undefined && (
        <span className="text-xs font-normal text-destructive">{hint}</span>
      )}
    </label>
  );
}

export interface NewSkillDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Skill names already in the scope. */
  readonly existing: ReadonlySet<string>;
  readonly onCreate: (name: string, description: string) => Promise<boolean>;
}

export function NewSkillDialog({
  open,
  onOpenChange,
  existing,
  onCreate,
}: NewSkillDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const taken = existing.has(name);
  const valid = skillNamePattern.test(name) && !taken;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !creating && onOpenChange(next)}
    >
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid || creating) return;
            setCreating(true);
            onCreate(name, description.trim()).then((created) => {
              setCreating(false);
              if (!created) return;
              setName("");
              setDescription("");
              onOpenChange(false);
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>New skill</DialogTitle>
            <DialogDescription>
              Creates skills/{name === "" ? "<name>" : name}/SKILL.md in this
              scope
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field
              label="Name"
              hint={taken ? "A skill with this name already exists" : undefined}
            >
              <Input
                value={name}
                onChange={(event) => setName(skillSlug(event.target.value))}
                placeholder="release-check"
                maxLength={64}
                aria-invalid={taken || undefined}
                autoFocus
                required
              />
            </Field>
            <Field label="Description">
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="When Capy should use this skill"
                maxLength={500}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={creating}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" intent="accent" disabled={!valid || creating}>
              {creating ? "Creating" : "Create skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface NewFileDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** The open folder, "" at the root. */
  readonly directory: string;
  readonly existing: ReadonlySet<string>;
  readonly onCreate: (path: string) => Promise<boolean>;
}

/** Capy's shared new-file dialog, kept here until `components/new-file-dialog` lands. */
export function NewFileDialog({
  open,
  onOpenChange,
  directory,
  existing,
  onCreate,
}: NewFileDialogProps) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const target = newFilePath(directory, existing, name);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !creating && onOpenChange(next)}
    >
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!target.valid || creating) return;
            setCreating(true);
            onCreate(target.path).then((created) => {
              setCreating(false);
              if (!created) return;
              setName("");
              onOpenChange(false);
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>New file</DialogTitle>
            <DialogDescription>
              {directory === ""
                ? "At the root of this scope"
                : `In ${directory}/`}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field
              label="Name"
              hint={
                target.collides
                  ? "This path collides with an existing file or folder"
                  : undefined
              }
            >
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="notes/release-plan.md"
                maxLength={255}
                aria-invalid={target.collides || undefined}
                autoFocus
                required
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={creating}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              intent="accent"
              disabled={!target.valid || creating}
            >
              {creating ? "Creating" : "Create file"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const carriesFiles = (event: DragEvent) =>
  [...event.dataTransfer.types].includes("Files");

/** Drag-and-drop upload handlers for a drive page, with an over flag for the overlay. */
export function useFileDrop(onFiles: (files: Array<UploadFile>) => void) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  return {
    over,
    handlers: {
      onDragEnter: (event: DragEvent) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        depth.current += 1;
        setOver(true);
      },
      onDragOver: (event: DragEvent) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      },
      onDragLeave: (event: DragEvent) => {
        if (!carriesFiles(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      },
      onDrop: (event: DragEvent) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        depth.current = 0;
        setOver(false);
        filesFromDrop(event.dataTransfer).then(onFiles);
      },
    },
  };
}

export function DropOverlay({ directory }: { readonly directory: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-(--z-overlay-content) flex items-center justify-center bg-overlay p-6">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-(--radius-panel) border-hairline border-dashed border-border-3 bg-popover px-12 py-10 text-center shadow-overlay">
        <span className="flex size-10 items-center justify-center rounded-(--radius) bg-secondary text-icon-muted">
          <Icon name="folder-upload" className="size-(--icon-lg)" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-base font-medium text-foreground">
            Drop files to upload
          </span>
          <span className="text-sm text-muted-foreground-2">
            {directory === "" ? "Into this scope" : `Into ${directory}/`}
          </span>
        </div>
      </div>
    </div>
  );
}
