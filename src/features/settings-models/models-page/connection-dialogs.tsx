import { useState } from "react";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import { toast } from "@/primitives/toaster";

export function RenameSeatDialog({
  service,
  label,
  onClose,
  onRename,
}: {
  service: string;
  label: string;
  onClose: () => void;
  onRename: (displayName: string) => Promise<void>;
}) {
  const [name, setName] = useState(label);
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (trimmed === "") return;
    setSaving(true);
    try {
      await onRename(trimmed);
      onClose();
    } catch {
      toast.error("Could not save the preference");
    } finally {
      setSaving(false);
    }
  };

  const serviceName = service === "claude-code" ? "Claude Code" : service;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={(event) => void submit(event)}>
          <DialogHeader>
            <DialogTitle>Rename {serviceName} subscription</DialogTitle>
            <DialogDescription>
              Shown on this connection in your list and model picker
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <label
              htmlFor="rename-subscription-name"
              className="flex flex-col gap-1 text-xs text-muted-foreground-1"
            >
              Name
              <Input
                id="rename-subscription-name"
                value={name}
                maxLength={128}
                autoFocus
                onChange={(event) => setName(event.currentTarget.value)}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              loading={saving}
              disabled={trimmed === ""}
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MoveToOrganizationDialog({
  name,
  onClose,
  onMove,
}: {
  name: string;
  onClose: () => void;
  onMove: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move {name} to the organization</DialogTitle>
          <DialogDescription>
            Every member's threads can run on it after their own subscriptions
            and keys, and it moves from your list to the end of the
            organization's
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={saving}
            onClick={() => {
              setSaving(true);
              void onMove()
                .then(() => {
                  toast.success(`${name} moved to the organization`);
                  onClose();
                })
                .catch(() => toast.error("Could not move the key"))
                .finally(() => setSaving(false));
            }}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
