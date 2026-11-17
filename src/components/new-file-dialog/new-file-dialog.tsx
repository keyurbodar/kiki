import { type FormEvent, type ReactNode, useRef, useState } from "react";
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
import { Input } from "@/primitives/input";
import { checkNewFile } from "./paths";

export type DialogFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
};

export function DialogField({ label, hint, children }: DialogFieldProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control arrives as children
    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
      {hint !== undefined && (
        <span className="text-xs font-normal text-destructive">{hint}</span>
      )}
    </label>
  );
}

export type NewFileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  directory: string;
  existing: ReadonlySet<string>;
  onCreate: (path: string) => Promise<boolean>;
};

export function NewFileDialog({
  open,
  onOpenChange,
  directory,
  existing,
  onCreate,
}: NewFileDialogProps) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { path, collides, valid } = checkNewFile(directory, existing, name);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || pending) return;
    setPending(true);
    void onCreate(path).then((created) => {
      setPending(false);
      if (!created) return;
      setName("");
      onOpenChange(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent initialFocus={inputRef}>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>New file</DialogTitle>
            <DialogDescription>
              {directory === ""
                ? "At the root of this scope"
                : `In ${directory}/`}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <DialogField
              label="Name"
              hint={
                collides
                  ? "This path collides with an existing file or folder"
                  : undefined
              }
            >
              <Input
                ref={inputRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="notes/release-plan.md"
                maxLength={255}
                aria-invalid={collides || undefined}
                required
              />
            </DialogField>
          </DialogBody>
          <DialogFooter>
            <Button
              data-track-owner="shared/files/new-file-dialog.tsx#NewFileDialog:Button[Cancel]"
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              data-track-owner="shared/files/new-file-dialog.tsx#NewFileDialog:Button[Create file]"
              type="submit"
              intent="accent"
              disabled={!valid || pending}
              aria-busy={pending || undefined}
            >
              {pending ? "Creating" : "Create file"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
