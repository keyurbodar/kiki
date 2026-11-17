import { Field } from "@base-ui/react/field";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import {
  type CopyBody,
  type DriveEntry,
  drivePathExists,
  isValidDrivePath,
  suggestedDrivePath,
} from "./logic";
import { RetryButton } from "./machine-states";

export type CopyMachineFileDialogProps = {
  name: string;
  body: CopyBody;
  driveEntries: DriveEntry[] | undefined;
  driveUnavailable?: boolean;
  onRetryDrive: () => void;
  onCopy: (path: string, body: CopyBody) => Promise<void>;
  onClose: () => void;
};

/** Drive copy flow from Capy's machine-path-view, wired through the A3 client. */
export function CopyMachineFileDialog({
  name,
  body,
  driveEntries,
  driveUnavailable = false,
  onRetryDrive,
  onCopy,
  onClose,
}: CopyMachineFileDialogProps) {
  const [path, setPath] = useState(() => suggestedDrivePath(name));
  const [copying, setCopying] = useState(false);
  const exists =
    driveEntries === undefined ? false : drivePathExists(driveEntries, path);
  const valid = isValidDrivePath(path);
  const disabled = driveEntries === undefined || exists || !valid || copying;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    setCopying(true);
    try {
      await onCopy(path, body);
      toast.success("Copied to My Drive", { description: path });
      onClose();
    } catch {
      toast.error("Could not copy to Drive");
    } finally {
      setCopying(false);
    }
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !copying && onClose()}>
      <DialogContent data-slot="copy-machine-file-dialog">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <DialogTitle>Copy to Drive</DialogTitle>
            <DialogDescription>
              Save a copy to My Drive without changing the machine file
            </DialogDescription>
          </div>
          {driveUnavailable && driveEntries === undefined ? (
            <div
              data-slot="copy-machine-file-dialog-unavailable"
              className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground-2"
            >
              <span>Drive unavailable</span>
              <RetryButton onRetry={onRetryDrive} />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Field.Root>
                <Field.Label>Path in My Drive</Field.Label>
                <Input
                  aria-label="Path in My Drive"
                  value={path}
                  autoFocus
                  required
                  aria-invalid={exists || undefined}
                  aria-describedby={exists ? "drive-path-exists" : undefined}
                  onChange={(event) => setPath(event.target.value)}
                />
              </Field.Root>
              {exists && (
                <span
                  id="drive-path-exists"
                  className="text-xs text-destructive"
                >
                  This path already exists
                </span>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={copying}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" intent="accent" disabled={disabled}>
              Copy to Drive
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
