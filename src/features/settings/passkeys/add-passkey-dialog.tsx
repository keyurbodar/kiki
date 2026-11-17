import { useState } from "react";
import { Button } from "@/primitives/button";
import { Checkbox } from "@/primitives/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Label } from "@/primitives/label";

export type AddPasskeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canRequire: boolean;
  onAdd: (passkey: { name: string; require: boolean }) => void;
};

export function AddPasskeyDialog({
  open,
  onOpenChange,
  canRequire,
  onAdd,
}: AddPasskeyDialogProps) {
  const [require, setRequire] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setRequire(false);
        onOpenChange(next);
      }}
    >
      <DialogOverlay />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a passkey</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {canRequire && (
            <Label className="gap-2">
              <Checkbox
                checked={require}
                onCheckedChange={(c) => setRequire(c === true)}
              />
              Require a passkey to sign in
            </Label>
          )}
          <p className="text-sm font-normal text-muted-foreground-1">
            {require
              ? "Only passkeys will sign you in, in every organization and app, and if you lose every passkey only Capy support can restore your account"
              : "Your password and email codes keep working, and you can require a passkey later on this page"}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            intent="accent"
            onClick={() => {
              onAdd({ name: "Passkey", require });
              setRequire(false);
            }}
          >
            Add passkey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
