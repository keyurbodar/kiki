import { useEffect, useState } from "react";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";

function FolderNameDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  initialName,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  initialName: string;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);
  const submit = () => {
    const trimmed = name.trim();
    if (trimmed === "") return;
    onSubmit(trimmed);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="folder-name-dialog" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            autoFocus
            aria-label="Folder name"
            placeholder="Folder name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={name.trim() === ""}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewFolderDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}) {
  return (
    <FolderNameDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New folder"
      submitLabel="Create folder"
      initialName=""
      onSubmit={onCreate}
    />
  );
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  name,
  onRename,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onRename: (name: string) => void;
}) {
  return (
    <FolderNameDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Rename folder"
      submitLabel="Rename folder"
      initialName={name}
      onSubmit={onRename}
    />
  );
}
